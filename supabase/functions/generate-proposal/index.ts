import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { formData, templatePrompt, templateSections, currencySymbol } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const defaultSections = `- Executive Summary
- Project Scope and Objectives
- Deliverables
- Timeline and Milestones
- Budget and Pricing
- Terms and Next Steps`;

    const sectionsText = templateSections
      ? templateSections.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
      : defaultSections;

    const baseSystemPrompt = `You are a professional business proposal writer. You write in clean, formal, polished English. You never use markdown formatting characters (no **, no ##, no backticks, no dashes as bullet points, no quotation marks around headings). You write proposals that sound like they were written by a senior consultant at a top agency. Your tone is confident, specific, and persuasive. Always write in full sentences and paragraphs unless creating a structured list, in which case use clean numbered items only.`;

    const templateContext = templatePrompt
      ? `\n\nTEMPLATE-SPECIFIC INSTRUCTIONS:\n${templatePrompt}`
      : "";

    const systemPrompt = `${baseSystemPrompt}${templateContext}

Include these sections:
${sectionsText}

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

Generate a complete, ready-to-send proposal. Do not use any markdown formatting characters such as **, ##, backticks, or dashes for bullets. Write clean, professional prose with numbered lists where appropriate.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          stream: true,
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
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds in Settings > Workspace > Usage." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "Failed to generate proposal" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("generate-proposal error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
