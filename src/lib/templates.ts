export interface Template {
  id: string;
  name: string;
  category: string;
  categorySlug: string;
  accentColor: string;
  rating: number;
  uses: number;
  description: string;
  forWhom: string;
  tone: string;
  sections: string[];
  aiPrompt: string;
}

export const templates: Template[] = [
  {
    id: "web-design",
    name: "Web Design & Development",
    category: "Web Design",
    categorySlug: "web-design",
    accentColor: "239 84% 67%", // Indigo
    rating: 4.9,
    uses: 342,
    description: "A comprehensive web design proposal template with technical scope, project phases, revision policy, and hosting terms. Perfect for agencies and freelance web developers.",
    forWhom: "Web designers & developers",
    tone: "Technical but approachable",
    sections: [
      "Project Overview",
      "The Problem We Are Solving",
      "Proposed Solution & Approach",
      "Scope of Work",
      "Project Phases & Timeline",
      "Revision Policy",
      "Investment & Payment Schedule",
      "Hosting & Maintenance Terms",
      "Terms & Conditions",
      "Next Steps",
    ],
    aiPrompt: "You are writing a web design and development proposal. Focus on technical credibility, clear project phases, revision policy, and professional delivery. Tone: technical but human and approachable.",
  },
  {
    id: "brand-identity",
    name: "Brand Identity & Logo Design",
    category: "Branding",
    categorySlug: "branding",
    accentColor: "270 91% 65%", // Purple
    rating: 4.8,
    uses: 218,
    description: "A creative brand identity proposal with deliverables checklist, file ownership, and revision rounds. Ideal for branding studios and logo designers.",
    forWhom: "Branding studios & logo designers",
    tone: "Creative, visual, warm",
    sections: [
      "Understanding Your Brand",
      "Our Creative Approach",
      "Deliverables Checklist",
      "What Is Not Included",
      "Project Timeline",
      "File Formats & Ownership Rights",
      "Investment",
      "Revision Rounds",
      "Terms",
      "Let's Begin",
    ],
    aiPrompt: "You are writing a brand identity proposal. Focus on the creative process, emotional value of strong branding, and specific deliverables. Tone: creative, warm, visually-oriented.",
  },
  {
    id: "copywriting",
    name: "Copywriting & Content",
    category: "Copywriting",
    categorySlug: "copywriting",
    accentColor: "217 91% 60%", // Blue
    rating: 4.7,
    uses: 891,
    description: "A content-focused proposal with scope tables, content calendars, and usage rights. Built for copywriters and content strategists.",
    forWhom: "Copywriters & content strategists",
    tone: "Conversational, confident",
    sections: [
      "Content Brief Summary",
      "Our Approach to Your Voice & Tone",
      "Scope of Work Table",
      "Content Calendar Structure",
      "Revision Rounds Included",
      "Usage Rights & Licensing",
      "Investment",
      "Turnaround Timeline",
      "Terms",
      "Ready to Start?",
    ],
    aiPrompt: "You are writing a copywriting proposal. Include specific word counts, content types, usage rights, and revision rounds. Tone: confident and conversational.",
  },
  {
    id: "photography",
    name: "Photography",
    category: "Photography",
    categorySlug: "photography",
    accentColor: "38 92% 50%", // Amber
    rating: 4.9,
    uses: 156,
    description: "A professional photography proposal with shot list, licensing tiers, and cancellation policy. Perfect for commercial and event photographers.",
    forWhom: "Commercial & event photographers",
    tone: "Professional, warm, clear",
    sections: [
      "Shoot Overview",
      "Shot List & Coverage",
      "Locations & Logistics",
      "Deliverables",
      "Licensing & Usage Rights",
      "Timeline",
      "Investment & Payment Terms",
      "Cancellation & Rescheduling Policy",
      "Terms",
      "Confirm Your Booking",
    ],
    aiPrompt: "You are writing a photography proposal. Cover shot list, deliverables, licensing tiers, and cancellation policy clearly. Tone: professional and warm.",
  },
  {
    id: "social-media",
    name: "Social Media Management",
    category: "Social Media",
    categorySlug: "social-media",
    accentColor: "330 81% 60%", // Pink
    rating: 4.6,
    uses: 305,
    description: "A strategic social media proposal with monthly deliverables table, reporting cadence, and minimum contract period. For social media managers and agencies.",
    forWhom: "Social media managers & agencies",
    tone: "Modern, strategic, results-focused",
    sections: [
      "Social Media Audit Summary",
      "Strategy Overview",
      "Monthly Deliverables Table",
      "Content Creation Process",
      "Reporting & Analytics Cadence",
      "What Is Not Included",
      "Monthly Investment",
      "Minimum Contract Period",
      "Terms & Conditions",
      "Next Steps",
    ],
    aiPrompt: "You are writing a social media management proposal. List monthly deliverables by platform with frequency. Include reporting cadence. Tone: strategic and results-focused.",
  },
  {
    id: "video-production",
    name: "Video Production",
    category: "Video",
    categorySlug: "video",
    accentColor: "0 84% 60%", // Red
    rating: 4.8,
    uses: 127,
    description: "A cinematic video production proposal covering pre through post production, revision rounds, raw footage policy, and usage rights.",
    forWhom: "Videographers & production studios",
    tone: "Creative, cinematic, professional",
    sections: [
      "Project Brief",
      "Creative Direction & Vision",
      "Production Scope",
      "Deliverables",
      "Distribution & Usage Rights",
      "Project Timeline",
      "Investment & Payment Schedule",
      "Revision Policy",
      "Raw Footage Policy",
      "Terms & Next Steps",
    ],
    aiPrompt: "You are writing a video production proposal. Cover pre through post production, revision rounds, raw footage policy, and usage rights. Tone: creative and professional.",
  },
  {
    id: "consulting",
    name: "Business Consulting",
    category: "Consulting",
    categorySlug: "consulting",
    accentColor: "173 80% 40%", // Teal
    rating: 4.7,
    uses: 289,
    description: "A formal consulting proposal with methodology, deliverables matrix, team credentials, and NDA section. Designed for management and business consultants.",
    forWhom: "Management & business consultants",
    tone: "Formal, authoritative, executive-level",
    sections: [
      "Executive Summary",
      "Situation Analysis",
      "Engagement Objectives",
      "Methodology & Approach",
      "Deliverables Matrix Table",
      "Project Phases",
      "Team & Expertise",
      "Investment & Billing Structure",
      "Confidentiality & Non-Disclosure Terms",
      "Next Steps",
    ],
    aiPrompt: "You are writing a business consulting proposal. Use formal executive language. Include a methodology section, deliverables matrix, and NDA reference. Tone: authoritative and precise.",
  },
  {
    id: "seo-marketing",
    name: "SEO & Digital Marketing",
    category: "Marketing",
    categorySlug: "marketing",
    accentColor: "160 84% 39%", // Green
    rating: 4.5,
    uses: 198,
    description: "A data-driven SEO and digital marketing proposal with monthly activities, projected results, and a results disclaimer. For SEO specialists and digital marketers.",
    forWhom: "SEO specialists & digital marketers",
    tone: "Data-driven, transparent, results-oriented",
    sections: [
      "Current SEO & Marketing Audit",
      "Strategy Overview",
      "Monthly Activities List",
      "Tools, Tracking & Reporting",
      "Projected Results & Timeline",
      "What Is Not Included",
      "Monthly Investment",
      "Minimum Engagement Period",
      "Cancellation Terms",
      "Let's Get Started",
    ],
    aiPrompt: "You are writing an SEO and digital marketing proposal. Be data-driven. Always include a disclaimer that results are projections not guarantees. Tone: transparent and analytical.",
  },
];

export const categories = [
  { label: "All", slug: "all" },
  { label: "Web Design", slug: "web-design" },
  { label: "Branding", slug: "branding" },
  { label: "Copywriting", slug: "copywriting" },
  { label: "Photography", slug: "photography" },
  { label: "Social Media", slug: "social-media" },
  { label: "Video", slug: "video" },
  { label: "Consulting", slug: "consulting" },
  { label: "Marketing", slug: "marketing" },
];

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id);
}
