import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from
  '@/lib/supabase/admin'
import { serverConfig } from
  '@/lib/server-config'

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    if (!serverConfig.anthropicApiKey) {
      return NextResponse.json(
        {
          error: 'configuration_error',
          message: 'Service not configured.'
        },
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
      .select('plan, proposals_used, is_banned, display_name, company_name')
      .eq('id', user.id)
      .single()

    if (profile?.is_banned) {
      return NextResponse.json(
        { error: 'Account suspended.' },
        { status: 403 }
      )
    }

    const isFreeUser = !profile?.plan
    const proposalsUsed =
      profile?.proposals_used || 0

    if (isFreeUser && proposalsUsed >= 3) {
      return NextResponse.json(
        {
          error: 'limit_reached',
          message: 'Upgrade to Pro for unlimited generation.'
        },
        { status: 403 }
      )
    }

    const body = await req.json()

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
      proposalMode = 'sales_pitch',
      targetContext
    } = body

    if (!clientName || !projectType ||
        !requirements) {
      return NextResponse.json(
        {
          error: 'validation_error',
          message: 'Client name, project type, and requirements are required.'
        },
        { status: 400 }
      )
    }

    const symbols: Record<string, string> = {
      USD: '$', NGN: '₦', GBP: '£',
      EUR: '€', CAD: 'CA$', AUD: 'A$',
      GHS: '₵', KES: 'KSh', ZAR: 'R'
    }
    const sym = symbols[currency] || '$'

    const authorName =
      preparedBy ||
      (profile as any)?.display_name ||
      'The Team'

    const contextualBlock = targetContext
      ? `
TARGET AUDIENCE CONTEXT:
Audience Type: ${targetContext.audienceType || ''}
${targetContext.companyName ?
  'Organization: ' + targetContext.companyName : ''}
${targetContext.industry ?
  'Industry: ' + targetContext.industry : ''}
${targetContext.decisionMaker ?
  'Decision Maker: ' + targetContext.decisionMaker : ''}
${targetContext.notes ?
  'Additional Context: ' + targetContext.notes : ''}

Adjust the proposal language and framing
specifically for this audience type.`
      : ''

    const systemPrompt = proposalMode === 'sales_pitch'
      ? `You are a world-class sales consultant
who writes proposals that close deals.
Make every sentence move the client toward yes.
Write to outcomes not deliverables.
Frame all pricing as investment not cost.
${contextualBlock}
Zero markdown. Return ONLY raw valid JSON.`
      : `You are a senior business proposal writer.
Write clearly and formally.
${contextualBlock}
Zero markdown. Return ONLY raw valid JSON.`

    const userPrompt = `Write a complete proposal.

CLIENT: ${clientName}
${clientCompany ? 'COMPANY: ' + clientCompany : ''}
PROJECT: ${projectTitle || projectType}
TYPE: ${projectType}
REQUIREMENTS: ${requirements}
BUDGET: ${sym}${budget} (${budgetType})
DURATION: ${duration}
TONE: ${tone}
PREPARED BY: ${authorName}
${scopeIncluded ? 'INCLUDED: ' + scopeIncluded : ''}
${scopeExcluded ? 'EXCLUDED: ' + scopeExcluded : ''}

Return ONLY this JSON, no markdown, no backticks:
{
  "executiveSummary": "2-3 paragraphs",
  "problemStatement": "1-2 paragraphs",
  "proposedSolution": "2-3 paragraphs",
  "uniqueAdvantage": "1-2 paragraphs",
  "scopeOfWork": {
    "included": ["outcome-focused item"],
    "notIncluded": ["exclusion with reason"]
  },
  "timeline": [
    {
      "phase": "Phase name",
      "duration": "X weeks",
      "deliverables": ["item"]
    }
  ],
  "pricing": [
    {
      "item": "Service name",
      "description": "Value delivered",
      "amount": "${sym}0,000"
    }
  ],
  "investmentJustification": "1 paragraph",
  "termsAndConditions": "Professional terms",
  "callToAction": "1 strong closing paragraph"
}`

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
      console.error('Claude error:',
        await claudeResponse.text())
      return NextResponse.json(
        {
          error: 'ai_error',
          message: 'AI generation failed. Try again.'
        },
        { status: 500 }
      )
    }

    const claudeData = await claudeResponse.json()
    const rawText =
      claudeData.content?.[0]?.text || ''

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
        } catch {
          return NextResponse.json(
            {
              error: 'parse_error',
              message: 'Processing failed. Try again.'
            },
            { status: 500 }
          )
        }
      } else {
        return NextResponse.json(
          {
            error: 'parse_error',
            message: 'Processing failed. Try again.'
          },
          { status: 500 }
        )
      }
    }

    const { data: proposal, error: insertError } =
      await supabase
        .from('proposals')
        .insert({
          user_id: user.id,
          title: projectTitle ||
            `${projectType} — ${clientName}`,
          client_name: clientName,
          project_type: projectType,
          generated_content: JSON.stringify(proposalContent),
          status: 'draft'
        } as any)
        .select()
        .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      return NextResponse.json(
        {
          error: 'save_error',
          message: 'Could not save proposal.'
        },
        { status: 500 }
      )
    }

    if (isFreeUser) {
      await supabase
        .from('profiles')
        .update({
          proposals_used: proposalsUsed + 1
        })
        .eq('id', user.id)
    }

    return NextResponse.json({
      success: true,
      proposal
    })

  } catch (err) {
    console.error('Unhandled error:', err)
    return NextResponse.json(
      {
        error: 'internal_error',
        message: 'Something went wrong.'
      },
      { status: 500 }
    )
  }
}
