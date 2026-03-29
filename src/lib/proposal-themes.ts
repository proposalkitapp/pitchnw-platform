export interface ProposalTheme {
  id: string;
  name: string;
  background: string;
  headingColor: string;
  accent: string;
  bodyText: string;
  border: string;
}

export const proposalThemes: ProposalTheme[] = [
  {
    id: "classic-white",
    name: "Classic White",
    background: "#FFFFFF",
    headingColor: "#111827",
    accent: "#6366F1",
    bodyText: "#374151",
    border: "#E5E7EB",
  },
  {
    id: "midnight-dark",
    name: "Midnight Dark",
    background: "#0A0A0F",
    headingColor: "#F8F8FF",
    accent: "#818CF8",
    bodyText: "#94A3B8",
    border: "#1E1E2E",
  },
  {
    id: "warm-ivory",
    name: "Warm Ivory",
    background: "#FFFBF5",
    headingColor: "#1C1917",
    accent: "#D97706",
    bodyText: "#44403C",
    border: "#E7E5E4",
  },
  {
    id: "deep-navy",
    name: "Deep Navy",
    background: "#0F172A",
    headingColor: "#F1F5F9",
    accent: "#38BDF8",
    bodyText: "#94A3B8",
    border: "#1E293B",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    background: "#F0FDF4",
    headingColor: "#14532D",
    accent: "#16A34A",
    bodyText: "#166534",
    border: "#BBF7D0",
  },
  {
    id: "slate-professional",
    name: "Slate Professional",
    background: "#F8FAFC",
    headingColor: "#0F172A",
    accent: "#6366F1",
    bodyText: "#334155",
    border: "#CBD5E1",
  },
];

export type FontStyle = "modern" | "classic" | "clean" | "bold";
export type HeaderStyle = "minimal" | "branded" | "document";
export type SectionDivider = "lines" | "spacing" | "cards";

export interface AppearanceSettings {
  theme: string;
  accentColor: string;
  fontStyle: FontStyle;
  headerStyle: HeaderStyle;
  sectionDivider: SectionDivider;
}

export const defaultAppearance: AppearanceSettings = {
  theme: "classic-white",
  accentColor: "#6366F1",
  fontStyle: "modern",
  headerStyle: "minimal",
  sectionDivider: "lines",
};

export const fontStyleLabels: Record<FontStyle, { label: string; description: string }> = {
  modern: { label: "Modern", description: "Syne + DM Sans" },
  classic: { label: "Classic", description: "Playfair + Lora" },
  clean: { label: "Clean", description: "DM Sans only" },
  bold: { label: "Bold", description: "Syne heavy" },
};

export const headerStyleLabels: Record<HeaderStyle, { label: string; description: string }> = {
  minimal: { label: "Minimal", description: "Centered title and date" },
  branded: { label: "Branded", description: "Logo + company name" },
  document: { label: "Document", description: "Sender/recipient blocks" },
};

export const sectionDividerLabels: Record<SectionDivider, string> = {
  lines: "Lines",
  spacing: "Spacing only",
  cards: "Cards",
};

export function getThemeById(id: string): ProposalTheme {
  return proposalThemes.find((t) => t.id === id) || proposalThemes[0];
}
