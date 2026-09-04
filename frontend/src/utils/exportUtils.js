/**
 * exportUtils.js
 * ------------------------------------------------------------------
 * Client-side Export Utilities for LabFlow Pro Reports module.
 *
 * Provides:
 * 1. exportToExcelCSV — Generates structured Excel-compatible CSV files
 *    with UTF-8 BOM encoding for clean opening in MS Excel & Google Sheets.
 * 2. printPDFReport — Triggers printable institutional PDF preview window
 *    with styled headers, summary cards, data tables, and print styles.
 * ------------------------------------------------------------------
 */

export function exportToExcelCSV(filename, columns, rows) {
  // Add UTF-8 BOM so Excel correctly parses special characters / currencies
  let csvContent = "\uFEFF";

  // Header row
  const headers = columns.map((col) => `"${String(col.label || col.key).replace(/"/g, '""')}"`).join(",");
  csvContent += headers + "\r\n";

  // Data rows
  rows.forEach((row) => {
    const rowContent = columns
      .map((col) => {
        let val = row[col.key];
        if (val === null || val === undefined) val = "";
        return `"${String(val).replace(/"/g, '""')}"`;
      })
      .join(",");
    csvContent += rowContent + "\r\n";
  });

  // Create downloadable Blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename.replace(/[^a-z0-9_-]/gi, "_")}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printPDFReport(reportTitle, filterSummary, metrics = [], columns = [], rows = []) {
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to preview and print PDF reports.");
    return;
  }

  const generatedDate = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const metricsHtml = metrics
    .map(
      (m) => `
    <div style="flex: 1; min-width: 140px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <div style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">${m.label}</div>
      <div style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 4px;">${m.value}</div>
    </div>`
    )
    .join("");

  const headersHtml = columns.map((col) => `<th style="padding: 8px 12px; text-align: left; background: #f1f5f9; color: #334155; font-size: 11px; text-transform: uppercase; font-weight: 700; border-bottom: 2px solid #cbd5e1;">${col.label || col.key}</th>`).join("");

  const rowsHtml = rows
    .map(
      (row, idx) => `
    <tr style="background: ${idx % 2 === 0 ? "#ffffff" : "#f8fafc"};">
      ${columns.map((col) => `<td style="padding: 8px 12px; font-size: 12px; color: #334155; border-bottom: 1px solid #e2e8f0;">${row[col.key] ?? "—"}</td>`).join("")}
    </tr>`
    )
    .join("");

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle} — Official Report</title>
      <style>
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; color: #0f172a; margin: 0; padding: 24px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px; }
        .logo { font-size: 20px; font-weight: 900; color: #0f172a; letter-spacing: -0.5px; }
        .logo span { color: #2563eb; }
        .meta { font-size: 11px; color: #64748b; text-align: right; }
        .title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
        .subtitle { font-size: 12px; color: #64748b; margin-bottom: 16px; }
        .metrics-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .footer { margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #94a3b8; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div className="no-print" style="margin-bottom: 16px; text-align: right;">
        <button onclick="window.print()" style="background: #2563eb; color: white; border: none; padding: 8px 16px; font-size: 12px; font-weight: 600; border-radius: 6px; cursor: pointer;">
          Print / Save as PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div class="logo">LABFLOW <span>PRO</span></div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">Lab Resource Utilization & Cost Platform</div>
        </div>
        <div class="meta">
          <div><strong>Generated:</strong> ${generatedDate}</div>
          <div><strong>Filters:</strong> ${filterSummary || "All Data"}</div>
        </div>
      </div>

      <div class="title">${reportTitle}</div>
      <div class="subtitle">Official institutional report compiled for resource governance and audit compliance.</div>

      ${metrics.length > 0 ? `<div class="metrics-grid">${metricsHtml}</div>` : ""}

      <table>
        <thead>
          <tr>${headersHtml}</tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>LabFlow Pro Institutional Platform — Confidential Report</div>
        <div>Page 1 of 1</div>
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
