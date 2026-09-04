/**
 * MaintenanceRequestView.jsx
 * ------------------------------------------------------------------
 * Researcher-facing maintenance request interface.
 *
 * M3 Task 1 — Maintenance & Work Order Management (Researcher role)
 *
 * Real API connections:
 *   - GET  /api/issue-reports/eligible-bookings  → bookings eligible to report
 *   - POST /api/issue-reports                    → submit a new report
 *   - GET  /api/issue-reports/my                 → my submitted reports list
 *
 * All three endpoints are real backend calls (EquipmentIssueReportController).
 * ------------------------------------------------------------------
 */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, Wrench, ChevronRight,
  RefreshCw, Info, XCircle,
} from "lucide-react";
import {
  Field, inputClass, StatusBadge, ViewHeader, EmptyState,
} from "../shared/ui.jsx";
import { issueReportApi } from "../../api/issueReportApi.js";
import { ApiError } from "../../api/client.js";

/* ─── Constants ────────────────────────────────────────────────── */
const ISSUE_TYPES = [
  "Mechanical Fault",
  "Electrical Fault",
  "Software / Calibration Issue",
  "Physical Damage",
  "Safety Concern",
  "Other",
];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const PRIORITY_COLOR = {
  LOW: "border-slate-200 bg-slate-50 text-slate-600",
  MEDIUM: "border-amber-200 bg-amber-50 text-amber-700",
  HIGH: "border-orange-200 bg-orange-50 text-orange-700",
  CRITICAL: "border-red-200 bg-red-50 text-red-700",
};

const STATUS_LABEL = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

/* ─── Helpers ───────────────────────────────────────────────────── */
function fmtDt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
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
        <p className="text-sm font-semibold text-red-700">Error</p>
        <p className="text-xs text-red-600 mt-0.5">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-red-600 hover:text-red-700 shrink-0"
        >
          Retry
        </button>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Main exported component                                          */
/* ================================================================ */
export default function MaintenanceRequestView({ toast }) {
  const [tab, setTab] = useState("submit"); // "submit" | "history"

  return (
    <div>
      <ViewHeader
        title="Maintenance Requests"
        subtitle="Report equipment issues and track your submitted maintenance requests."
      />

      {/* Tab bar */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit mb-6">
        {[
          { id: "submit", label: "Report an Issue" },
          { id: "history", label: "My Requests" },
        ].map((t) => (
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

      {tab === "submit" && (
        <ReportForm toast={toast} onSuccess={() => setTab("history")} />
      )}
      {tab === "history" && <MyReportsView toast={toast} />}
    </div>
  );
}

/* ================================================================ */
/*  Report Form — connected to POST /api/issue-reports              */
/* ================================================================ */
function ReportForm({ toast, onSuccess }) {
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [bookingsError, setBookingsError] = useState("");

  const [form, setForm] = useState({
    bookingId: "",
    issueType: ISSUE_TYPES[0],
    priority: "MEDIUM",
    description: "",
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(null);

  const fetchEligible = useCallback(async () => {
    setLoadingBookings(true);
    setBookingsError("");
    try {
      const data = await issueReportApi.eligibleBookings();
      setEligibleBookings(data || []);
    } catch (err) {
      setBookingsError(
        err instanceof ApiError
          ? err.message
          : "Could not load eligible bookings."
      );
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchEligible();
  }, [fetchEligible]);

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.bookingId) e.bookingId = "Select the booking to report against.";
    if (!form.description.trim()) e.description = "Describe the issue.";
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const result = await issueReportApi.report({
        bookingId: Number(form.bookingId),
        issueType: form.issueType,
        description: form.description,
        priority: form.priority,
      });
      setSubmitted(result);
      toast("Issue report submitted — Lab Manager notified.", "success");
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "Failed to submit the report. Please try again.";
      setSubmitError(msg);
      toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="max-w-lg">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle2 size={28} className="text-emerald-600" />
          </span>
          <h2 className="text-lg font-extrabold text-slate-900">Report Submitted</h2>
          <p className="mt-2 text-sm text-slate-600">
            Issue report{" "}
            <span className="font-semibold text-slate-900">
              #{submitted.issueReportId}
            </span>{" "}
            has been created. The Lab Manager has been notified and a
            technician will be assigned shortly.
          </p>
          <div className="mt-2 flex items-center justify-center gap-2">
            <StatusBadge status="OPEN" />
            <StatusBadge status={submitted.priority || form.priority} />
          </div>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => {
                setSubmitted(null);
                setForm({ bookingId: "", issueType: ISSUE_TYPES[0], priority: "MEDIUM", description: "" });
                fetchEligible();
              }}
              className="rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors"
            >
              Report Another
            </button>
            <button
              onClick={onSuccess}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              View My Requests →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-5">
      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
        <Info size={15} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          You can report an issue against a booking that is{" "}
          <span className="font-semibold">In Use</span> or{" "}
          <span className="font-semibold">Completed</span>. The equipment will
          be flagged as Under Maintenance and the Lab Manager will be alerted.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
        {/* Booking selector */}
        <Field label="Related Booking" required error={errors.bookingId}>
          {loadingBookings ? (
            <div className="flex items-center gap-2 py-2">
              <RefreshCw size={14} className="text-blue-400 animate-spin" />
              <span className="text-xs text-slate-400">Loading bookings…</span>
            </div>
          ) : bookingsError ? (
            <ErrorBanner message={bookingsError} onRetry={fetchEligible} />
          ) : eligibleBookings.length === 0 ? (
            <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <AlertTriangle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700">
                No eligible bookings found. You can only report issues for
                bookings that are In Use or Completed.
              </p>
            </div>
          ) : (
            <select
              value={form.bookingId}
              onChange={set("bookingId")}
              className={inputClass(errors.bookingId)}
            >
              <option value="">Select booking…</option>
              {eligibleBookings.map((b) => (
                <option key={b.bookingId} value={b.bookingId}>
                  {b.equipmentName} — {fmtDt(b.startTime)}
                </option>
              ))}
            </select>
          )}
        </Field>

        {/* Selected booking detail */}
        {form.bookingId && (() => {
          const b = eligibleBookings.find(
            (x) => String(x.bookingId) === String(form.bookingId)
          );
          return b ? (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600 space-y-1">
              <p><span className="font-semibold">Equipment:</span> {b.equipmentName}</p>
              <p><span className="font-semibold">Category:</span> {b.category}</p>
              <p><span className="font-semibold">Location:</span> {b.location}</p>
              <p><span className="font-semibold">Booking window:</span> {fmtDt(b.startTime)} – {fmtDt(b.endTime)}</p>
            </div>
          ) : null;
        })()}

        {/* Issue type */}
        <Field label="Issue Type" required>
          <select value={form.issueType} onChange={set("issueType")} className={inputClass()}>
            {ISSUE_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>

        {/* Priority */}
        <Field label="Severity / Priority" required>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={`rounded-lg border px-2 py-2.5 text-xs font-bold transition-all ${
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

        {/* Description */}
        <Field label="Problem Description" required error={errors.description}>
          <textarea
            value={form.description}
            onChange={set("description")}
            rows={4}
            placeholder="Describe the issue in detail — what happened, when it started, any error messages or unusual behaviour…"
            className={inputClass(errors.description)}
          />
        </Field>

        {/* Submit error */}
        {submitError && <ErrorBanner message={submitError} />}

        <button
          onClick={submit}
          disabled={submitting || loadingBookings || eligibleBookings.length === 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <RefreshCw size={15} className="animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Wrench size={15} /> Submit Issue Report
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ================================================================ */
/*  My Reports — connected to GET /api/issue-reports/my             */
/* ================================================================ */
function MyReportsView({ toast }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [selectedReport, setSelectedReport] = useState(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await issueReportApi.myReports();
      setReports(data || []);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load your maintenance reports."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const filtered =
    filterStatus === "ALL"
      ? reports
      : reports.filter((r) => r.status === filterStatus);

  /* Detail view */
  if (selectedReport) {
    return (
      <ReportDetailView
        report={selectedReport}
        onBack={() => setSelectedReport(null)}
      />
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {["ALL", "OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filterStatus === s
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s === "ALL" ? "All" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
        <button
          onClick={fetchReports}
          className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchReports} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Wrench}
          title={filterStatus === "ALL" ? "No maintenance reports yet" : `No ${STATUS_LABEL[filterStatus] || filterStatus} reports`}
          subtitle={
            filterStatus === "ALL"
              ? "Use the 'Report an Issue' tab to submit a new maintenance request."
              : "Try selecting a different status filter."
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Report ID</th>
                <th className="text-left font-semibold px-5 py-3">Issue Type</th>
                <th className="text-left font-semibold px-5 py-3">Priority</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-left font-semibold px-5 py-3">Reported</th>
                <th className="text-left font-semibold px-5 py-3">Updated</th>
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
                  <td className="px-5 py-3.5 text-slate-700">{r.issueType || "—"}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.priority} />
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {fmtDt(r.createdAt)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {fmtDt(r.updatedAt)}
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

      {/* Summary counters */}
      {!loading && !error && reports.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"].map((s) => {
            const count = reports.filter((r) => r.status === s).length;
            if (!count) return null;
            return (
              <div
                key={s}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5"
              >
                <StatusBadge status={s} />
                <span className="text-xs font-bold text-slate-700">{count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Report Detail View (Researcher read-only)                        */
/* ================================================================ */
function ReportDetailView({ report, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        ← Back to My Requests
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              Report #{report.issueReportId}
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              {report.issueType || "Equipment Issue"}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Reported {fmtDt(report.createdAt)}
            </p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={report.priority} />
            <StatusBadge status={report.status} />
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">
            Problem Description
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">
            {report.issueDescription || "—"}
          </p>
        </div>

        {/* Details grid */}
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoRow label="Equipment ID" value={`#${report.equipmentId}`} />
          <InfoRow label="Booking ID" value={`#${report.bookingId}`} />
          <InfoRow
            label="Assigned Technician"
            value={
              report.assignedTechnicianId
                ? `Technician #${report.assignedTechnicianId}`
                : "Pending assignment"
            }
          />
          <InfoRow
            label="Resolved At"
            value={report.resolvedAt ? fmtDt(report.resolvedAt) : "—"}
          />
          <InfoRow label="Last Updated" value={fmtDt(report.updatedAt)} />
        </div>

        {/* Resolution notes */}
        {report.resolutionNotes && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-1.5">
              Resolution Notes
            </p>
            <p className="text-sm text-emerald-800 leading-relaxed">
              {report.resolutionNotes}
            </p>
          </div>
        )}

        {/* Status timeline */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
            Status Timeline
          </p>
          <StatusTimeline status={report.status} />
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-slate-700 font-medium">{value || "—"}</span>
    </div>
  );
}

function StatusTimeline({ status }) {
  const steps = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED"];
  const idx = steps.indexOf(status);
  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => {
        const done = i <= idx;
        const active = i === idx;
        return (
          <div key={s} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={`h-6 w-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                  active
                    ? "border-blue-500 bg-blue-500 text-white"
                    : done
                    ? "border-emerald-500 bg-emerald-50 text-emerald-600"
                    : "border-slate-200 bg-white text-slate-300"
                }`}
              >
                {done && !active ? "✓" : i + 1}
              </div>
              <span className={`mt-1 text-[9px] font-semibold uppercase tracking-wide ${active ? "text-blue-600" : done ? "text-emerald-600" : "text-slate-300"}`}>
                {STATUS_LABEL[s]}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${done && i < idx ? "bg-emerald-400" : "bg-slate-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
