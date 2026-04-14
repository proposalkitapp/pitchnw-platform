import { getBlueprintByIndustry, type IndustryBlueprint } from "./blueprints";

interface GenerationData {
  clientName: string;
  industry: string;
  projectTitle: string;
  projectType: string;
  budget: string;
  timeline: string;
  tone: string;
  deliverables?: string;
  description?: string;
}

export interface GeneratedProposalJSON {
  executiveSummary: string;
  problemStatement: string;
  proposedSolution: string;
  scopeOfWork: {
    included: string[];
    notIncluded: string[];
  };
  timeline: {
    phase: string;
    duration: string;
    deliverables: string[];
  }[];
  pricing: {
    item: string;
    description: string;
    amount: string;
  }[];
  termsAndConditions: string;
  callToAction: string;
}

export function generateSmartProposal(data: GenerationData): GeneratedProposalJSON {
  const blueprint = getBlueprintByIndustry(data.projectType || data.industry) || getBlueprintByIndustry("web");
  const tone = (data.tone?.toLowerCase() || "professional") as "professional" | "bold" | "friendly" | "minimal";
  
  const replaceVars = (text: string) => {
    return text
      .replace(/{clientName}/g, data.clientName || "your company")
      .replace(/{projectTitle}/g, data.projectTitle || "the project")
      .replace(/{industry}/g, data.industry || "your industry")
      .replace(/{budget}/g, data.budget || "TBD")
      .replace(/{timeline}/g, data.timeline || "TBD");
  };

  const getSectionContent = (sectionId: string) => {
    const section = blueprint.sections.find(s => s.id === sectionId);
    if (!section) return "";
    const content = section.variations[tone] || section.variations.professional;
    return replaceVars(content);
  };

  // Build the JSON structure
  return {
    executiveSummary: getSectionContent("executive-summary"),
    problemStatement: getSectionContent("problem-statement"),
    proposedSolution: getSectionContent("proposed-solution"),
    scopeOfWork: {
      included: (data.deliverables || "").split("\n").filter(l => l.trim().length > 0),
      notIncluded: ["Out of scope items specifically excluded", "Ongoing maintenance post-launch"]
    },
    timeline: [
      {
        phase: "Phase 1: Discovery & Research",
        duration: "1 week",
        deliverables: ["Project Roadmap", "Research Findings"]
      },
      {
        phase: "Phase 2: Core Development",
        duration: data.timeline || "4 weeks",
        deliverables: ["Primary Assets", "Initial Review"]
      }
    ],
    pricing: [
      {
        item: data.projectTitle || "Project Services",
        description: "Comprehensive end-to-end professional services as per scope.",
        amount: data.budget || "TBD"
      }
    ],
    termsAndConditions: "Standard business terms apply. 50% deposit required to commence. All IP remains property of {clientName} upon full payment.".replace(/{clientName}/g, data.clientName || "the client"),
    callToAction: "Ready to take the next step? Simply click 'Approve' to begin our partnership."
  };
}
