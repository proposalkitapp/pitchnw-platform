import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {

    // CHECK REQUIRED SECRETS FIRST
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!anthropicKey) {
      console.error('MISSING SECRET: ANTHROPIC_API_KEY')
      return new Response(
        JSON.stringify({
          error: 'configuration_error',
          message: 'AI service not configured.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // VERIFY USER JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const supabase = createClient(supabaseUrl!, serviceRoleKey!)
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // FETCH USER PROFILE
    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('plan, proposals_used, is_banned, company_name, display_name')
        .eq('user_id', user.id)
        .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      return new Response(
        JSON.stringify({ error: 'Could not load user profile' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // CHECK BAN
    if (profile?.is_banned) {
      return new Response(
        JSON.stringify({ error: 'Account suspended' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // CHECK FREE PLAN LIMIT
    const isFreeUser = !profile?.plan
    const proposalsUsed = profile?.proposals_used || 0

    if (isFreeUser && proposalsUsed >= 3) {
      return new Response(
        JSON.stringify({
          error: 'limit_reached',
          message: 'You have used all 3 free proposals. ' +
            'Upgrade to Pro for unlimited generation.'
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // READ REQUEST BODY
    let body
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid request body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const {
      clientName,
      clientCompany,
      projectType,
      projectTitle,
      requirements,
      currency = 'USD',
      budget,
      budgetType,
      scopeIncluded,
      scopeExcluded,
      duration,
      tone = 'professional',
      preparedBy,
      proposalMode = 'sales_pitch',
      templateCategory
    } = body

    // VALIDATE REQUIRED FIELDS
    if (!clientName || !projectType || !requirements) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Client name, project type, and requirements are required.'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // CURRENCY SYMBOLS
    const symbols: Record<string, string> = {
      USD: '$', NGN: '₦', GBP: '£', EUR: '€',
      CAD: 'CA$', AUD: 'A$', GHS: '₵',
      KES: 'KSh', ZAR: 'R', EGP: 'E£'
    }
    const sym = symbols[currency] || '$'

    // BUILD CLAUDE PROMPT
    const systemPrompt = proposalMode === 'sales_pitch'
      ? `You are a world-class sales copywriter who
         writes proposals that close deals. Write
         persuasively, speak to client outcomes not
         deliverables, preempt objections, and make
         every section move the client toward yes.
         NEVER use markdown characters.
         Return ONLY raw valid JSON.`
      : `You are a senior business proposal writer.
         Write clearly, formally, and professionally.
         NEVER use markdown characters.
         Return ONLY raw valid JSON.`

    const userPrompt = `Write a proposal for this project:
Client: ${clientName}${clientCompany ? ', ' + clientCompany : ''}
Project: ${projectTitle || projectType}
Type: ${projectType}
Requirements: ${requirements}
Budget: ${sym}${budget} (${budgetType})
Duration: ${duration}
Tone: ${tone}
Prepared by: ${preparedBy || profile?.display_name || ''}
${scopeIncluded ? 'Included: ' + scopeIncluded : ''}
${scopeExcluded ? 'Not included: ' + scopeExcluded : ''}

Return ONLY this JSON with no markdown, no backticks:
{
  "executiveSummary": "string",
  "problemStatement": "string",
  "proposedSolution": "string",
  "uniqueAdvantage": "string",
  "scopeOfWork": {
    "included": ["string"],
    "notIncluded": ["string"]
  },
  "timeline": [
    {"phase": "string", "duration": "string",
     "deliverables": ["string"]}
  ],
  "pricing": [
    {"item": "string", "description": "string",
     "amount": "${sym}0"}
  ],
  "termsAndConditions": "string",
  "callToAction": "string"
}`

    // CALL CLAUDE API
    const claudeResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }]
        })
      }
    )

    if (!claudeResponse.ok) {
      const claudeError = await claudeResponse.text()
      console.error('Claude API error:', claudeError)
      return new Response(
        JSON.stringify({
          error: 'ai_error',
          message: 'AI generation failed. Please try again.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const claudeData = await claudeResponse.json()
    const rawText = claudeData.content?.[0]?.text || ''

    // PARSE JSON FROM CLAUDE RESPONSE
    let proposalContent
    try {
      const cleaned = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      proposalContent = JSON.parse(cleaned)
    } catch {
      // Try extracting JSON from the response
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          proposalContent = JSON.parse(match[0])
        } catch {
          console.error('JSON parse failed:', rawText)
          return new Response(
            JSON.stringify({
              error: 'parse_error',
              message: 'Failed to parse proposal. Try again.'
            }),
            {
              status: 500,
              headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
              }
            }
          )
        }
      }
    }

    // SAVE PROPOSAL TO DATABASE
    const { data: proposal, error: insertError } =
      await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          title: `${projectTitle || projectType} — ${clientName}`,
          client_name: clientName,
          client_company: clientCompany || null,
          project_type: projectType,
          currency: currency,
          generated_content: JSON.stringify(proposalContent),
          status: 'draft'
        })
        .select()
        .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return new Response(
        JSON.stringify({
          error: 'save_error',
          message: 'Proposal generated but could not be saved.'
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // INCREMENT COUNTER FOR FREE USERS ONLY
    if (isFreeUser) {
      await supabase
        .from('profiles')
        .update({ proposals_used: proposalsUsed + 1 })
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({ success: true, proposal }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )

  } catch (err) {
    console.error('Unhandled error:', err)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: 'Something went wrong. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
