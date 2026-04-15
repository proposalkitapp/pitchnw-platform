import jsPDF from "jspdf";
import type { ProposalBranding } from "@/components/ProposalRenderer";

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

const SECTION_TITLES: Record<string, string> = {
  executiveSummary: "Executive Summary",
  problemStatement: "Problem Statement",
  proposedSolution: "Proposed Solution",
  uniqueAdvantage: "Unique Advantage",
  scopeOfWork: "Scope of Work",
  timeline: "Timeline",
  pricing: "Investment",
  termsAndConditions: "Terms and Conditions",
  callToAction: "Call to Action",
};

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

export async function exportProposalAsPdf(
  title: string, 
  content: string, 
  branding?: ProposalBranding
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 25;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  // Add branding header
  if (branding) {
    if (branding.logoUrl) {
      try {
        const img = await loadImage(branding.logoUrl);
        const imgWidth = 40;
        const imgHeight = (img.height * imgWidth) / img.width;
        doc.addImage(img, "PNG", margin, y, imgWidth, imgHeight);
        y += imgHeight + 5;
      } catch (e) {
        console.error("PDF logo load failed", e);
      }
    }

    const brandName = branding.headerTitle || branding.companyName || branding.displayName;
    if (brandName) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(brandName, margin, y);
      y += 6;
    }

    if (branding.portfolioUrl) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(0, 51, 255); // #0033FF
      doc.text(branding.portfolioUrl, margin, y);
      y += 8;
    }

    // Header line
    doc.setDrawColor(0, 51, 255);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);
    y += 15;
  }

  // Proposal Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 0);
  const titleLines = doc.splitTextToSize(title, usableWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 10 + 10;

  const parsed = parseContent(content);
  if (!parsed) {
    // Fallback for raw text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(content, usableWidth);
    for (const line of lines) {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 6;
    }
  } else {
    // Render JSON sections
    Object.entries(parsed).forEach(([key, value]) => {
      if (!value) return;

      if (y > pageHeight - margin - 20) {
        doc.addPage();
        y = margin;
      }

      // Section Title
      const sectionTitle = SECTION_TITLES[key] || key.replace(/([A-Z])/g, " $1").toUpperCase();
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(0, 51, 255);
      doc.text(sectionTitle, margin, y);
      y += 6;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);

      if (typeof value === "string") {
        const bodyLines = doc.splitTextToSize(value, usableWidth);
        for (const line of bodyLines) {
           if (y > pageHeight - margin) {
             doc.addPage();
             y = margin;
           }
           doc.text(line, margin, y);
           y += 6;
        }
      } else if (key === "scopeOfWork" && typeof value === 'object') {
        const val = value as any;
        if (val.included) {
          doc.setFont("helvetica", "bold");
          doc.text("Included:", margin, y);
          y += 6;
          doc.setFont("helvetica", "normal");
          val.included.forEach((item: string) => {
            const itemLines = doc.splitTextToSize(`• ${item}`, usableWidth - 5);
            doc.text(itemLines, margin + 5, y);
            y += itemLines.length * 6;
          });
        }
      } else if (key === "pricing" && Array.isArray(value)) {
         value.forEach((item: any) => {
           doc.text(`${item.item}: ${item.amount}`, margin, y);
           y += 6;
         });
      }

      y += 8; // Spacer between sections
    });
  }

  // Footer page numbers
  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${totalPages} · Powered by Pitchnw`, 
      pageWidth / 2, 
      pageHeight - 10, 
      { align: "center" }
    );
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
