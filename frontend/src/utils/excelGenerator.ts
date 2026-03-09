// © 2025 Jeff. All rights reserved.
// Unauthorized copying, distribution, or modification of this file is strictly prohibited.

import * as XLSX from "xlsx";
interface ExcelExportOptions {
  quote: any;
  isClientExport?: boolean;
}
const formatCurrency = (amount: number): string => {
  if (!amount || amount === 0) return "";
  return new Intl.NumberFormat("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
const formatQuantity = (quantity: any): string => {
  if (quantity === null || quantity === undefined || quantity === "") return "";
  const num = typeof quantity === "string" ? parseFloat(quantity) : quantity;
  if (isNaN(num)) return "";
  return num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
};
const extractMaterialsFromQuote = (quote: any): any[] => {
  if (quote.materialSchedule) {
    return quote.materialSchedule;
  }
  if (quote.consolidatedMaterials) {
    return quote.consolidatedMaterials;
  }
  return [];
};
export const generateQuoteExcel = async ({
  quote,
  isClientExport = false,
}: ExcelExportOptions) => {
  const wb: XLSX.WorkBook = XLSX.utils.book_new();
  wb.Props = {
    Title: `${isClientExport ? "Client" : "Contractor"} Quote - ${quote.title}`,
    Author: quote.contractor_name || "JTech AI",
    CreatedDate: new Date(),
  };
  const summaryData: any[] = [
    ["PROJECT SUMMARY"],
    ["Project Title", quote.title],
    ["Client Name", quote.client_name],
    ["Location", quote.location],
    ["Project Type", quote.project_type],
    ["House Type", quote.house_type],
    ["Region", quote.region],
    ["Floors", quote.floors],
    ["Date Generated", new Date().toLocaleDateString()],
    [""],
    ["COST BREAKDOWN"],
    ["Materials Cost", quote.materials_cost],
    ["Labor Cost", quote.labor_cost],
  ];
  if (!isClientExport) {
    summaryData.push(["Equipment Cost", quote.equipment_cost]);
    summaryData.push(["Transport Cost", quote.transport_costs]);
    summaryData.push(["Services Cost", quote.services_cost]);
    summaryData.push(["Subcontractors Cost", quote.subcontractors_cost]);
    summaryData.push(["Additional Items Cost", quote.addons_cost]);
  }
  summaryData.push(["Preliminaries Cost", quote.preliminaries_cost]);
  summaryData.push(["Permit Cost", quote.permit_cost]);
  summaryData.push([""]);
  summaryData.push(["Subtotal", quote.subtotal]);
  if (!isClientExport) {
    summaryData.push(
      ["Overhead", quote.overhead_amount],
      ["Contingency", quote.contingency_amount],
      ["Profit", quote.profit_amount]
    );
  } else {
    summaryData.push(["Profit", "Included in total"]);
  }
  summaryData.push([""], ["GRAND TOTAL", quote.total_amount]);
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  const headerCell = summaryWs["A1"];
  if (headerCell) (headerCell as any).s = { font: { bold: true } };
  (summaryWs as any)["!cols"] = [{ wch: 26 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");
  if (!isClientExport && quote.boq_data) {
    quote.boq_data.forEach((section: any, index: number) => {
      if (section.items && section.items.length > 0) {
        const sectionData = [
          [section.title.toUpperCase()],
          ["Item", "Description", "Unit", "Quantity", "Rate", "Amount"],
        ];
        section.items.forEach((item: any) => {
          if (!item.isHeader) {
            sectionData.push([
              item.itemNo,
              item.description,
              item.unit,
              formatQuantity(item.quantity),
              formatCurrency(item.rate),
              formatCurrency(item.amount),
            ]);
          } else {
            sectionData.push(["", item.description, "", "", "", ""]);
          }
        });
        const sectionTotal = section.items
          .filter((item: any) => !item.isHeader)
          .reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        sectionData.push([
          "",
          "SECTION TOTAL",
          "",
          "",
          "",
          formatCurrency(sectionTotal),
        ]);
        const sectionWs = XLSX.utils.aoa_to_sheet(sectionData);
        XLSX.utils.book_append_sheet(wb, sectionWs, `BOQ-${index + 1}`);
      }
    });
  }
  if (!isClientExport) {
    const materials = extractMaterialsFromQuote(quote);
    if (materials && materials.length > 0) {
      const materialsData = [
        ["MATERIALS SCHEDULE"],
        ["Item", "Description", "Unit", "Quantity", "Rate", "Amount"],
      ];
      materials.forEach((material: any, index: number) => {
        materialsData.push([
          index + 1,
          material.description,
          material.unit,
          formatQuantity(material.quantity),
          formatCurrency(material.rate),
          formatCurrency(material.amount),
        ]);
      });
      const materialsTotal = materials.reduce(
        (sum: number, m: any) => sum + m.amount,
        0
      );
      materialsData.push([
        "",
        "TOTAL MATERIALS COST",
        "",
        "",
        "",
        formatCurrency(materialsTotal),
      ]);
      const materialsWs = XLSX.utils.aoa_to_sheet(materialsData);
      (materialsWs as any)["!cols"] = [
        { wch: 8 },
        { wch: 45 },
        { wch: 10 },
        { wch: 12 },
        { wch: 14 },
        { wch: 16 },
      ];
      XLSX.utils.book_append_sheet(wb, materialsWs, "Materials");
    }
  }
  if (!isClientExport) {
    const additionalCostsData = [["ADDITIONAL COSTS"], ["Cost Type", "Amount"]];
    if (quote.equipment_cost > 0) {
      additionalCostsData.push([
        "Equipment",
        formatCurrency(quote.equipment_cost),
      ]);
    }
    if (quote.transport_costs > 0) {
      additionalCostsData.push([
        "Transport",
        formatCurrency(quote.transport_costs),
      ]);
    }
    if (quote.services_cost > 0) {
      additionalCostsData.push([
        "Services",
        formatCurrency(quote.services_cost),
      ]);
    }
    if (quote.subcontractors_cost > 0) {
      additionalCostsData.push([
        "Subcontractors",
        formatCurrency(quote.subcontractors_cost),
      ]);
    }
    if (quote.addons_cost > 0) {
      additionalCostsData.push([
        "Additional Items",
        formatCurrency(quote.addons_cost),
      ]);
    }
    if (quote.permit_cost > 0) {
      additionalCostsData.push(["Permits", formatCurrency(quote.permit_cost)]);
    }
    const additionalCostsWs = XLSX.utils.aoa_to_sheet(additionalCostsData);
    (additionalCostsWs as any)["!cols"] = [{ wch: 30 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, additionalCostsWs, "Additional Costs");
  }
  const fileName = `${
    isClientExport ? "Client" : "Contractor"
  }_Quote_${quote.title.replace(/\s+/g, "_")}.xlsx`;
  XLSX.writeFile(wb, fileName);
  return true;
};
