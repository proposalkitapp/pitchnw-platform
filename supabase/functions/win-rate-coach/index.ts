import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')

    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'Missing ANTHROPIC_API_KEY' }), { status: 500, headers: corsHeaders })
    }

    const { wonProposals, lostProposals } = await req.json()

    const systemPrompt = `You are a senior sales proposal consultant with 20 years of experience helping freelancers and agencies win high-value clients. You have reviewed thousands of proposals and know exactly what makes clients say yes and what makes them say no. Your feedback is specific, honest, and actionable. You never give vague advice.
Return ONLY raw valid JSON. No markdown.`

    const userPrompt = `Analyze these proposal outcomes and find patterns.

WON PROPOSALS:
${JSON.stringify(wonProposals, null, 2)}

LOST PROPOSALS:
${JSON.stringify(lostProposals, null, 2)}

Return this exact JSON:
{
  "winRate": number percentage,
  "totalAnalyzed": number,
  "patterns": [
    { "title": "string", "detail": "string" }
  ],
  "topRecommendation": "string"
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    
    // Clean JSON
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(jsonStr)

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders
    })
  }
})
