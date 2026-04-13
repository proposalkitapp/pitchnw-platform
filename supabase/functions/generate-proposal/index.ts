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

const SALES_PITCH_JSON_SCHEMA = `{
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

const TRADITIONAL_JSON_SCHEMA = `{
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
  "web design & development":
    "Use technical web development terminology. Reference phases like Discovery, Wireframing, Design, Development, Testing, and Launch. Mention responsive design, CMS, browser compatibility, performance optimization.",
  "brand identity & logo":
    "Focus on brand strategy, visual identity, color psychology, typography, logo variations, and brand guidelines. Reference deliverables like primary logo, alternate versions, brand style guide, file formats.",
  "copywriting & content":
    "Reference content strategy, brand voice, tone of voice, editorial calendar, SEO, word counts, content types, and usage rights.",
  "photography":
    "Reference shot lists, lighting setups, location scouting, post-processing, image licensing, RAW files, delivery formats, and usage rights.",
  "social media management":
    "Reference platforms by name, posting frequency, content pillars, engagement strategy, community management, analytics reporting, and monthly deliverables.",
  "video production":
    "Reference pre-production, production days, post-production, color grading, sound design, revisions, delivery formats, and distribution rights.",
  "business consulting":
    "Reference stakeholder interviews, situation analysis, strategic frameworks, implementation roadmap, deliverables matrix, and measurable KPIs.",
  "seo & digital marketing":
    "Reference keyword research, technical SEO audit, backlink strategy, content optimization, Google Analytics, monthly reporting, and ranking disclaimers.",
  "ui/ux design":
    "Focus on user-centric design, wireframing, prototyping, user testing, design systems, and seamless navigation. Reference tools like Figma or Adobe XD.",
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("plan, proposals_used")
      .eq("user_id", user.id)
      .single();

    const isFreeUser = !profile?.plan;
    const proposalsUsed = profile?.proposals_used || 0;

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
      ? `\n\nIMPORTANT: Use "${currencySymbol}" as the currency symbol for all pricing in this proposal.`
      : "";

    const projectType = (formData.projectType || "General").toLowerCase();
    const projectTypeCtx = PROJECT_TYPE_CONTEXT[projectType] || "";
    const projectTypeInstruction = projectTypeCtx
      ? `\n\nIMPORTANT: This is a ${formData.projectType} project. Write content that is highly specific to this type of work.\n\nINDUSTRY CONTEXT: ${projectTypeCtx}`
      : "";

    const systemPrompt = `${baseSystemPrompt}${templateContext}${currencyInstruction}${projectTypeInstruction}

REQUIRED JSON SCHEMA:
${jsonSchema}

Write in a ${formData.tone || "professional"} tone. Be specific, detailed, and persuasive. Return ONLY the JSON object.`;

    const userPrompt = `Write a professional client proposal for the following project:

Client Name: ${formData.clientName || "the client"}
Client Email: ${formData.clientEmail || "N/A"}
Project Title: ${formData.projectTitle || "Untitled Project"}
Industry: ${formData.industry || "General"}
Project Type: ${formData.projectType || "General"}
Budget Range: ${formData.budget || "To be discussed"}
Timeline: ${formData.timeline || "To be determined"}
Description: ${formData.description || "No description."}
Key Deliverables: ${formData.deliverables || "As discussed."}

Generate a complete, ready-to-send proposal as a valid JSON object. Do not add any preamble or use markdown code blocks.`;

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
          model: "claude-3-5-sonnet-latest",
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
    console.error('Full error details:', err.message);
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
