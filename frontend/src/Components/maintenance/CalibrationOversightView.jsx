/**
 * CalibrationOversightView.jsx
 * ------------------------------------------------------------------
 * Lab Manager — Calibration & Certification Oversight
 *
 * M3 Task 2 — Calibration & Certification Management (Manager role)
 *
 * Real API connections (EquipmentController → EquipmentService):
 *   GET /api/equipment/search → List<EquipmentDto> with embedded fields:
 *     - calibrationStatus:         "VALID" | "DUE_SOON" | "OVERDUE" | "NOT_RECORDED"
 *     - nextCalibrationDue:        ISO date string (LocalDate)
 *     - calibrationRequired:       boolean
 *     - calibrationIntervalMonths: integer | null
 *
 * Backend NOT available (documented):
 *   - No GET /api/calibrations — no dedicated calibration list endpoint
 *   - No POST /api/calibrations — no write endpoint; view is READ-ONLY
 *   - No calibration history per equipment from API
 *   Individual calibration records are stored in EquipmentCalibration table
 *   but not exposed via a REST endpoint.
 *
 * To schedule calibration maintenance:
 *   Use Maintenance Oversight → Scheduling tab.
 *
 * CalibrationReminderJob (backend scheduler) sends CALIBRATION_OVERDUE and
 * CALIBRATION_DUE_SOON notifications to Lab Managers daily at 6:00 AM.
 * ------------------------------------------------------------------
 */

import { useCallback, useEffect, useState } from "react";
import {
  Thermometer, RefreshCw, XCircle, AlertTriangle, CheckCircle2,
  Search, ChevronRight, ArrowLeft, Info, Clock, FileText,
  CalendarDays, ShieldCheck, Activity,
} from "lucide-react";
import {
  StatusBadge, ViewHeader, StatCard, EmptyState,
} from "../shared/ui.jsx";
import { calibrationApi } from "../../api/calibrationApi.js";
import { ApiError } from "../../api/client.js";

/* ─── Helpers ───────────────────────────────────────────────────── */
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });
}

/** Returns number of days until nextDueDateStr. Negative = overdue. */
function calDays(nextDueDateStr) {
  if (!nextDueDateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(nextDueDateStr); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function DaysChip({ days }) {
  if (days === null) return <span className="text-xs text-slate-400">No date</span>;
  if (days < 0)
    return <span className="text-xs font-bold text-red-600">{Math.abs(days)}d overdue</span>;
  if (days === 0)
    return <span className="text-xs font-bold text-red-500">Due today</span>;
  if (days <= 30)
    return <span className="text-xs font-bold text-amber-600">Due in {days}d</span>;
  return <span className="text-xs text-emerald-600">Due in {days}d</span>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={20} className="text-blue-500 animate-spin" />
      <span className="ml-2 text-sm text-slate-500">Loading calibration data…</span>
    </div>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
      <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700">Failed to load calibration data</p>
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

const CAL_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "OVERDUE", label: "Overdue" },
  { id: "DUE_SOON", label: "Due Soon" },
  { id: "VALID", label: "Valid" },
  { id: "NOT_RECORDED", label: "Not Recorded" },
];

const CAL_RANK = { OVERDUE: 0, DUE_SOON: 1, NOT_RECORDED: 2, VALID: 3 };

/* ================================================================ */
/*  Main exported component                                          */
/* ================================================================ */
export default function CalibrationOversightView({ toast }) {
  const [allEquipment, setAllEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const fetchEquipment = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await calibrationApi.getAllWithCalibration();
      setAllEquipment(data || []);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Could not load equipment calibration data from the server."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEquipment(); }, [fetchEquipment]);

  /* Show equipment where calibration is required OR already has a record */
  const tracked = allEquipment.filter(
    (e) => e.calibrationRequired || e.calibrationStatus !== "NOT_RECORDED"
  );

  const counts = {
    overdue: tracked.filter((e) => e.calibrationStatus === "OVERDUE").length,
    dueSoon: tracked.filter((e) => e.calibrationStatus === "DUE_SOON").length,
    valid: tracked.filter((e) => e.calibrationStatus === "VALID").length,
    notRecorded: tracked.filter((e) => e.calibrationStatus === "NOT_RECORDED").length,
  };

  const filtered = tracked
    .filter((e) => {
      if (filter !== "ALL" && e.calibrationStatus !== filter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          (e.name || "").toLowerCase().includes(q) ||
          (e.category || "").toLowerCase().includes(q) ||
          (e.location || "").toLowerCase().includes(q) ||
          String(e.equipmentId).includes(q) ||
          (e.serialNumber || "").toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort(
      (a, b) =>
        (CAL_RANK[a.calibrationStatus] ?? 9) -
        (CAL_RANK[b.calibrationStatus] ?? 9)
    );

  if (selected) {
    return (
      <CalibrationDetailView
        equipment={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <ViewHeader
        title="Calibration Oversight"
        subtitle="Monitor calibration compliance across all department equipment. Data sourced from the real equipment API."
        action={
          <button
            onClick={fetchEquipment}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* Real-API notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-5">
        <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          Calibration status is live data from{" "}
          <code className="font-mono text-[10px]">GET /api/equipment/search</code> (real backend).
          Calibration record updates are not available — no write endpoint exists.
          To schedule calibration work, use{" "}
          <span className="font-semibold">Maintenance Oversight → Scheduling</span>.
          Automated reminders are sent daily by the backend{" "}
          <code className="font-mono text-[10px]">CalibrationReminderJob</code>.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <ErrorBanner message={error} onRetry={fetchEquipment} />
      ) : (
        <>
          {/* Summary stat cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={counts.overdue}
              tone="text-red-600"
              bg="bg-red-50"
              onClick={() => setFilter("OVERDUE")}
            />
            <StatCard
              icon={Clock}
              label="Due Soon (≤30 days)"
              value={counts.dueSoon}
              tone="text-amber-600"
              bg="bg-amber-50"
              onClick={() => setFilter("DUE_SOON")}
            />
            <StatCard
              icon={CheckCircle2}
              label="Valid"
              value={counts.valid}
              tone="text-emerald-600"
              bg="bg-emerald-50"
              onClick={() => setFilter("VALID")}
            />
            <StatCard
              icon={FileText}
              label="Not Recorded"
              value={counts.notRecorded}
              tone="text-slate-500"
              bg="bg-slate-100"
              onClick={() => setFilter("NOT_RECORDED")}
            />
          </div>

          {/* Alert banners */}
          {counts.overdue > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
              <AlertTriangle size={16} className="text-red-500 shrink-0" />
              <p className="text-sm font-semibold text-red-700">
                {counts.overdue} equipment item{counts.overdue !== 1 ? "s are" : " is"} overdue
                for calibration — bookings on these items may be restricted.
              </p>
              <button
                onClick={() => setFilter("OVERDUE")}
                className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 shrink-0"
              >
                View →
              </button>
            </div>
          )}
          {counts.dueSoon > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
              <Clock size={16} className="text-amber-500 shrink-0" />
              <p className="text-sm font-semibold text-amber-700">
                {counts.dueSoon} equipment item{counts.dueSoon !== 1 ? "s are" : " is"} due for
                calibration within 30 days. Schedule calibration to avoid service interruption.
              </p>
              <button
                onClick={() => setFilter("DUE_SOON")}
                className="ml-auto text-xs font-semibold text-amber-600 hover:text-amber-700 shrink-0"
              >
                View →
              </button>
            </div>
          )}
          {counts.notRecorded > 0 && (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-4">
              <FileText size={15} className="text-slate-400 shrink-0" />
              <p className="text-sm text-slate-600">
                {counts.notRecorded} calibration-required equipment item{counts.notRecorded !== 1 ? "s have" : " has"} no
                calibration record on file.
              </p>
            </div>
          )}

          {/* Filter + search toolbar */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, category, location…"
                className="rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-wrap">
              {CAL_FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    filter === f.id
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <span className="ml-auto text-xs text-slate-400">
              {filtered.length} item{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Equipment calibration table */}
          {filtered.length === 0 ? (
            <EmptyState
              icon={Thermometer}
              title={
                allEquipment.length === 0
                  ? "No equipment found in department"
                  : "No items match the current filter"
              }
              subtitle={
                allEquipment.length === 0
                  ? "Equipment will appear here once added to your department."
                  : "Try changing the filter or clearing the search."
              }
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3">Equipment</th>
                    <th className="text-left font-semibold px-5 py-3">Category</th>
                    <th className="text-left font-semibold px-5 py-3">Location</th>
                    <th className="text-left font-semibold px-5 py-3">Cal Status</th>
                    <th className="text-left font-semibold px-5 py-3">Next Due</th>
                    <th className="text-left font-semibold px-5 py-3">Remaining</th>
                    <th className="text-left font-semibold px-5 py-3">Interval</th>
                    <th className="text-left font-semibold px-5 py-3">Required</th>
                    <th className="text-right font-semibold px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((e) => {
                    const days = calDays(e.nextCalibrationDue);
                    const rowBg =
                      e.calibrationStatus === "OVERDUE"
                        ? "bg-red-50/50"
                        : e.calibrationStatus === "DUE_SOON"
                        ? "bg-amber-50/40"
                        : "";
                    return (
                      <tr
                        key={e.equipmentId}
                        onClick={() => setSelected(e)}
                        className={`cursor-pointer hover:bg-slate-50 transition-colors ${rowBg}`}
                      >
                        <td className="px-5 py-3.5">
                          <p className="font-semibold text-slate-800">{e.name}</p>
                          <p className="text-[11px] text-slate-400">
                            ID #{e.equipmentId}
                            {e.serialNumber ? ` · S/N ${e.serialNumber}` : ""}
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">{e.category || "—"}</td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs max-w-[140px] truncate">
                          {e.location || "—"}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={e.calibrationStatus} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 text-xs">
                          {fmtDate(e.nextCalibrationDue)}
                        </td>
                        <td className="px-5 py-3.5">
                          <DaysChip days={days} />
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 text-xs">
                          {e.calibrationIntervalMonths
                            ? `${e.calibrationIntervalMonths} mo`
                            : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-xs">
                          {e.calibrationRequired ? (
                            <span className="font-semibold text-slate-700">Yes</span>
                          ) : (
                            <span className="text-slate-400">No</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <ChevronRight size={15} className="text-slate-400 ml-auto" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* All-equipment note */}
          {allEquipment.length > tracked.length && (
            <p className="text-xs text-slate-400 mt-3 text-center">
              {allEquipment.length - tracked.length} equipment item{allEquipment.length - tracked.length !== 1 ? "s" : ""} without
              calibration requirements are hidden. Adjust filters to view all.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Calibration Detail View                                          */
/* ================================================================ */
function CalibrationDetailView({ equipment, onBack }) {
  const days = calDays(equipment.nextCalibrationDue);
  const isOverdue = equipment.calibrationStatus === "OVERDUE";
  const isDueSoon = equipment.calibrationStatus === "DUE_SOON";
  const isNotRecorded = equipment.calibrationStatus === "NOT_RECORDED";

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Calibration Oversight
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">
              Equipment #{equipment.equipmentId}
            </p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{equipment.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {equipment.category || "—"} · {equipment.location || "—"}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={equipment.status} />
            <StatusBadge status={equipment.calibrationStatus} />
          </div>
        </div>

        {/* Urgency banners */}
        {isOverdue && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Calibration Overdue</p>
              <p className="text-xs text-red-600 mt-0.5">
                Was due {fmtDate(equipment.nextCalibrationDue)} —{" "}
                {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} ago.
                Equipment bookings may be automatically restricted by the system.
              </p>
            </div>
          </div>
        )}
        {isDueSoon && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock size={16} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700">Calibration Due Soon</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Due {fmtDate(equipment.nextCalibrationDue)} —{" "}
                {days} day{days !== 1 ? "s" : ""} remaining.
                Schedule calibration to avoid service interruption.
              </p>
            </div>
          </div>
        )}
        {isNotRecorded && (
          <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <FileText size={15} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600">
              No calibration record on file. If calibration is required, technicians should
              log a calibration record via their Calibration Logs view.
            </p>
          </div>
        )}

        {/* Calibration details grid */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Calibration Data (Real API)
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoBox
              label="Calibration Status"
              value={<StatusBadge status={equipment.calibrationStatus} />}
              isJsx
            />
            <InfoBox
              label="Next Calibration Due"
              value={fmtDate(equipment.nextCalibrationDue)}
            />
            <InfoBox
              label="Days Remaining"
              value={
                days === null
                  ? "No date on record"
                  : days < 0
                  ? `${Math.abs(days)} days overdue`
                  : days === 0
                  ? "Due today"
                  : `${days} days remaining`
              }
            />
            <InfoBox
              label="Calibration Required"
              value={equipment.calibrationRequired ? "Yes" : "No"}
            />
            <InfoBox
              label="Calibration Interval"
              value={
                equipment.calibrationIntervalMonths
                  ? `Every ${equipment.calibrationIntervalMonths} months`
                  : "Not specified"
              }
            />
            <InfoBox
              label="Equipment Status"
              value={<StatusBadge status={equipment.status} />}
              isJsx
            />
          </div>
        </div>

        {/* Equipment information */}
        {(equipment.serialNumber || equipment.manufacturer || equipment.model) && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
              Equipment Details
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipment.serialNumber && (
                <InfoBox label="Serial Number" value={equipment.serialNumber} />
              )}
              {equipment.manufacturer && (
                <InfoBox label="Manufacturer" value={equipment.manufacturer} />
              )}
              {equipment.model && (
                <InfoBox label="Model" value={equipment.model} />
              )}
            </div>
          </div>
        )}

        {/* Certification section */}
        <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck size={15} className="text-blue-600" />
            <p className="text-sm font-bold text-blue-900">Certification Information</p>
          </div>
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-white px-3.5 py-3">
            <Info size={13} className="text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 space-y-1">
              <p>
                Individual certificate details (certificate number, performing technician,
                calibration notes, PDF attachments) are stored in the{" "}
                <code className="font-mono text-[10px]">EquipmentCalibration</code> table
                and are not exposed via a dedicated API endpoint accessible to managers.
              </p>
              <p>
                Technicians log calibration records — including certificate uploads — through
                their <span className="font-semibold">Calibration Logs</span> view.
              </p>
              {!isNotRecorded && (
                <p className="text-emerald-700 font-semibold">
                  ✓ At least one calibration record exists for this equipment.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule action guidance */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 flex items-start gap-3">
          <CalendarDays size={15} className="text-slate-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-600">
            To schedule calibration maintenance for this equipment, navigate to{" "}
            <span className="font-semibold text-slate-700">
              Maintenance Oversight → Scheduling
            </span>{" "}
            and create a Calibration task. There is no direct calibration record write API
            available to the manager role.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Shared helper ── */
function InfoBox({ label, value, isJsx = false }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      {isJsx ? (
        value
      ) : (
        <p className="text-sm text-slate-700 font-semibold">{value || "—"}</p>
      )}
    </div>
  );
}
