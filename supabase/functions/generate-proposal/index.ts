// Deploy with: supabase functions deploy generate-proposal
// Required secrets:
// ANTHROPIC_API_KEY
// SUPABASE_SERVICE_ROLE_KEY

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}
const SALES_PITCH_SYSTEM = `You are a world-class sales copywriter who specialises in writing proposals that close deals. You understand buyer psychology at a deep level.

Your writing rules:
- Open with the client's world, not yours. Make them feel immediately understood before you say anything about yourself
- Every paragraph must earn its place by either establishing authority, addressing a fear, or moving the client closer to saying yes
- Write to OUTCOMES not deliverables. Clients do not want a website — they want more customers. They do not want a logo — they want to look credible. Always translate the work into the result it creates
- Preemptively neutralise objections before they arise. Address price, timeline risk, and quality concerns inside the proposal itself
- Use specific, concrete language. Avoid vague words like 'quality', 'professional', 'passionate'. Replace them with evidence and specificity
- Your pricing section must feel like an investment decision not a cost. Frame every price against the value it returns
- Create urgency that feels earned and real — based on timeline constraints or capacity — never fake
- Your call to action must feel like the natural, obvious, low-risk next step — not a sales push
- NEVER use markdown characters, asterisks, hashes, backticks, or quotation marks around headings
- Write in clean, flowing professional English
- Return ONLY valid raw JSON with no wrapper text`;

const TRADITIONAL_SYSTEM = `You are a senior business proposal writer at a top-tier professional services firm. You write clear, structured, and comprehensive proposals that meet corporate and institutional standards.

Your writing rules:
- Use formal, precise, and neutral language
- Structure every section with clear headings and logical flow
- State deliverables, timelines, and terms explicitly and without ambiguity
- Write from a position of professional credibility rather than sales persuasion
- Avoid emotional language — focus on facts, process, and outcomes
- The pricing section must be transparent, itemised, and clearly justified
- Terms and conditions must be comprehensive and professionally worded
- NEVER use markdown characters, asterisks, hashes, backticks, or quotation marks around headings
- Write in clean, formal professional English
- Return ONLY valid raw JSON with no wrapper text`;

const SALES_PITCH_JSON_SCHEMA = `Return a JSON object with exactly these keys:
{
  "executiveSummary": "Opens with client's world and challenge. Builds immediate empathy. Bridges to your solution.",
  "problemStatement": "Articulates exactly what is at stake for the client if this problem goes unsolved. Specific and felt.",
  "proposedSolution": "Your approach framed as the intelligent answer. Specific methodology. Sounds intentional.",
  "uniqueAdvantage": "What separates you. Written with confidence and evidence.",
  "scopeOfWork": { "included": ["..."], "notIncluded": ["..."] },
  "timeline": [{ "phase": "", "duration": "", "deliverables": ["..."] }],
  "pricing": [{ "item": "", "description": "", "amount": "" }],
  "investmentJustification": "Why this price is an investment, not a cost. ROI framing.",
  "urgencyStatement": "Genuine urgency based on timeline or capacity.",
  "termsAndConditions": "Clear and fair terms.",
  "callToAction": "The natural, obvious next step. Low-risk and confident."
}`;

const TRADITIONAL_JSON_SCHEMA = `Return a JSON object with exactly these keys:
{
  "executiveSummary": "Formal overview of the engagement and its objectives.",
  "projectBackground": "Context and background of the client's situation.",
  "proposedApproach": "Methodology and approach, formally stated.",
  "scopeOfWork": { "included": ["..."], "notIncluded": ["..."] },
  "timeline": [{ "phase": "", "duration": "", "deliverables": ["..."] }],
  "pricing": [{ "item": "", "description": "", "amount": "" }],
  "teamAndCredentials": "Professional background and relevant experience.",
  "termsAndConditions": "Comprehensive professional terms.",
  "acceptanceAndNextSteps": "Formal instructions for proceeding."
}`;

const PROJECT_TYPE_CONTEXT: Record<string, string> = {
  "Web Design & Development":
    "Use technical web development terminology. Reference phases like Discovery, Wireframing, Design, Development, Testing, and Launch. Mention responsive design, CMS, browser compatibility, performance optimization.",
  "Brand Identity & Logo":
    "Focus on brand strategy, visual identity, color psychology, typography, logo variations, and brand guidelines. Reference deliverables like primary logo, alternate versions, brand style guide, file formats.",
  "Copywriting & Content":
    "Reference content strategy, brand voice, tone of voice, editorial calendar, SEO, word counts, content types, and usage rights.",
  Photography:
    "Reference shot lists, lighting setups, location scouting, post-processing, image licensing, RAW files, delivery formats, and usage rights.",
  "Social Media Management":
    "Reference platforms by name, posting frequency, content pillars, engagement strategy, community management, analytics reporting, and monthly deliverables.",
  "Video Production":
    "Reference pre-production, production days, post-production, color grading, sound design, revisions, delivery formats, and distribution rights.",
  "Business Consulting":
    "Reference stakeholder interviews, situation analysis, strategic frameworks, implementation roadmap, deliverables matrix, and measurable KPIs.",
  "SEO & Digital Marketing":
    "Reference keyword research, technical SEO audit, backlink strategy, content optimization, Google Analytics, monthly reporting, and ranking disclaimers.",
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
    const body = await req.json();
    // Support both flattened structure (requested) and legacy formData structure
    const formData = body.formData || {
      clientName: body.clientName,
      clientEmail: body.clientEmail,
      projectTitle: body.projectTitle,
      industry: body.industry || body.clientCompany,
      projectType: body.projectType,
      budget: body.budget,
      timeline: body.timeline || body.duration,
      description: body.description || body.requirements,
      deliverables: body.deliverables || body.scopeIncluded,
      tone: body.tone
    };
    
    const { proposalMode, templatePrompt, templateSections, currencySymbol } = body;
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    const mode = proposalMode === "traditional" ? "traditional" : "sales_pitch";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch profile: plan (null = free) and proposals_used counter
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, proposals_used")
      .eq("user_id", user.id)
      .single();

    // null plan means free user; only 'pro' is a paid plan
    const isFreeUser = !profile?.plan;
    const proposalsUsed = profile?.proposals_used || 0;

    // Server-side limit check — blocks API abuse even if frontend is bypassed
    if (isFreeUser && proposalsUsed >= 3) {
      return new Response(
        JSON.stringify({
          error: "limit_reached",
          message: "You have used all 3 free proposals. Upgrade to Pro for unlimited generation.",
          code: "LIMIT_REACHED",
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment proposals_used BEFORE calling AI (optimistic, prevents double-generation exploits)
    if (isFreeUser) {
      await supabase
        .from("profiles")
        .update({ proposals_used: proposalsUsed + 1 })
        .eq("user_id", user.id);
    }

    const baseSystemPrompt = mode === "sales_pitch" ? SALES_PITCH_SYSTEM : TRADITIONAL_SYSTEM;
    const jsonSchema = mode === "sales_pitch" ? SALES_PITCH_JSON_SCHEMA : TRADITIONAL_JSON_SCHEMA;

    const templateContext = templatePrompt ? `\n\nTEMPLATE-SPECIFIC INSTRUCTIONS:\n${templatePrompt}` : "";

    const currencyInstruction = currencySymbol && currencySymbol !== "$"
      ? `\n\nIMPORTANT: Use "${currencySymbol}" as the currency symbol for all pricing in this proposal. Do not use $ unless the client specifically uses USD.`
      : "";

    // Project type specific context
    const projectType = formData.projectType || "General";
    const projectTypeCtx = PROJECT_TYPE_CONTEXT[projectType] || "";
    const projectTypeInstruction = projectTypeCtx
      ? `\n\nIMPORTANT: This is a ${projectType} project. Write content that is highly specific to this type of work. Use terminology, deliverables, and framing that is native to ${projectType} professionals. Do not write a generic proposal that could apply to any project type. Every section must reflect the specific nature of ${projectType} work.\n\nINDUSTRY CONTEXT: ${projectTypeCtx}`
      : "";

    const systemPrompt = `${baseSystemPrompt}${templateContext}${currencyInstruction}${projectTypeInstruction}

${jsonSchema}

Write in a ${formData.tone || "professional"} tone. Be specific, detailed, and persuasive. Make the proposal feel tailored and high-quality.`;

    const userPrompt = `Write a professional client proposal for the following project:

Client Name: ${formData.clientName || "the client"}
Client Email: ${formData.clientEmail || "N/A"}
Project Title: ${formData.projectTitle || "Untitled Project"}
Industry: ${formData.industry || "General"}
Project Type: ${formData.projectType || "General"}
Budget Range: ${formData.budget || "To be discussed"}
Timeline: ${formData.timeline || "To be determined"}
Description: ${formData.description || "No additional description provided."}
Key Deliverables: ${formData.deliverables || "As discussed with client."}

Generate a complete, ready-to-send proposal as a valid JSON object. Do not use any markdown formatting characters such as **, ##, backticks, or dashes for bullets. Write clean, professional prose with numbered lists where appropriate.`;

    const response = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            { role: "user", content: userPrompt },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Anthropic API error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Failed to generate proposal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await response.json();
    const content = result.content[0].text;

    return new Response(
      JSON.stringify({ content }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error('Full error details:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return new Response(
      JSON.stringify({
        error: 'generation_failed',
        message: err.message || 'Generation failed'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
});
