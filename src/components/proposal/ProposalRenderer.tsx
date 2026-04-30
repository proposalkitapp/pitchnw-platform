'use client'

import React from 'react'

const SECTION_TITLES: Record<string, string> = {
  executiveSummary: "Executive Summary",
  problemStatement: "Problem Statement",
  proposedSolution: "Proposed Solution",
  uniqueAdvantage: "Our Unique Advantage",
  scopeOfWork: "Scope of Work",
  timeline: "Project Timeline",
  pricing: "Investment",
  investmentJustification: "Why This Investment Makes Sense",
  urgencyStatement: "A Note on Timing",
  termsAndConditions: "Terms and Conditions",
  callToAction: "Next Steps",
  projectBackground: "Project Background",
  proposedApproach: "Our Approach",
  teamAndCredentials: "Team and Credentials",
  acceptanceAndNextSteps: "Acceptance and Next Steps",
};

function parseContent(content: string): Record<string, any> | null {
  try {
    let s = content.trim();
    if (s.startsWith("```")) {
      s = s.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function getSectionTitle(key: string): string {
  return SECTION_TITLES[key] || key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h3
      className="font-display text-sm font-bold uppercase tracking-[0.15em] text-primary border-b-2 border-primary/20 pb-2 mb-4"
    >
      {title}
    </h3>
  );
}

function TextBlock({ value }: { value: string }) {
  const paragraphs = value.split("\n").filter((p) => p.trim());
  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[15px] leading-[1.85] text-slate-700 font-medium"
        >
          {p}
        </p>
      ))}
    </div>
  );
}

function ScopeOfWork({ value }: { value: { included?: string[]; notIncluded?: string[] } }) {
  return (
    <div className="grid sm:grid-cols-2 gap-6">
      {value.included && value.included.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">What's Included</h4>
          <ul className="space-y-2">
            {value.included.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] text-slate-600 leading-[1.85]">
                <span className="text-emerald-500 mt-0.5 shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
      {value.notIncluded && value.notIncluded.length > 0 && (
        <div>
          <h4 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">What's Not Included</h4>
          <ul className="space-y-2">
            {value.notIncluded.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[15px] text-slate-600 leading-[1.85]">
                <span className="text-rose-500 mt-0.5 shrink-0">✗</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function TimelineSection({ value }: { value: any[] }) {
  return (
    <div className="space-y-3">
      {value.map((phase: any, i: number) => (
        <div key={i} className="flex gap-4 p-5 rounded-2xl border border-white/20 bg-slate-50/50">
          <div className="shrink-0 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold shadow-lg">
            {i + 1}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-bold text-slate-800 text-sm">
                {phase.phase}
              </span>
              <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {phase.duration}
              </span>
            </div>
            {Array.isArray(phase.deliverables) && (
              <ul className="space-y-1 mt-2">
                {phase.deliverables.map((d: string, j: number) => (
                  <li key={j} className="text-[14px] text-slate-500 flex items-start gap-2">
                    <span className="text-primary mt-0.5 shrink-0">•</span>
                    {d}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function PricingTable({ value }: { value: any[] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/20 shadow-sm">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-900 text-white">
            <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Service</th>
            <th className="text-left py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Description</th>
            <th className="text-right py-4 px-6 font-bold uppercase tracking-widest text-[10px]">Amount</th>
          </tr>
        </thead>
        <tbody>
          {value.map((item: any, i: number) => (
            <tr key={i} className={`border-t border-white/20 ${i % 2 === 1 ? "bg-slate-50/30" : "bg-white"}`}>
              <td className="py-4 px-6 text-slate-800 font-bold">{item.item}</td>
              <td className="py-4 px-6 text-slate-500 font-medium">{item.description}</td>
              <td className="py-4 px-6 text-right text-slate-900 font-black font-mono">{item.amount}</td>
            </tr>
          ))}
          {value.length > 1 && (
            <tr className="border-t-2 border-primary/20 bg-primary/5">
              <td colSpan={2} className="py-4 px-6 font-black text-slate-900 uppercase text-xs">Total Investment</td>
              <td className="py-4 px-6 text-right font-black text-primary font-mono text-lg">
                {(() => {
                  const amounts = value.map((v: any) => {
                    const num = parseFloat(String(v.amount).replace(/[^0-9.]/g, ""));
                    return isNaN(num) ? null : num;
                  });
                  if (amounts.every((a: number | null) => a !== null)) {
                    const prefix = String(value[0]?.amount).replace(/[0-9.,\s]/g, "").trim();
                    const total = amounts.reduce((s: number, n: number | null) => s + (n || 0), 0);
                    return `${prefix}${total.toLocaleString()}`;
                  }
                  return "—";
                })()}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export interface ProposalBranding {
  logoUrl?: string | null;
  headerTitle?: string | null;
  companyName?: string | null;
  displayName?: string | null;
  portfolioUrl?: string | null;
}

interface ProposalRendererProps {
  content: string;
  mode: string | null;
  branding?: ProposalBranding;
}

export function ProposalRenderer({ content, mode, branding }: ProposalRendererProps) {
  const parsed = parseContent(content);

  if (!parsed) {
    return (
      <div className="prose prose-sm max-w-none">
        <pre className="whitespace-pre-wrap font-body text-sm text-slate-700 leading-relaxed">
          {content}
        </pre>
      </div>
    );
  }

  const isSalesPitch = mode === "sales_pitch";
  const brandLabel = branding?.headerTitle || branding?.companyName || branding?.displayName;

  return (
    <div className="space-y-12">
      {/* User Brand Header */}
      {branding && (
        <div className="pb-8 border-b-2 border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              {branding.logoUrl && (
                <img
                  src={branding.logoUrl}
                  alt={brandLabel || "Brand"}
                  className="max-h-16 w-auto object-contain mb-4"
                />
              )}
              {brandLabel && (
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                  {brandLabel}
                </p>
              )}
            </div>
            {branding.portfolioUrl && (
              <a 
                href={branding.portfolioUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-xs font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
              >
                View Portfolio →
              </a>
            )}
          </div>
        </div>
      )}

      {Object.entries(parsed).map(([key, value]) => {
        if (!value) return null;

        if (key === "scopeOfWork" && typeof value === "object" && !Array.isArray(value)) {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <ScopeOfWork value={value as { included?: string[]; notIncluded?: string[] }} />
            </div>
          );
        }

        if (key === "timeline" && Array.isArray(value)) {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <TimelineSection value={value} />
            </div>
          );
        }

        if (key === "pricing" && Array.isArray(value)) {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <PricingTable value={value} />
            </div>
          );
        }

        if (key === "investmentJustification" && isSalesPitch && typeof value === "string") {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <div className="rounded-3xl border border-emerald-100 bg-emerald-50/50 p-8 shadow-sm">
                <TextBlock value={value} />
              </div>
            </div>
          );
        }

        if (key === "urgencyStatement" && isSalesPitch && typeof value === "string") {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <div className="rounded-3xl border border-amber-100 bg-amber-50/50 p-8 shadow-sm">
                <TextBlock value={value} />
              </div>
            </div>
          );
        }

        if (key === "callToAction" && isSalesPitch && typeof value === "string") {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 shadow-md">
                <TextBlock value={value} />
              </div>
            </div>
          );
        }

        if (typeof value === "string") {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <TextBlock value={value} />
            </div>
          );
        }

        if (Array.isArray(value)) {
          return (
            <div key={key}>
              <SectionHeading title={getSectionTitle(key)} />
              <ol className="space-y-3 list-decimal list-inside">
                {value.map((item, i) => (
                  <li key={i} className="text-[15px] text-slate-700 leading-[1.85] font-medium">
                    {typeof item === "string" ? item : JSON.stringify(item)}
                  </li>
                ))}
              </ol>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
