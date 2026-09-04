/**
 * MaintenanceOversightView.jsx
 * ------------------------------------------------------------------
 * Lab Manager — full Maintenance & Work Order Management view.
 *
 * M3 Task 1 — Maintenance & Work Order Management (Manager role)
 *
 * Real API connections (EquipmentIssueReportController):
 *   - GET  /api/issue-reports                → all department reports
 *   - GET  /api/issue-reports?status=OPEN    → filtered reports
 *   - POST /api/issue-reports/{id}/assign    → assign technician
 *   - POST /api/issue-reports/{id}/resolve   → mark resolved
 *
 * Backend NOT available (documented):
 *   - Technician list for assignment UI — no /api/users?role=TECHNICIAN
 *     endpoint exists. The input shows a numeric field for technician userId.
 *   - Maintenance scheduling persistence — no dedicated scheduling endpoint.
 *     The "Schedule" tab is a planning UI only; data is local (not saved to DB).
 *   - Work-order status update by manager or technician — no PUT/PATCH endpoint.
 *   - Downtime duration calculation — no dedicated downtime endpoint exists.
 *     Downtime is approximated from createdAt → resolvedAt on RESOLVED issues.
 * ------------------------------------------------------------------
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Wrench, ClipboardList, Clock, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, ChevronRight, Search,
  UserCheck, ArrowLeft, Info, CalendarDays, Plus, Trash2,
  ChevronDown, CheckSquare, Square,
} from "lucide-react";
import {
  Field, inputClass, StatusBadge, ViewHeader, StatCard, EmptyState,
} from "../shared/ui.jsx";
import { issueReportApi } from "../../api/issueReportApi.js";
import { ApiError } from "../../api/client.js";

/* ─── Helpers ───────────────────────────────────────────────────── */
function fmtDt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

/** Approximate downtime hours from createdAt to resolvedAt */
function downtimeHours(report) {
  if (!report.createdAt || !report.resolvedAt) return null;
  const ms = new Date(report.resolvedAt) - new Date(report.createdAt);
  return (ms / 3600000).toFixed(1);
}

function downtimeDuration(ms) {
  if (!ms || ms < 0) return "—";
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={20} className="text-blue-500 animate-spin" />
      <span className="ml-2 text-sm text-slate-500">Loading…</span>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700">Failed to load data</p>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="text-xs font-semibold text-red-600 hover:text-red-700 shrink-0">
          Retry
        </button>
      )}
    </div>
  );
}

const STATUS_TABS = [
  { id: "ALL", label: "All" },
  { id: "OPEN", label: "Open" },
  { id: "ASSIGNED", label: "Assigned" },
  { id: "IN_PROGRESS", label: "In Progress" },
  { id: "RESOLVED", label: "Resolved" },
];

const PRIORITY_RANK = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

const PRIORITY_COLOR = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

/* ================================================================ */
/*  Main exported component                                          */
/* ================================================================ */
export default function MaintenanceOversightView({ toast }) {
  const [tab, setTab] = useState("overview"); // "overview" | "workorders" | "history" | "downtime" | "schedule"
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await issueReportApi.getDepartmentIssues();
      const sorted = (data || []).sort(
        (a, b) =>
          (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9)
      );
      setReports(sorted);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load maintenance reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleAssign = useCallback(
    async (issueId, technicianId) => {
      try {
        const updated = await issueReportApi.assignTechnician(issueId, technicianId);
        setReports((list) =>
          list.map((r) =>
            r.issueReportId === updated.issueReportId ? updated : r
          )
        );
        toast(`Issue #${issueId} assigned to technician #${technicianId}.`, "success");
      } catch (err) {
        toast(
          err instanceof ApiError ? err.message : "Failed to assign technician.",
          "error"
        );
      }
    },
    [toast]
  );

  const handleResolve = useCallback(
    async (issueId) => {
      try {
        const updated = await issueReportApi.resolve(issueId);
        setReports((list) =>
          list.map((r) =>
            r.issueReportId === updated.issueReportId ? updated : r
          )
        );
        toast(
          `Issue #${issueId} resolved — equipment returned to Available.`,
          "success"
        );
      } catch (err) {
        toast(
          err instanceof ApiError ? err.message : "Failed to resolve issue.",
          "error"
        );
      }
    },
    [toast]
  );

  /* Summary counts */
  const counts = {
    open: reports.filter((r) => r.status === "OPEN").length,
    assigned: reports.filter((r) => r.status === "ASSIGNED").length,
    inProgress: reports.filter((r) => r.status === "IN_PROGRESS").length,
    resolved: reports.filter((r) => r.status === "RESOLVED").length,
    critical: reports.filter((r) => r.priority === "CRITICAL" && r.status !== "RESOLVED").length,
  };

  const SUB_TABS = [
    { id: "overview", label: "Overview" },
    { id: "workorders", label: "Work Orders" },
    { id: "history", label: "Maintenance History" },
    { id: "downtime", label: "Downtime" },
    { id: "schedule", label: "Scheduling" },
  ];

  return (
    <div>
      <ViewHeader
        title="Maintenance Oversight"
        subtitle="Review department issue reports, assign technicians, track resolution and plan maintenance."
        action={
          <button
            onClick={fetchReports}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Summary stat cards */}
      {!loading && !error && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={AlertTriangle} label="Open Issues" value={counts.open} tone="text-amber-600" bg="bg-amber-50" onClick={() => setTab("workorders")} />
          <StatCard icon={UserCheck} label="Assigned" value={counts.assigned} tone="text-blue-600" bg="bg-blue-50" onClick={() => setTab("workorders")} />
          <StatCard icon={Wrench} label="In Progress" value={counts.inProgress} tone="text-orange-600" bg="bg-orange-50" onClick={() => setTab("workorders")} />
          <StatCard icon={CheckCircle2} label="Resolved" value={counts.resolved} tone="text-emerald-600" bg="bg-emerald-50" onClick={() => setTab("history")} />
        </div>
      )}

      {/* Critical alert */}
      {!loading && counts.critical > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-5">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {counts.critical} critical issue{counts.critical > 1 ? "s require" : " requires"} immediate attention.
          </p>
          <button
            onClick={() => setTab("workorders")}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 shrink-0"
          >
            View →
          </button>
        </div>
      )}

      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1 w-fit mb-6">
        {SUB_TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchReports} />
      ) : (
        <>
          {tab === "overview" && (
            <OverviewTab reports={reports} onNavigate={setTab} />
          )}
          {tab === "workorders" && (
            <WorkOrdersTab
              reports={reports}
              onAssign={handleAssign}
              onResolve={handleResolve}
              toast={toast}
            />
          )}
          {tab === "history" && <HistoryTab reports={reports} />}
          {tab === "downtime" && <DowntimeTab reports={reports} />}
          {tab === "schedule" && <SchedulingTab toast={toast} />}
        </>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Overview tab                                                     */
/* ================================================================ */
function OverviewTab({ reports, onNavigate }) {
  const open = reports.filter((r) => r.status === "OPEN");
  const inFlight = reports.filter(
    (r) => r.status === "ASSIGNED" || r.status === "IN_PROGRESS"
  );

  return (
    <div className="space-y-6">
      {/* Open unassigned issues */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Open Unassigned Issues</h2>
          <button
            onClick={() => onNavigate("workorders")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Manage all <ChevronRight size={14} />
          </button>
        </div>
        {open.length === 0 ? (
          <EmptyState icon={CheckCircle2} title="No open unassigned issues" />
        ) : (
          <div className="divide-y divide-slate-100">
            {open.slice(0, 5).map((r) => (
              <IssueRowCompact key={r.issueReportId} report={r} />
            ))}
          </div>
        )}
      </div>

      {/* Active work orders */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Active Work Orders</h2>
          <button
            onClick={() => onNavigate("workorders")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        {inFlight.length === 0 ? (
          <EmptyState icon={Wrench} title="No active work orders" />
        ) : (
          <div className="divide-y divide-slate-100">
            {inFlight.slice(0, 5).map((r) => (
              <IssueRowCompact key={r.issueReportId} report={r} showTech />
            ))}
          </div>
        )}
      </div>

      {/* Equipment under maintenance — derived from OPEN/ASSIGNED/IN_PROGRESS */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={16} className="text-amber-600" />
          <h2 className="text-sm font-bold text-amber-800">Equipment Currently Affected</h2>
        </div>
        {(() => {
          const affected = [
            ...new Set(
              reports
                .filter((r) => r.status !== "RESOLVED" && r.status !== "CLOSED" && r.status !== "CANCELLED")
                .map((r) => r.equipmentId)
            ),
          ];
          return affected.length === 0 ? (
            <p className="text-xs text-amber-700">No equipment currently affected by open issues.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {affected.map((eqId) => (
                <span
                  key={eqId}
                  className="rounded-full border border-amber-200 bg-white text-amber-800 text-xs font-semibold px-3 py-1"
                >
                  Equipment #{eqId}
                </span>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 gap-4">
        <button
          onClick={() => onNavigate("schedule")}
          className="rounded-2xl border border-blue-200 bg-blue-50 hover:bg-blue-100 p-5 text-left transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              <CalendarDays size={15} className="text-blue-600" />
            </span>
            <p className="text-sm font-bold text-blue-900">Plan Maintenance Schedule</p>
          </div>
          <p className="text-xs text-blue-700">Schedule upcoming preventive maintenance tasks.</p>
        </button>
        <button
          onClick={() => onNavigate("downtime")}
          className="rounded-2xl border border-orange-200 bg-orange-50 hover:bg-orange-100 p-5 text-left transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
              <Clock size={15} className="text-orange-600" />
            </span>
            <p className="text-sm font-bold text-orange-900">View Equipment Downtime</p>
          </div>
          <p className="text-xs text-orange-700">Track downtime from reported issues and resolutions.</p>
        </button>
      </div>
    </div>
  );
}

function IssueRowCompact({ report, showTech }) {
  return (
    <div className="py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-slate-800">
            #{report.issueReportId} — Eq #{report.equipmentId}
          </p>
          <StatusBadge status={report.priority} />
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          {report.issueType || "Issue"} · Reported {fmtDate(report.createdAt)}
          {showTech && report.assignedTechnicianId
            ? ` · Tech #${report.assignedTechnicianId}`
            : ""}
        </p>
      </div>
      <StatusBadge status={report.status} />
    </div>
  );
}

/* ================================================================ */
/*  Work Orders tab — assign + resolve actions                       */
/* ================================================================ */
function WorkOrdersTab({ reports, onAssign, onResolve, toast }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedReport, setSelectedReport] = useState(null);

  const activeReports = reports.filter(
    (r) => r.status !== "RESOLVED" && r.status !== "CLOSED" && r.status !== "CANCELLED"
  );

  const filtered = activeReports.filter((r) => {
    if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        String(r.issueReportId).includes(q) ||
        String(r.equipmentId).includes(q) ||
        (r.issueType || "").toLowerCase().includes(q) ||
        (r.issueDescription || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (selectedReport) {
    return (
      <WorkOrderDetail
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
        onAssign={(techId) => {
          onAssign(selectedReport.issueReportId, techId);
          setSelectedReport(null);
        }}
        onResolve={() => {
          onResolve(selectedReport.issueReportId);
          setSelectedReport(null);
        }}
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, equipment, issue type…"
            className="rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {STATUS_TABS.filter((s) => s.id !== "RESOLVED").map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                statusFilter === s.id
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} work order{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title="No work orders found"
          subtitle="Try adjusting the search or filter."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">ID</th>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                <th className="text-left font-semibold px-5 py-3">Issue Type</th>
                <th className="text-left font-semibold px-5 py-3">Priority</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-left font-semibold px-5 py-3">Technician</th>
                <th className="text-left font-semibold px-5 py-3">Reported</th>
                <th className="text-right font-semibold px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r.issueReportId}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedReport(r)}
                >
                  <td className="px-5 py-3.5 font-semibold text-blue-600">
                    #{r.issueReportId}
                  </td>
                  <td className="px-5 py-3.5 text-slate-700">Eq #{r.equipmentId}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-[180px] truncate">
                    {r.issueType || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {r.assignedTechnicianId
                      ? `Tech #${r.assignedTechnicianId}`
                      : <span className="text-amber-500 font-semibold">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {fmtDate(r.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight size={15} className="text-slate-400 ml-auto" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Work Order Detail ── */
function WorkOrderDetail({ report, onBack, onAssign, onResolve }) {
  const [technicianId, setTechnicianId] = useState(
    report.assignedTechnicianId ? String(report.assignedTechnicianId) : ""
  );
  const [assignError, setAssignError] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");

  const handleAssign = () => {
    if (!technicianId.trim() || isNaN(Number(technicianId)) || Number(technicianId) < 1) {
      setAssignError("Enter a valid positive technician user ID (integer).");
      return;
    }
    setAssignError("");
    onAssign(Number(technicianId));
  };

  const isResolvable =
    report.status === "ASSIGNED" || report.status === "IN_PROGRESS" || report.status === "OPEN";

  /* Running downtime for active issues */
  const runningMs = report.createdAt
    ? Date.now() - new Date(report.createdAt).getTime()
    : null;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Work Orders
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              Work Order #{report.issueReportId}
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              {report.issueType || "Equipment Issue"} — Equipment #{report.equipmentId}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Reported by User #{report.reportedBy} on {fmtDate(report.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={report.priority} />
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Running downtime banner */}
        {runningMs !== null && report.status !== "RESOLVED" && (
          <div className="flex items-center gap-3 rounded-xl border border-orange-200 bg-orange-50 px-4 py-3">
            <Clock size={15} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-xs font-bold text-orange-800">Equipment Downtime Running</p>
              <p className="text-xs text-orange-700 mt-0.5">
                Downtime start: {fmtDt(report.createdAt)} &nbsp;·&nbsp;
                Running: <span className="font-semibold">{downtimeDuration(runningMs)}</span>
              </p>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
            Issue Description
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {report.issueDescription || "No description provided."}
          </p>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-3 gap-4">
          <InfoBox label="Equipment ID" value={`#${report.equipmentId}`} />
          <InfoBox label="Booking ID" value={`#${report.bookingId}`} />
          <InfoBox label="Reported At" value={fmtDt(report.createdAt)} />
          <InfoBox label="Last Updated" value={fmtDt(report.updatedAt)} />
          <InfoBox label="Resolved At" value={report.resolvedAt ? fmtDt(report.resolvedAt) : "—"} />
          <InfoBox
            label="Assigned Technician"
            value={
              report.assignedTechnicianId
                ? `Technician #${report.assignedTechnicianId}`
                : "Not yet assigned"
            }
          />
        </div>

        {/* Resolution notes (if resolved) */}
        {report.resolutionNotes && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1.5">
              Resolution Notes
            </p>
            <p className="text-sm text-emerald-800">{report.resolutionNotes}</p>
          </div>
        )}

        {/* Attachment */}
        {report.attachmentSecureUrl && (
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Attachment
            </p>
            <a
              href={report.attachmentSecureUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              {report.attachmentFileName || "View Attachment"}
            </a>
          </div>
        )}

        {/* Actions — only for active issues */}
        {report.status !== "RESOLVED" && report.status !== "CLOSED" && report.status !== "CANCELLED" && (
          <div className="border-t border-slate-100 pt-5 space-y-6">
            {/* Assign Technician */}
            <div>
              <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <UserCheck size={16} className="text-blue-500" />
                Assign Technician
              </p>
              {/* NOTE: No /api/users?role=TECHNICIAN endpoint exists in the backend.
                  Until a real technician-listing API is added, we use a numeric input for
                  the technician user ID (maps to assignedTechnicianId in real API).
              */}
              <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3.5 py-2.5 mb-3">
                <Info size={13} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700">
                  Enter the technician's user ID. Assignment uses the real backend API
                  (<code className="font-mono text-[11px]">POST /api/issue-reports/{"{id}"}/assign</code>).
                  A dedicated technician-listing endpoint (<code className="font-mono text-[11px]">GET /api/users?role=TECHNICIAN</code>)
                  does not yet exist in the backend.
                </p>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Field label="Technician User ID" error={assignError}>
                    <input
                      type="number"
                      min="1"
                      value={technicianId}
                      onChange={(e) => {
                        setTechnicianId(e.target.value);
                        setAssignError("");
                      }}
                      placeholder="e.g. 42"
                      className={inputClass(assignError)}
                    />
                  </Field>
                </div>
                <button
                  onClick={handleAssign}
                  disabled={!technicianId}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 transition-colors mb-0.5"
                >
                  {report.assignedTechnicianId ? "Reassign" : "Assign"}
                </button>
              </div>
            </div>

            {/* Resolve */}
            {isResolvable && (
              <div>
                <p className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Mark as Resolved
                </p>
                {!confirmResolve ? (
                  <button
                    onClick={() => setConfirmResolve(true)}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-sm font-semibold px-5 py-2.5 transition-colors"
                  >
                    Mark Resolved
                  </button>
                ) : (
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-4">
                    <p className="text-sm text-emerald-800">
                      Confirm resolve? Equipment will be returned to{" "}
                      <span className="font-semibold">Available</span> status.
                    </p>
                    {/* Resolution notes — backend POST /resolve doesn't currently
                        accept a body, but the field is shown for completeness.
                        Notes entered here are informational only. */}
                    <div>
                      <label className="text-xs font-bold text-emerald-700 uppercase tracking-wide mb-1.5 block">
                        Resolution Notes <span className="text-[10px] font-normal normal-case text-emerald-600">(optional — informational only, backend accepts no body)</span>
                      </label>
                      <textarea
                        value={resolveNotes}
                        onChange={(e) => setResolveNotes(e.target.value)}
                        rows={3}
                        placeholder="Describe what was repaired, parts replaced, or actions taken…"
                        className="w-full rounded-lg border border-emerald-200 bg-white text-sm text-slate-700 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={onResolve}
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 transition-colors shrink-0"
                      >
                        Confirm Resolve
                      </button>
                      <button
                        onClick={() => { setConfirmResolve(false); setResolveNotes(""); }}
                        className="text-xs text-slate-500 hover:text-slate-700 shrink-0"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/*  Maintenance History tab                                          */
/* ================================================================ */
function HistoryTab({ reports }) {
  const resolved = reports
    .filter((r) => r.status === "RESOLVED" || r.status === "CLOSED")
    .sort((a, b) => new Date(b.resolvedAt || 0) - new Date(a.resolvedAt || 0));

  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const filtered = resolved.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      String(r.issueReportId).includes(q) ||
      String(r.equipmentId).includes(q) ||
      (r.issueType || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by ID, equipment, issue type…"
            className="rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
          />
        </div>
        <span className="text-xs text-slate-400 ml-auto">
          {filtered.length} record{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No maintenance history yet"
          subtitle="Resolved and closed issues will appear here."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Work Order</th>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                <th className="text-left font-semibold px-5 py-3">Issue</th>
                <th className="text-left font-semibold px-5 py-3">Priority</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-left font-semibold px-5 py-3">Technician</th>
                <th className="text-left font-semibold px-5 py-3">Reported</th>
                <th className="text-left font-semibold px-5 py-3">Resolved</th>
                <th className="text-left font-semibold px-5 py-3">Downtime</th>
                <th className="text-right font-semibold px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => {
                const dt = downtimeHours(r);
                const isExpanded = expandedId === r.issueReportId;
                return (
                  <>
                    <tr
                      key={r.issueReportId}
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : r.issueReportId)}
                    >
                      <td className="px-5 py-3.5 font-semibold text-blue-600">#{r.issueReportId}</td>
                      <td className="px-5 py-3.5 text-slate-700">Eq #{r.equipmentId}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">{r.issueType || "—"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.priority} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5 text-slate-600 text-xs">
                        {r.assignedTechnicianId ? `Tech #${r.assignedTechnicianId}` : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{fmtDate(r.createdAt)}</td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{r.resolvedAt ? fmtDate(r.resolvedAt) : "—"}</td>
                      <td className="px-5 py-3.5 text-xs">
                        {dt ? (
                          <span className="text-orange-600 font-semibold">{dt}h</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ChevronDown
                          size={14}
                          className={`text-slate-400 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        />
                      </td>
                    </tr>
                    {isExpanded && (
                      <tr key={`${r.issueReportId}-detail`} className="bg-slate-50">
                        <td colSpan={10} className="px-5 py-4">
                          <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Issue Description</p>
                              <p className="text-xs text-slate-700 leading-relaxed">{r.issueDescription || "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Resolution Notes</p>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {r.resolutionNotes || <span className="text-slate-400 italic">No resolution notes recorded.</span>}
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Resolved By</p>
                              <p className="text-xs text-slate-700">{r.resolvedBy ? `User #${r.resolvedBy}` : "—"}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Booking ID</p>
                              <p className="text-xs text-slate-700">#{r.bookingId}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Downtime Tab                                                     */
/* ================================================================ */
function DowntimeTab({ reports }) {
  /* Downtime is approximated from issue createdAt → resolvedAt.
     A dedicated downtime tracking API does not currently exist in the backend.
  */

  const withDowntime = reports
    .filter((r) => r.createdAt && r.resolvedAt)
    .map((r) => ({ ...r, _dtHours: downtimeHours(r) }))
    .sort((a, b) => b._dtHours - a._dtHours);

  const openDowntime = reports.filter(
    (r) => r.status !== "RESOLVED" && r.status !== "CLOSED" && r.status !== "CANCELLED"
  );

  /* total approx downtime */
  const totalHours = withDowntime.reduce(
    (acc, r) => acc + parseFloat(r._dtHours || 0),
    0
  ).toFixed(1);

  /* Current running totals for open issues */
  const [tick, setTick] = useState(0);
  const tickRef = useRef(null);
  useEffect(() => {
    if (openDowntime.length === 0) return;
    tickRef.current = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(tickRef.current);
  }, [openDowntime.length]);

  return (
    <div className="space-y-6">
      {/* Info note */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Downtime is approximated from issue{" "}
          <span className="font-semibold">reported date</span> to{" "}
          <span className="font-semibold">resolved date</span>. A dedicated downtime
          tracking API (with precise maintenance windows) does not yet exist in the backend.
          Running downtime for open issues is calculated client-side from{" "}
          <code className="font-mono text-[10px]">createdAt</code> to now.
        </p>
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Clock} label="Currently Affected Equipment" value={openDowntime.length} tone="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={CheckCircle2} label="Resolved Incidents" value={withDowntime.length} tone="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Clock} label="Total Approx. Downtime (hrs)" value={`${totalHours}h`} tone="text-red-600" bg="bg-red-50" />
      </div>

      {/* Currently affected equipment */}
      {openDowntime.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3">Currently Affected Equipment</h2>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Work Order</th>
                  <th className="text-left font-semibold px-5 py-3">Equipment</th>
                  <th className="text-left font-semibold px-5 py-3">Issue</th>
                  <th className="text-left font-semibold px-5 py-3">Priority</th>
                  <th className="text-left font-semibold px-5 py-3">Status</th>
                  <th className="text-left font-semibold px-5 py-3">Technician</th>
                  <th className="text-left font-semibold px-5 py-3">Downtime Start</th>
                  <th className="text-left font-semibold px-5 py-3">Running (approx)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {openDowntime.map((r) => {
                  const runningMs = r.createdAt
                    ? Date.now() - new Date(r.createdAt).getTime()
                    : null;
                  return (
                    <tr key={r.issueReportId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-semibold text-blue-600">#{r.issueReportId}</td>
                      <td className="px-5 py-3.5 text-slate-700">Eq #{r.equipmentId}</td>
                      <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">{r.issueType || "—"}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.priority} /></td>
                      <td className="px-5 py-3.5"><StatusBadge status={r.status} /></td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">
                        {r.assignedTechnicianId ? `Tech #${r.assignedTechnicianId}` : <span className="text-amber-500">Unassigned</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500 text-xs">{fmtDt(r.createdAt)}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-orange-600">
                        {runningMs ? downtimeDuration(runningMs) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Historical downtime */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3">Resolved Downtime History</h2>
        {withDowntime.length === 0 ? (
          <EmptyState icon={Clock} title="No historical downtime data yet" subtitle="Resolved issues with timestamps will appear here." />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Work Order</th>
                  <th className="text-left font-semibold px-5 py-3">Equipment</th>
                  <th className="text-left font-semibold px-5 py-3">Issue</th>
                  <th className="text-left font-semibold px-5 py-3">Priority</th>
                  <th className="text-left font-semibold px-5 py-3">Downtime Start</th>
                  <th className="text-left font-semibold px-5 py-3">Downtime End</th>
                  <th className="text-left font-semibold px-5 py-3">Duration</th>
                  <th className="text-left font-semibold px-5 py-3">Equipment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {withDowntime.map((r) => (
                  <tr key={r.issueReportId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-blue-600">#{r.issueReportId}</td>
                    <td className="px-5 py-3.5 text-slate-700">Eq #{r.equipmentId}</td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-[160px] truncate">{r.issueType || "—"}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={r.priority} /></td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{fmtDt(r.createdAt)}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{fmtDt(r.resolvedAt)}</td>
                    <td className="px-5 py-3.5 text-xs font-bold text-orange-600">{r._dtHours}h</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-1 uppercase tracking-wide">
                        Available
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================ */
/*  Scheduling Tab — Local UI only, no backend persistence           */
/* ================================================================ */

const MAINTENANCE_TYPES = [
  "Preventive Maintenance",
  "Calibration",
  "Safety Inspection",
  "Software Update",
  "Hardware Service",
  "Cleaning & Decontamination",
  "Part Replacement",
  "Performance Verification",
  "Other",
];

const SCHEDULED_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

let scheduleCounter = 1;

function SchedulingTab({ toast }) {
  const [schedules, setSchedules] = useState([
    {
      id: scheduleCounter++,
      equipmentId: "101",
      maintenanceType: "Preventive Maintenance",
      scheduledDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      scheduledTime: "09:00",
      priority: "MEDIUM",
      description: "Regular quarterly servicing and fluid checks.",
      assignedTechnicianId: "",
      status: "SCHEDULED",
    },
    {
      id: scheduleCounter++,
      equipmentId: "102",
      maintenanceType: "Calibration",
      scheduledDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
      scheduledTime: "14:00",
      priority: "HIGH",
      description: "Annual calibration certification renewal required.",
      assignedTechnicianId: "",
      status: "SCHEDULED",
    },
  ]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(blankForm());

  function blankForm() {
    return {
      equipmentId: "",
      maintenanceType: MAINTENANCE_TYPES[0],
      scheduledDate: "",
      scheduledTime: "09:00",
      priority: "MEDIUM",
      description: "",
      assignedTechnicianId: "",
      status: "SCHEDULED",
    };
  }

  const [errors, setErrors] = useState({});

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.equipmentId.trim()) e.equipmentId = "Equipment ID is required.";
    if (!form.scheduledDate) e.scheduledDate = "Scheduled date is required.";
    if (!form.description.trim()) e.description = "Description is required.";
    return e;
  };

  const handleSave = () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    if (editingId) {
      setSchedules((list) =>
        list.map((s) => (s.id === editingId ? { ...s, ...form } : s))
      );
      toast("Maintenance schedule updated (local only — no backend persistence).", "success");
    } else {
      setSchedules((list) => [
        ...list,
        { id: scheduleCounter++, ...form },
      ]);
      toast("Maintenance scheduled (local only — no backend persistence).", "success");
    }
    setShowForm(false);
    setEditingId(null);
    setForm(blankForm());
    setErrors({});
  };

  const handleEdit = (s) => {
    setForm({
      equipmentId: s.equipmentId,
      maintenanceType: s.maintenanceType,
      scheduledDate: s.scheduledDate,
      scheduledTime: s.scheduledTime,
      priority: s.priority,
      description: s.description,
      assignedTechnicianId: s.assignedTechnicianId || "",
      status: s.status,
    });
    setEditingId(s.id);
    setShowForm(true);
    setErrors({});
  };

  const handleDelete = (id) => {
    setSchedules((list) => list.filter((s) => s.id !== id));
    toast("Schedule removed.", "info");
  };

  const handleStatusChange = (id, newStatus) => {
    setSchedules((list) =>
      list.map((s) => (s.id === id ? { ...s, status: newStatus } : s))
    );
  };

  const upcoming = schedules.filter((s) => s.status === "SCHEDULED" || s.status === "IN_PROGRESS");
  const completed = schedules.filter((s) => s.status === "DONE" || s.status === "CANCELLED");

  return (
    <div className="space-y-6">
      {/* Backend limitation notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
        <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Planning UI only — no backend persistence.</span>{" "}
          The backend does not provide a dedicated maintenance scheduling API.
          Schedules entered here are stored in local React state only and will not survive a page refresh.
          When a backend scheduling endpoint is added, this UI can be connected to it.
        </p>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays size={16} className="text-blue-600" />
          Maintenance Schedule
        </h2>
        {!showForm && (
          <button
            onClick={() => { setForm(blankForm()); setEditingId(null); setShowForm(true); setErrors({}); }}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 transition-colors"
          >
            <Plus size={13} /> Schedule Maintenance
          </button>
        )}
      </div>

      {/* Schedule Form */}
      {showForm && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 mb-4">
            {editingId ? "Edit Scheduled Maintenance" : "New Maintenance Schedule"}
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Equipment ID" required error={errors.equipmentId}>
              <input
                value={form.equipmentId}
                onChange={set("equipmentId")}
                placeholder="e.g. 101"
                className={inputClass(errors.equipmentId)}
              />
            </Field>
            <Field label="Maintenance Type" required>
              <select value={form.maintenanceType} onChange={set("maintenanceType")} className={inputClass()}>
                {MAINTENANCE_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Scheduled Date" required error={errors.scheduledDate}>
              <input
                type="date"
                value={form.scheduledDate}
                onChange={set("scheduledDate")}
                min={new Date().toISOString().slice(0, 10)}
                className={inputClass(errors.scheduledDate)}
              />
            </Field>
            <Field label="Scheduled Time">
              <input
                type="time"
                value={form.scheduledTime}
                onChange={set("scheduledTime")}
                className={inputClass()}
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Priority">
              <div className="grid grid-cols-4 gap-2">
                {SCHEDULED_PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, priority: p }))}
                    className={`rounded-lg border px-2 py-2 text-xs font-bold transition-all ${
                      form.priority === p
                        ? PRIORITY_COLOR[p] + " ring-2 ring-offset-1 ring-current"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Assigned Technician (User ID)">
              <input
                type="number"
                min="1"
                value={form.assignedTechnicianId}
                onChange={set("assignedTechnicianId")}
                placeholder="e.g. 42 (optional)"
                className={inputClass()}
              />
            </Field>
          </div>

          <Field label="Description / Maintenance Notes" required error={errors.description}>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={3}
              placeholder="Describe the maintenance task, required parts, procedures, or special requirements…"
              className={inputClass(errors.description)}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              {editingId ? "Update Schedule" : "Add to Schedule"}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); setErrors({}); }}
              className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Upcoming / In Progress */}
      <div>
        <h3 className="text-sm font-bold text-slate-900 mb-3">
          Upcoming & Active ({upcoming.length})
        </h3>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming maintenance scheduled"
            subtitle="Click 'Schedule Maintenance' to add a planned task."
          />
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completed.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">
            Completed / Cancelled ({completed.length})
          </h3>
          <div className="space-y-3">
            {completed.map((s) => (
              <ScheduleCard
                key={s.id}
                schedule={s}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                dimmed
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleCard({ schedule, onEdit, onDelete, onStatusChange, dimmed }) {
  const isPast = schedule.scheduledDate && new Date(schedule.scheduledDate) < new Date();

  const statusColors = {
    SCHEDULED: "border-blue-200 bg-blue-50 text-blue-700",
    IN_PROGRESS: "border-orange-200 bg-orange-50 text-orange-700",
    DONE: "border-emerald-200 bg-emerald-50 text-emerald-700",
    CANCELLED: "border-slate-200 bg-slate-50 text-slate-500",
  };

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-start justify-between gap-4 ${dimmed ? "opacity-70" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <p className="text-sm font-bold text-slate-900">{schedule.maintenanceType}</p>
          <StatusBadge status={schedule.priority} />
          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusColors[schedule.status] || "border-slate-200 text-slate-600"}`}>
            {schedule.status.replace(/_/g, " ")}
          </span>
          {isPast && schedule.status === "SCHEDULED" && (
            <span className="rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">Overdue</span>
          )}
        </div>
        <p className="text-xs text-slate-600 mb-1">
          Equipment #{schedule.equipmentId}
          {schedule.assignedTechnicianId ? ` · Tech #${schedule.assignedTechnicianId}` : " · Technician unassigned"}
        </p>
        <p className="text-xs text-slate-500 mb-2">
          <CalendarDays size={11} className="inline mr-1 text-slate-400" />
          {schedule.scheduledDate || "—"} at {schedule.scheduledTime || "—"}
        </p>
        <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{schedule.description}</p>
      </div>

      <div className="flex items-start gap-2 shrink-0">
        {/* Status update */}
        <select
          value={schedule.status}
          onChange={(e) => onStatusChange(schedule.id, e.target.value)}
          className="rounded-lg border border-slate-200 text-xs px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="DONE">Done</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <button
          onClick={() => onEdit(schedule)}
          className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold px-3 py-1.5 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(schedule.id)}
          className="rounded-lg border border-red-100 hover:bg-red-50 text-red-500 text-xs p-1.5 transition-colors"
          title="Remove schedule"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

/* ── Shared helpers ── */
function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-700 font-semibold">{value || "—"}</p>
    </div>
  );
}
