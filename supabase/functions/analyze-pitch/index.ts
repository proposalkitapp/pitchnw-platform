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
      { status: 405, headers: corsHeaders }
    )
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!anthropicKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Service not configured' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    const supabase = createClient(supabaseUrl!, serviceRoleKey!)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      )
    }

    // VERIFY PRO PLAN
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'pro') {
      return new Response(
        JSON.stringify({
          error: 'upgrade_required',
          message: 'Pitch Analysis requires a Pro plan.'
        }),
        { status: 403, headers: corsHeaders }
      )
    }

    const { proposalId, proposalContent } = await req.json()

    if (!proposalId || !proposalContent) {
      return new Response(
        JSON.stringify({ error: 'Missing proposal data' }),
        { status: 400, headers: corsHeaders }
      )
    }

    const systemPrompt = `You are an expert sales proposal analyst. You evaluate business proposals the same way a potential client would — critically, honestly, and with a focus on conversion.

You score proposals like a senior sales director reviewing them before they go to a high-value client. Your job is to identify exactly what will make the client say yes or no.

Return ONLY raw valid JSON. No markdown. No backticks.`

    const userPrompt = `Analyze this business proposal and score it out of 100.

PROPOSAL CONTENT:
${JSON.stringify(proposalContent, null, 2)}

Return ONLY this JSON structure:
{
  "overall_score": number between 0 and 100,
  "grade": "A" if 90-100, "B" if 75-89, "C" if 60-74, "D" if 45-59, "F" if 0-44,
  "category_scores": {
    "clarity": number 0-100,
    "persuasiveness": number 0-100,
    "professionalism": number 0-100,
    "value_proposition": number 0-100,
    "pricing_presentation": number 0-100,
    "call_to_action": number 0-100
  },
  "strengths": [
    {
      "point": "string — what is working well",
      "impact": "string — why this helps conversion"
    }
  ],
  "weaknesses": [
    {
      "point": "string — what is not working",
      "impact": "string — how this hurts conversion"
    }
  ],
  "suggestions": [
    {
      "section": "string — which section to fix",
      "issue": "string — what the problem is",
      "fix": "string — exactly how to fix it",
      "priority": "high" or "medium" or "low"
    }
  ],
  "summary": "string — 2-3 sentence overall verdict written directly to the proposal author"
}`

    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text()
      console.error('Claude error:', err)
      return new Response(
        JSON.stringify({ error: 'AI analysis failed' }),
        { status: 500, headers: corsHeaders }
      )
    }

    const claudeData = await claudeResponse.json()
    const rawText = claudeData.content?.[0]?.text || ''

    let analysis
    try {
      const cleaned = rawText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()
      analysis = JSON.parse(cleaned)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        analysis = JSON.parse(match[0])
      } else {
        return new Response(
          JSON.stringify({
            error: 'parse_error',
            message: 'Analysis failed to parse.'
          }),
          { status: 500, headers: corsHeaders }
        )
      }
    }

    const { data: savedAnalysis, error: saveError } = await supabase
      .from('pitch_analyses')
      .insert({
        proposal_id: proposalId,
        user_id: user.id,
        overall_score: analysis.overall_score,
        grade: analysis.grade,
        category_scores: analysis.category_scores,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        suggestions: analysis.suggestions,
        summary: analysis.summary
      })
      .select()
      .single()

    if (saveError) {
      console.error('Save error:', saveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: savedAnalysis || analysis
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    console.error('Analysis error:', err)
    return new Response(
      JSON.stringify({
        error: 'internal_error',
        message: err.message || 'Analysis failed.'
      }),
      { status: 500, headers: corsHeaders }
    )
  }
})
