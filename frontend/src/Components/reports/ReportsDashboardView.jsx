/**
 * ReportsDashboardView.jsx
 * ------------------------------------------------------------------
 * M3 Task 5 — Utilization & Cost Reports Central Hub
 *
 * Provides:
 * - Category Selector: Equipment Utilization, Department Usage,
 *   Maintenance & Downtime, Inter-Institution Sharing, Cost & Procurement, Personal Usage
 * - Reusable Filter Controls: Date range, Department, Category, Lab, Institution, Search
 * - Report Previewer Modal: Official institutional formatting with KPI summary cards & dataset
 * - PDF Export (Printable PDF Window generator) & Excel Export (CSV with UTF-8 BOM)
 * - Generated Reports History: Local state tracking recently generated reports
 * ------------------------------------------------------------------
 */

import { useMemo, useState } from "react";
import {
  FileText, Download, Printer, Search, CalendarClock, Gauge,
  Building2, Wrench, Share2, Wallet, Filter, CheckCircle2, Clock,
  Eye, RefreshCw, Layers, ShieldCheck, AlertTriangle, FileSpreadsheet,
} from "lucide-react";
import { ViewHeader, StatCard, StatusBadge, Modal, EmptyState, Field, inputClass } from "../shared/ui.jsx";
import { exportToExcelCSV, printPDFReport } from "../../utils/exportUtils.js";
import { DEMO_EQUIPMENT, DEMO_BOOKINGS, DEMO_MAINTENANCE_REQUESTS } from "../../data/mockData.js";

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function ReportsDashboardView({ role = "manager", user, toast }) {
  // Available report categories based on role
  const CATEGORIES = useMemo(() => {
    if (role === "researcher") {
      return [
        { id: "PERSONAL", label: "Personal Usage Report", icon: CalendarClock, desc: "Your personal lab bookings, usage hours, and cost history." },
        { id: "UTILIZATION", label: "Resource Availability Report", icon: Gauge, desc: "Equipment operating status and general availability." },
      ];
    }
    return [
      { id: "UTILIZATION", label: "Equipment Utilization", icon: Gauge, desc: "Available vs. used operating hours, utilization rates, and booking counts." },
      { id: "DEPARTMENT", label: "Department / Resource Usage", icon: Building2, desc: "Departmental resource consumption, booking volume, and cost allocation." },
      { id: "MAINTENANCE", label: "Maintenance & Downtime", icon: Wrench, desc: "Work order history, downtime hours, equipment affected, and technician logs." },
      { id: "SHARING", label: "Inter-Institution Sharing", icon: Share2, desc: "Cross-institution agreements, participating labs, and shared usage fee allocations." },
      { id: "COST_PROCUREMENT", label: "Cost & Procurement", icon: Wallet, desc: "Total financial usage costs, maintenance expenses, and procurement planning indicators." },
    ];
  }, [role]);

  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]?.id || "UTILIZATION");
  const [dateRange, setDateRange] = useState("30d");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewModalReport, setPreviewModalReport] = useState(null);

  // Generated Report History state (frontend-only per prompt guidelines)
  const [reportHistory, setReportHistory] = useState([
    { id: "REP-901", title: "Monthly Equipment Utilization Report", type: "UTILIZATION", date: "2026-08-30 14:20", filter: "Last 30 Days · All Depts", format: "PDF", rowsCount: 12 },
    { id: "REP-902", title: "Quarterly Department Cost Allocation", type: "COST_PROCUREMENT", date: "2026-08-15 10:45", filter: "Last 90 Days · Biochemistry", format: "Excel", rowsCount: 8 },
  ]);

  // Derived datasets for reports based on current filters
  const reportData = useMemo(() => {
    let filteredEquipment = DEMO_EQUIPMENT;
    if (selectedDept !== "ALL") {
      filteredEquipment = filteredEquipment.filter((e) => e.department === selectedDept);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filteredEquipment = filteredEquipment.filter((e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q));
    }

    switch (activeCategory) {
      case "PERSONAL": {
        const myBookings = DEMO_BOOKINGS.filter((b) => b.researcher === "You" || b.researcher === user?.name);
        const rows = myBookings.map((b) => ({
          bookingId: b.id,
          equipment: b.equipment,
          start: new Date(b.start).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }),
          duration: "2.0 hrs",
          status: b.status,
          cost: fmt(900),
        }));
        const columns = [
          { key: "bookingId", label: "Booking Ref" },
          { key: "equipment", label: "Equipment" },
          { key: "start", label: "Date & Time" },
          { key: "duration", label: "Duration" },
          { key: "status", label: "Status" },
          { key: "cost", label: "Estimated Cost" },
        ];
        const metrics = [
          { label: "Total Bookings", value: rows.length },
          { label: "Completed Sessions", value: rows.filter((r) => r.status === "COMPLETED").length },
          { label: "Logged Hours", value: `${rows.length * 2} hrs` },
          { label: "Total Cost", value: fmt(rows.length * 900) },
        ];
        return { title: "Personal Usage & Booking Report", columns, rows, metrics };
      }

      case "UTILIZATION": {
        const rows = filteredEquipment.map((eq, i) => {
          const avail = 240;
          const used = Math.round(140 + (i * 12) % 90);
          const pct = Math.round((used / avail) * 100);
          return {
            id: eq.id,
            name: eq.name,
            category: eq.category,
            department: eq.department || "Biochemistry",
            availableHrs: avail,
            usedHrs: used,
            utilization: `${pct}%`,
            bookingsCount: 12 + (i * 2),
            completedBookings: 10 + (i * 2),
            noShows: i % 3 === 0 ? 1 : 0,
            status: eq.status,
          };
        });
        const columns = [
          { key: "name", label: "Equipment Name" },
          { key: "category", label: "Category" },
          { key: "department", label: "Department" },
          { key: "availableHrs", label: "Avail Hrs" },
          { key: "usedHrs", label: "Used Hrs" },
          { key: "utilization", label: "Utilization" },
          { key: "bookingsCount", label: "Bookings" },
          { key: "status", label: "Status" },
        ];
        const totalUsed = rows.reduce((s, r) => s + r.usedHrs, 0);
        const avgUtil = Math.round(rows.reduce((s, r) => s + parseInt(r.utilization), 0) / (rows.length || 1));
        const metrics = [
          { label: "Total Equipment", value: rows.length },
          { label: "Total Used Hours", value: `${totalUsed} hrs` },
          { label: "Avg Utilization Rate", value: `${avgUtil}%` },
          { label: "Underutilized Units", value: rows.filter((r) => parseInt(r.utilization) < 45).length },
        ];
        return { title: "Equipment Utilization Report", columns, rows, metrics };
      }

      case "DEPARTMENT": {
        const depts = ["Biochemistry", "Bio-Engineering", "Material Science", "Chemistry", "Physics & Optics"];
        const rows = depts.map((d, idx) => ({
          department: d,
          equipmentCount: 6 + (idx * 2),
          totalBookings: 34 + (idx * 8),
          usedHrs: 180 + (idx * 25),
          avgUtilization: `${68 + (idx * 3)}%`,
          totalCost: fmt(125000 + (idx * 18000)),
          sharedResources: 2 + (idx % 2),
        }));
        const columns = [
          { key: "department", label: "Department" },
          { key: "equipmentCount", label: "Active Units" },
          { key: "totalBookings", label: "Bookings" },
          { key: "usedHrs", label: "Usage Hours" },
          { key: "avgUtilization", label: "Avg Utilization" },
          { key: "totalCost", label: "Usage Cost" },
          { key: "sharedResources", label: "Shared Units" },
        ];
        const totalCostSum = rows.reduce((s, r) => s + (125000 + (depts.indexOf(r.department) * 18000)), 0);
        const metrics = [
          { label: "Departments", value: rows.length },
          { label: "Total Bookings", value: rows.reduce((s, r) => s + r.totalBookings, 0) },
          { label: "Total Usage Hours", value: `${rows.reduce((s, r) => s + r.usedHrs, 0)} hrs` },
          { label: "Total Dept Cost", value: fmt(totalCostSum) },
        ];
        return { title: "Department & Resource Usage Report", columns, rows, metrics };
      }

      case "MAINTENANCE": {
        const rows = DEMO_MAINTENANCE_REQUESTS.map((m) => ({
          issueCode: m.id,
          equipment: m.equipmentName || m.equipment,
          issueType: m.issueTitle || m.issueType,
          priority: m.priority,
          reportedDate: m.reportedDate || "2026-08-12",
          downtimeHrs: "14 hrs",
          status: m.status,
          assignedTech: m.assignedTechnicianId || "Unassigned",
        }));
        const columns = [
          { key: "issueCode", label: "Work Order" },
          { key: "equipment", label: "Equipment" },
          { key: "issueType", label: "Issue / Task" },
          { key: "priority", label: "Priority" },
          { key: "reportedDate", label: "Reported Date" },
          { key: "downtimeHrs", label: "Downtime" },
          { key: "status", label: "Status" },
        ];
        const metrics = [
          { label: "Maintenance Events", value: rows.length },
          { label: "Total Downtime", value: `${rows.length * 14} hrs` },
          { label: "Open Issues", value: rows.filter((r) => r.status === "OPEN" || r.status === "IN_PROGRESS").length },
          { label: "Resolved Issues", value: rows.filter((r) => r.status === "RESOLVED" || r.status === "COMPLETED").length },
        ];
        return { title: "Maintenance & Downtime Report", columns, rows, metrics };
      }

      case "SHARING": {
        const rows = [
          { equipment: "Confocal Microscope Alpha", ownerInst: "LabFlow Main", partnerInst: "Northbridge Univ", dept: "Bio-Engineering", usageHrs: "48 hrs", sharingPeriod: "Aug 2026", status: "APPROVED", allocatedCost: fmt(24000) },
          { equipment: "Agilent 1260 HPLC System", ownerInst: "LabFlow Main", partnerInst: "Coastal Research", dept: "Chemistry", usageHrs: "36 hrs", sharingPeriod: "Aug 2026", status: "PENDING", allocatedCost: fmt(18000) },
          { equipment: "NMR Spectrometer 600MHz", ownerInst: "Northbridge Univ", partnerInst: "LabFlow Main", dept: "Biochemistry", usageHrs: "52 hrs", sharingPeriod: "Jul 2026", status: "APPROVED", allocatedCost: fmt(32000) },
        ];
        const columns = [
          { key: "equipment", label: "Equipment" },
          { key: "ownerInst", label: "Owner Institution" },
          { key: "partnerInst", label: "Partner Institution" },
          { key: "dept", label: "Department" },
          { key: "usageHrs", label: "Usage Hours" },
          { key: "status", label: "Status" },
          { key: "allocatedCost", label: "Allocated Fee" },
        ];
        const metrics = [
          { label: "Shared Resources", value: rows.length },
          { label: "Outgoing Sharing", value: 2 },
          { label: "Incoming Sharing", value: 1 },
          { label: "Total Shared Fees", value: fmt(74000) },
        ];
        return { title: "Inter-Institution Sharing Report", columns, rows, metrics };
      }

      case "COST_PROCUREMENT": {
        const rows = filteredEquipment.map((eq, i) => ({
          equipment: eq.name,
          department: eq.department || "Biochemistry",
          procurementCost: fmt(450000 + (i * 80000)),
          usageCost: fmt(35000 + (i * 6000)),
          maintenanceCost: fmt(8500 + (i * 1200)),
          sharedCost: eq.isShared ? fmt(12000 + (i * 2000)) : "₹0",
          totalFinancialCost: fmt(493500 + (i * 87200)),
          indicator: i % 2 === 0 ? "High Demand (Expand)" : "Underutilized (Share)",
        }));
        const columns = [
          { key: "equipment", label: "Equipment" },
          { key: "department", label: "Department" },
          { key: "procurementCost", label: "Acquisition Est." },
          { key: "usageCost", label: "Usage Cost" },
          { key: "maintenanceCost", label: "Maintenance Cost" },
          { key: "totalFinancialCost", label: "Total Cost Value" },
          { key: "indicator", label: "Planning Indicator" },
        ];
        const metrics = [
          { label: "Total Usage Cost", value: fmt(185000) },
          { label: "Maintenance Cost", value: fmt(42500) },
          { label: "Shared Resource Fees", value: fmt(68000) },
          { label: "Procurement Est.", value: fmt(2450000) },
        ];
        return { title: "Cost & Procurement Report", columns, rows, metrics };
      }

      default:
        return { title: "Report", columns: [], rows: [], metrics: [] };
    }
  }, [activeCategory, selectedDept, searchQuery, user, role]);

  const filterSummary = `Range: ${dateRange} · Dept: ${selectedDept}${searchQuery ? ` · Search: "${searchQuery}"` : ""}`;

  // Export handlers
  const handleExportCSV = () => {
    exportToExcelCSV(reportData.title, reportData.columns, reportData.rows);
    toast?.(`${reportData.title} exported as Excel CSV.`, "success");
    logReportHistory("Excel");
  };

  const handleExportPDF = () => {
    printPDFReport(reportData.title, filterSummary, reportData.metrics, reportData.columns, reportData.rows);
    toast?.(`${reportData.title} opened for PDF printing.`, "success");
    logReportHistory("PDF");
  };

  const logReportHistory = (format) => {
    const newEntry = {
      id: `REP-${Math.floor(100 + Math.random() * 900)}`,
      title: reportData.title,
      type: activeCategory,
      date: new Date().toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" }),
      filter: filterSummary,
      format,
      rowsCount: reportData.rows.length,
    };
    setReportHistory((prev) => [newEntry, ...prev.slice(0, 7)]);
  };

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Utilization & Cost Reporting Center"
        subtitle="Generate, preview, and export official institutional reports for governance and audit compliance."
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewModalReport(reportData)}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 flex items-center gap-1.5 transition-colors"
            >
              <Eye size={14} className="text-blue-600" /> Preview Report
            </button>
            <button
              onClick={handleExportCSV}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3 py-2 flex items-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" /> Excel (.csv)
            </button>
            <button
              onClick={handleExportPDF}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 transition-colors"
            >
              <Printer size={14} /> PDF Print
            </button>
          </div>
        }
      />

      {/* Category Tabs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`text-left rounded-2xl border p-4 transition-all ${
                isActive
                  ? "border-blue-500 bg-blue-50/60 shadow-sm ring-1 ring-blue-500"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg mb-2.5 ${isActive ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                <Icon size={18} />
              </span>
              <h3 className={`text-xs font-bold ${isActive ? "text-blue-900" : "text-slate-900"}`}>{cat.label}</h3>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{cat.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <Field label="Time Window">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={inputClass()}
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="year">Current Academic Year</option>
            </select>
          </Field>

          {role !== "researcher" && (
            <Field label="Department Scope">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className={inputClass()}
              >
                <option value="ALL">All Departments</option>
                <option value="Biochemistry">Biochemistry</option>
                <option value="Bio-Engineering">Bio-Engineering</option>
                <option value="Material Science">Material Science</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Physics & Optics">Physics & Optics</option>
              </select>
            </Field>
          )}

          <Field label="Search Report Data">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${inputClass()} pl-9`}
              />
            </div>
          </Field>

          <div className="flex justify-end">
            <button
              onClick={() => setPreviewModalReport(reportData)}
              className="w-full rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye size={14} /> Full Report Preview
            </button>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {reportData.metrics.map((m, idx) => (
          <StatCard key={idx} label={m.label} value={m.value} tone="text-blue-600" bg="bg-blue-50" />
        ))}
      </div>

      {/* Main Report Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">{reportData.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{filterSummary} · {reportData.rows.length} Records Compiled</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
            >
              <Download size={13} className="text-emerald-600" /> Export Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1 transition-colors"
            >
              <Printer size={13} className="text-blue-600" /> Print PDF
            </button>
          </div>
        </div>

        {reportData.rows.length === 0 ? (
          <EmptyState icon={FileText} title="No records match current filter criteria" />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wide border-b border-slate-200">
                <tr>
                  {reportData.columns.map((col) => (
                    <th key={col.key} className="px-4 py-3 text-left">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {reportData.columns.map((col) => (
                      <td key={col.key} className="px-4 py-3 font-medium text-slate-700">
                        {col.key === "status" ? (
                          <StatusBadge status={row[col.key]} />
                        ) : col.key === "indicator" ? (
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${row[col.key].includes("Expand") ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-indigo-50 text-indigo-700 border-indigo-200"}`}>
                            {row[col.key]}
                          </span>
                        ) : (
                          row[col.key] ?? "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Generated Report History Section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
          <Clock size={16} className="text-blue-600" /> Recently Generated Reports
        </h3>
        <p className="text-xs text-slate-500 mb-4">Quick access to previously compiled reports for re-download and verification.</p>

        <div className="space-y-3">
          {reportHistory.map((rep) => (
            <div key={rep.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex items-center justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">{rep.title}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-700">{rep.format}</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">Generated: {rep.date} · {rep.filter} · {rep.rowsCount} records</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportPDF}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                >
                  <Printer size={12} /> PDF
                </button>
                <button
                  onClick={handleExportCSV}
                  className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-1"
                >
                  <Download size={12} /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Report Preview Modal */}
      {previewModalReport && (
        <Modal
          title={previewModalReport.title}
          subtitle={`Institutional Document Preview · ${filterSummary}`}
          onClose={() => setPreviewModalReport(null)}
          wide
          footer={
            <div className="flex items-center justify-between gap-3 pt-2">
              <span className="text-xs text-slate-400">Official Report Container</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportCSV}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                >
                  <FileSpreadsheet size={14} className="text-emerald-600" /> Export Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 flex items-center gap-1.5"
                >
                  <Printer size={14} /> Print / Save PDF
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {/* Header Branding */}
            <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">LabFlow Pro Institutional Platform</p>
                <p className="text-sm font-extrabold">{previewModalReport.title}</p>
              </div>
              <span className="text-[11px] text-slate-400">Confidential Audit Report</span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {previewModalReport.metrics.map((m, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">{m.label}</p>
                  <p className="text-sm font-extrabold text-slate-800 mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    {previewModalReport.columns.map((col) => (
                      <th key={col.key} className="px-3 py-2.5 text-left">{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewModalReport.rows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      {previewModalReport.columns.map((col) => (
                        <td key={col.key} className="px-3 py-2.5 text-slate-700">{row[col.key] ?? "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
