import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from
  '@/lib/supabase/admin'
import { serverConfig } from
  '@/lib/server-config'

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

    const authHeader =
      req.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createAdminClient()
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } =
      await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (profile?.plan !== 'pro') {
      return NextResponse.json(
        {
          error: 'upgrade_required',
          message: 'Pitch Analysis requires Pro plan.'
        },
        { status: 403 }
      )
    }

    const { proposalText } = await req.json()

    if (!proposalText ||
        proposalText.trim().length < 50) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Provide at least 50 characters.'
        },
        { status: 400 }
      )
    }

    const truncated =
      proposalText.substring(0, 12000)

    const claudeResponse = await fetch(
      'https://api.anthropic.com/v1/messages',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': serverConfig.anthropicApiKey!,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 2048,
          system: `You are a senior sales proposal
consultant. Review proposals critically and
honestly. Return ONLY raw valid JSON.`,
          messages: [{
            role: 'user',
            content: `Review this proposal.
Score it 0-100. Be specific and honest.

PROPOSAL:
${truncated}

Return ONLY this JSON:
{
  "score": number,
  "grade": "A or B or C or D or F",
  "summary": "one direct verdict sentence",
  "strengths": [{"point": "string", "why": "string"}],
  "weaknesses": [{"point": "string", "why": "string"}],
  "suggestions": [{
    "section": "string",
    "issue": "string",
    "fix": "string",
    "priority": "high or medium or low"
  }]
}`
          }]
        })
      }
    )

    if (!claudeResponse.ok) {
      return NextResponse.json(
        {
          error: 'ai_error',
          message: 'Analysis failed. Try again.'
        },
        { status: 500 }
      )
    }

    const claudeData = await claudeResponse.json()
    const rawText =
      claudeData.content?.[0]?.text || ''

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
        analysis = JSON.parse(match[0])
      } else {
        return NextResponse.json(
          {
            error: 'parse_error',
            message: 'Could not process analysis.'
          },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      analysis
    })

  } catch (err) {
    console.error('Analysis error:', err)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Something went wrong.'
      },
      { status: 500 }
    )
  }
}
