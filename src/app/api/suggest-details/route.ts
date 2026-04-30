import { NextRequest, NextResponse } from 'next/server'
import { serverConfig } from '@/lib/server-config'

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 })
}

export async function POST(req: NextRequest) {
  try {
    if (!serverConfig.anthropicApiKey) {
      return NextResponse.json(
        { error: 'Service not configured.' },
        { status: 500 }
      )
    }

    const { industry, projectType, projectTitle } = await req.json()

    if (!industry || !projectTitle) {
      return NextResponse.json(
        { error: 'Missing parameters' },
        { status: 400 }
      )
    }

    const systemPrompt = `You are a helpful project manager. Based on the industry and project title, suggest a brief project description and 5-6 realistic deliverables.
Return ONLY valid JSON in this format:
{
  "description": "A 2-3 sentence project description.",
  "deliverables": "Deliverable 1\nDeliverable 2\nDeliverable 3\nDeliverable 4\nDeliverable 5"
}`

    const userPrompt = `Industry: ${industry}\nProject Type: ${projectType}\nProject Title: ${projectTitle}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': serverConfig.anthropicApiKey!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    const content = data.content?.[0]?.text || ''
    
    const jsonStr = content.replace(/```json/g, '').replace(/```/g, '').trim()
    const result = JSON.parse(jsonStr)

    return NextResponse.json(result)

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
