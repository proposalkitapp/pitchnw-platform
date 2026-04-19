import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!anthropicKey) {
      console.error('MISSING: ANTHROPIC_API_KEY')
      return new Response(
        JSON.stringify({
          error: 'configuration_error',
          message: 'AI service not configured. Contact support at hello@pitchnw.app'
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

    const authHeader = req.headers.get('Authorization')

    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const supabase = createClient(
      supabaseUrl!,
      serviceRoleKey!
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, proposals_used, is_banned, full_name, company_name, proposal_header_title')
      .eq('user_id', user.id)
      .single()

    if (profile?.is_banned) {
      return new Response(
        JSON.stringify({
          error: 'banned',
          message: 'Account suspended.'
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const isFreeUser = !profile?.plan
    const proposalsUsed = profile?.proposals_used || 0

    if (isFreeUser && proposalsUsed >= 3) {
      return new Response(
        JSON.stringify({
          error: 'limit_reached',
          message: 'You have used all 3 free proposals. Upgrade to Pro for unlimited generation.'
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    let body
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({
          error: 'invalid_body',
          message: 'Invalid request body.'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
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
      budgetType = 'Fixed Price',
      scopeIncluded,
      scopeExcluded,
      duration,
      tone = 'professional',
      preparedBy,
      proposalMode = 'sales_pitch'
    } = body

    if (!clientName || !projectType || !requirements) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Client name, project type, and requirements are required.'
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      )
    }

    const symbols: Record<string, string> = {
      USD: '$', NGN: '₦', GBP: '£',
      EUR: '€', CAD: 'CA$', AUD: 'A$',
      GHS: '₵', KES: 'KSh', ZAR: 'R'
    }
    const sym = symbols[currency] || '$'

    const authorName = preparedBy || profile?.full_name || 'The Team'
    const companyName = profile?.proposal_header_title || profile?.company_name || authorName

    const categoryContext: Record<string, string> = {
      'web-design': 'This is a web design and development project. Use technical credibility, reference clear phases like Discovery, Design, Development, Testing, Launch. Frame the website as a business tool that generates revenue, not just a design deliverable.',
      'branding': 'This is a brand identity project. Focus on the business impact of strong branding — trust, recognition, pricing power. Reference deliverables like logo system, color palette, typography, brand guidelines, and file formats.',
      'copywriting': 'This is a copywriting project. Reference voice, tone, conversion rates, word counts, content types, and usage rights. Frame copy as a revenue driver.',
      'photography': 'This is a photography project. Reference shot list, licensing, usage rights, delivery formats, and the uniqueness of the moment being captured.',
      'social-media': 'This is a social media management project. Reference platforms, posting frequency, content pillars, engagement strategy, and monthly reporting.',
      'video': 'This is a video production project. Reference pre-production, shoot days, post-production, revision rounds, delivery formats, and usage rights.',
      'consulting': 'This is a consulting engagement. Use executive language. Reference methodology, stakeholder interviews, deliverables, ROI, and measurable outcomes.',
      'marketing': 'This is an SEO and digital marketing project. Reference keyword research, technical audits, content strategy, link building, and include a disclaimer that results are projections.'
    }

    const projectContext = categoryContext[projectType] || ''

    const toneInstructions: Record<string, string> = {
      professional: 'authoritative and polished — the voice of a trusted expert',
      friendly: 'warm and consultative — like a senior advisor who genuinely cares about outcomes',
      formal: 'precise and executive — appropriate for corporate and institutional clients',
      bold: 'confident and direct — assertive without being aggressive'
    }

    const toneGuide = toneInstructions[tone.toLowerCase()] || toneInstructions.professional

    const systemPrompt = proposalMode === 'sales_pitch'
      ? `You are a world-class sales consultant who has personally closed over $50 million in freelance and agency contracts across every creative and professional services category.

You write proposals that make clients feel understood before they have spoken to anyone. Every word you write has one purpose: to move the client from hesitation to certainty.

Your non-negotiable rules:
- Open by describing the client's situation better than they could describe it themselves
- Never use the words: professional, passionate, quality, experienced, or dedicated. Replace every vague claim with specific evidence
- Write to outcomes, never to deliverables. Clients do not want a website. They want customers. Clients do not want a logo. They want to be taken seriously. Always translate the work into the result it creates for the client's business
- Every pricing section must feel like an investment decision, not a cost comparison
- Preempt every objection before the client thinks of it. Address price, timeline, and quality concerns inside the proposal itself
- Your call to action must feel like the natural next step, not a sales push
- ${projectContext}

CRITICAL FORMAT RULES:
Write in clean flowing English only.
Zero markdown characters anywhere.
No asterisks, no hashes, no backticks.
No bullet dashes. No quotation marks around headings. Full sentences only.
Return ONLY raw valid JSON. No exceptions.`
      : `You are a senior business proposal writer at a top professional services firm. You write proposals that are clear, comprehensive, and meet the highest corporate and institutional standards. ${projectContext}
Write in formal, precise English.
Zero markdown. Return ONLY raw valid JSON.`

    const userPrompt = `Write a complete proposal.

CLIENT: ${clientName}
${clientCompany ? 'COMPANY: ' + clientCompany : ''}
PROJECT TYPE: ${projectType}
PROJECT TITLE: ${projectTitle || projectType}
REQUIREMENTS: ${requirements}
BUDGET: ${sym}${budget} (${budgetType})
DURATION: ${duration}
TONE: ${toneGuide}
PREPARED BY: ${authorName} — ${companyName}
${scopeIncluded ? 'SCOPE INCLUDED: ' + scopeIncluded : ''}
${scopeExcluded ? 'SCOPE EXCLUDED: ' + scopeExcluded : ''}

Return ONLY this JSON. No markdown. No backticks. No wrapper text. Raw JSON only:

{
  "executiveSummary": "2-3 paragraphs. Open with the client's world and their challenge. Make them feel understood immediately. Bridge to your solution in the final sentence.",
  "problemStatement": "1-2 paragraphs. Articulate exactly what is at stake if this problem goes unsolved. Be specific. Show you understand their situation better than they expected.",
  "proposedSolution": "2-3 paragraphs. Present your specific approach. Reference the project type methodology. Sound intentional and expert.",
  "uniqueAdvantage": "1-2 paragraphs. What makes you the right choice specifically for this client and this project. No vague claims. Only specific and credible.",
  "scopeOfWork": {
    "included": ["Specific outcome-focused deliverable", "Another deliverable written as a result not a task"],
    "notIncluded": ["Specific exclusion with brief reason"]
  },
  "timeline": [
    {
      "phase": "Strategic phase name",
      "duration": "X weeks",
      "deliverables": ["Outcome-focused item"]
    }
  ],
  "pricing": [
    {
      "item": "Service or phase name",
      "description": "One sentence on the value this delivers",
      "amount": "${sym}0,000"
    }
  ],
  "investmentJustification": "1 paragraph. Frame the total investment as a business decision. Reference the return the client gets. Make the price feel inevitable.",
  "termsAndConditions": "Professional payment terms, revision policy, and project commencement conditions. Written clearly.",
  "callToAction": "1 strong closing paragraph. Make moving forward feel natural, obvious, and low-risk. End with a specific action."
}`

    console.log('Calling Claude API...')

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
          model: 'claude-3-opus-20240229',
          max_tokens: 4096,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: userPrompt
          }]
        })
      }
    )

    if (!claudeResponse.ok) {
      const errorText = await claudeResponse.text()
      console.error('Claude API failed:', errorText)
      return new Response(
        JSON.stringify({
          error: 'ai_error',
          message: 'AI generation failed. Please try again.'
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

    const claudeData = await claudeResponse.json()
    const rawText = claudeData.content?.[0]?.text || ''

    console.log('Claude response received, parsing...')

    let proposalContent
    try {
      const cleaned = rawText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim()
      proposalContent = JSON.parse(cleaned)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          proposalContent = JSON.parse(match[0])
        } catch (parseErr) {
          console.error('JSON parse failed:', rawText.substring(0, 500))
          return new Response(
            JSON.stringify({
              error: 'parse_error',
              message: 'Proposal generated but could not be processed. Please try again.'
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
      } else {
        return new Response(
          JSON.stringify({
            error: 'parse_error',
            message: 'Proposal generated but could not be processed. Please try again.'
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

    const { data: proposal, error: insertError } = await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          title: projectTitle || `${projectType} — ${clientName}`,
          client_name: clientName,
          client_company: clientCompany || null,
          project_type: projectType,
          currency: currency,
          content: proposalContent,
          status: 'draft'
        })
        .select()
        .single()

    if (insertError) {
      console.error('Insert failed:', insertError)
      return new Response(
        JSON.stringify({
          error: 'save_error',
          message: 'Proposal created but could not be saved. Please try again.'
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

    if (isFreeUser) {
      await supabase
        .from('profiles')
        .update({
          proposals_used: proposalsUsed + 1
        })
        .eq('user_id', user.id)
    }

    console.log('Proposal saved:', proposal.id)

    return new Response(
      JSON.stringify({
        success: true,
        proposal
      }),
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    )
  }
})
