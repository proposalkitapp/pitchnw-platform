import jsPDF from "jspdf";

export function exportProposalAsPdf(title: string, content: string) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const usableWidth = pageWidth - margin * 2;
  let y = margin;

  // Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(title, usableWidth);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 6;

  // Divider
  doc.setDrawColor(200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Body
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(content, usableWidth);

  for (const line of lines) {
    if (y > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
    doc.text(line, margin, y);
    y += 5.5;
  }

  doc.save(`${title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
}
