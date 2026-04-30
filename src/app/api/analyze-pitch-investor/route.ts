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

    const { deckContent, companyName, askAmount } = await req.json()

    if (!serverConfig.anthropicApiKey) {
      return NextResponse.json({ error: 'Service not configured' }, { status: 500 })
    }

    const systemPrompt = `You are a world-class venture capital analyst at a top-tier firm like Sequoia or a16z. 
Your job is to review startup pitch decks and find the truth. You look for deep insights, potential red flags, and critical questions that an investor must ask before writing a check.
Be specific, cynical where necessary, and highly analytical. No fluff.
Return ONLY raw valid JSON. No markdown.`

    const userPrompt = `Analyze this pitch submission:
Company: ${companyName}
Ask: ${askAmount}
Deck/Content: ${deckContent}

Return this exact JSON format:
{
  "strengths": ["string"],
  "redFlags": ["string"],
  "questions": ["string"],
  "verdict": "string (short summary)"
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
