import jsPDF from "jspdf";
import {
  buildAydenPlazaLeaseAgreementText,
  TenantLeaseAgreementForm,
} from "@/constants/tenantLeaseAgreement";

export const generateTenantLeaseAgreementPdf = (
  form: TenantLeaseAgreementForm
): Blob => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "pt",
    format: "a4",
  });

  const marginX = 38;
  const maxWidth = 520;
  const pageHeight = doc.internal.pageSize.getHeight();
  const lineHeight = 14;
  const bottomPadding = 42;

  const content = buildAydenPlazaLeaseAgreementText(form);
  const paragraphs = content.split("\n");

  let y = 42;

  doc.setFont("times", "normal");
  doc.setFontSize(11);

  paragraphs.forEach((paragraph) => {
    const lines = doc.splitTextToSize(paragraph || " ", maxWidth);

    lines.forEach((line: string) => {
      if (y > pageHeight - bottomPadding) {
        doc.addPage();
        y = 42;
      }
      doc.text(line, marginX, y);
      y += lineHeight;
    });

    y += 4;
  });

  return doc.output("blob");
};

export const downloadTenantLeaseAgreementPdf = (
  form: TenantLeaseAgreementForm,
  fileName = "ayden-plaza-lease-agreement.pdf"
): void => {
  const blob = generateTenantLeaseAgreementPdf(form);
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.URL.revokeObjectURL(url);
};
