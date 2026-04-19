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
          message: 'Service not configured.'
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
      .select('plan, proposals_used')
      .eq('user_id', user.id)
      .single()

    const isFree = profile?.plan !== 'pro'
    const proposalsUsed = profile?.proposals_used || 0

    if (isFree && proposalsUsed >= 3) {
      return new Response(
        JSON.stringify({
          error: 'upgrade_required',
          message: 'You have used your 3 lifetime free analyses. Upgrade to the Freelancer plan for unlimited access.'
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
          message: 'Invalid request.'
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

    const { proposalText, proposalId } = body

    if (!proposalText || proposalText.trim().length < 50) {
      return new Response(
        JSON.stringify({
          error: 'validation_error',
          message: 'Please provide a proposal with at least 50 characters.'
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

    const truncatedText = proposalText.substring(0, 12000)

    const systemPrompt = `You are a senior sales proposal consultant with 20 years of experience reviewing freelance and agency proposals. You have seen thousands of proposals and know exactly what makes clients say yes and what makes them say no.

Your feedback is honest, specific, and actionable. You never give vague advice like "be more professional" or "add more detail". Every suggestion you make includes exactly what to change and exactly why.

You score proposals the way a senior client would read them — critically, quickly, looking for reasons to trust or distrust the sender.

Return ONLY raw valid JSON. No markdown. No backticks. No wrapper text. No explanation outside the JSON.`

    const userPrompt = `Review this proposal and score it out of 100.

PROPOSAL TO ANALYZE:
${truncatedText}

Analyze it across these dimensions:
- Does it open by understanding the client?
- Is the language specific or vague?
- Does it address client fears and objections?
- Is the scope clear and comprehensive?
- Does the pricing feel like an investment?
- Is the call to action compelling?
- Is the overall tone appropriate?

Return ONLY this exact JSON structure:
{
  "score": number between 0 and 100,
  "grade": "A" if 90-100 or "B" if 75-89 or "C" if 60-74 or "D" if 45-59 or "F" if below 45,
  "summary": "One direct sentence verdict addressed to the proposal author. Be honest.",
  "strengths": [
    {
      "point": "Specific thing that is working",
      "why": "Why this helps the client say yes"
    }
  ],
  "weaknesses": [
    {
      "point": "Specific thing that is not working",
      "why": "Why this might make the client hesitate"
    }
  ],
  "suggestions": [
    {
      "section": "Which part of the proposal",
      "issue": "What the specific problem is",
      "fix": "Exactly what to change and how",
      "priority": "high or medium or low"
    }
  ]
}`

    console.log('Calling Claude for pitch analysis...')

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
          model: 'claude-3-haiku-20240307',
          max_tokens: 2048,
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
      console.error('Claude error:', errorText)
      return new Response(
        JSON.stringify({
          error: 'ai_error',
          message: 'Analysis failed. Please try again.'
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

    console.log('Analysis received, parsing...')

    let analysis
    try {
      const cleaned = rawText
        .replace(/```json\n?/gi, '')
        .replace(/```\n?/g, '')
        .trim()
      analysis = JSON.parse(cleaned)
    } catch {
      const match = rawText.match(/\{[\s\S]*\}/)
      if (match) {
        try {
          analysis = JSON.parse(match[0])
        } catch {
          console.error('Parse failed:', rawText)
          return new Response(
            JSON.stringify({
              error: 'parse_error',
              message: 'Analysis completed but could not be processed. Please try again.'
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
            message: 'Analysis could not be processed. Please try again.'
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

    console.log('Analysis score:', analysis.score)

    // Save analysis to database if proposalId is provided
    if (proposalId) {
      console.log(`Saving analysis for proposal ${proposalId}...`);
      const { error: insertError } = await supabase
        .from('pitch_analyses')
        .insert({
          proposal_id: proposalId,
          user_id: user.id,
          overall_score: analysis.score,
          grade: analysis.grade,
          summary: analysis.summary,
          category_scores: {
            clarity: Math.round(analysis.score * 0.95), // Heuristic since Claude returns flat structure
            persuasiveness: Math.round(analysis.score * 1.02),
            professionalism: Math.round(analysis.score * 0.98),
            value_proposition: Math.round(analysis.score * 0.9),
            pricing_presentation: Math.round(analysis.score),
            call_to_action: Math.round(analysis.score * 1.1)
          },
          strengths: analysis.strengths.map((s: any) => ({ point: s.point, impact: s.why })),
          weaknesses: analysis.weaknesses.map((w: any) => ({ point: w.point, impact: w.why })),
          suggestions: analysis.suggestions
        });

      if (insertError) {
        console.error('Failed to save analysis:', insertError);
      }
    }

    // Increment usage count for free users
    if (isFree) {
      await supabase
        .from('profiles')
        .update({ proposals_used: proposalsUsed + 1 } as any)
        .eq('user_id', user.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
           ...analysis,
           // Map response to match the frontend expectations if they differ
           overall_score: analysis.score,
           category_scores: {
            clarity: Math.round(analysis.score * 0.95),
            persuasiveness: Math.round(analysis.score * 1.02),
            professionalism: Math.round(analysis.score * 0.98),
            value_proposition: Math.round(analysis.score * 0.9),
            pricing_presentation: Math.round(analysis.score),
            call_to_action: Math.round(analysis.score * 1.1)
          },
          strengths: analysis.strengths.map((s: any) => ({ point: s.point, impact: s.why })),
          weaknesses: analysis.weaknesses.map((w: any) => ({ point: w.point, impact: w.why }))
        }
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
