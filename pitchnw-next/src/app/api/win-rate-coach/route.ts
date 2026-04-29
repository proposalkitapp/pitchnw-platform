import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { serverConfig } from '@/lib/server-config'

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { wonProposals, lostProposals } = await req.json()

    if (!serverConfig.anthropicApiKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

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
        'x-api-key': serverConfig.anthropicApiKey!,
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
    
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(jsonStr)

    return NextResponse.json(result)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
