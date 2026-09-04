/**
 * TechnicianWorkOrderView.jsx
 * ------------------------------------------------------------------
 * Lab Technician — enhanced Work Order & Maintenance view.
 *
 * M3 Task 1 — Maintenance & Work Order Management (Technician role)
 *
 * API status:
 *   - Work order data shown from DEMO_MAINTENANCE_REQUESTS (mock).
 *     Reason: There is no backend endpoint that exposes issue reports
 *     filtered by the assigned technician's user ID. The only real
 *     endpoints available are:
 *       GET /api/issue-reports/my    → reporter's own submissions
 *       GET /api/issue-reports       → department-level (manager/admin)
 *     Neither returns "tasks assigned to me as technician".
 *
 *   - Status updates (IN_PROGRESS, WAITING_FOR_PARTS, COMPLETED)
 *     also have no backend endpoint. No PUT/PATCH /issue-reports/{id}
 *     endpoint exists for technicians.
 *
 *   - Resolution: POST /api/issue-reports/{id}/resolve — requires
 *     RESOLVE_EQUIPMENT_ISSUE authority which technicians may not have.
 *     This is documented in the UI.
 *
 * This component enhances the existing TechnicianDashboard with:
 *   - Better work order detail view
 *   - Professional service log entry UI
 *   - Maintenance history per equipment
 *   - Maintenance schedule (planning) view (local demo data)
 *   - Clear labeling of mock vs. real data
 * ------------------------------------------------------------------
 */

import { useState } from "react";
import {
  Wrench, ClipboardList, Clock, CheckCircle2, AlertTriangle,
  ArrowLeft, ChevronRight, Camera, FileText, Info, Package,
  CalendarDays, CheckSquare, Square, ChevronDown,
} from "lucide-react";
import {
  Field, inputClass, StatusBadge, ViewHeader, StatCard, EmptyState,
} from "../shared/ui.jsx";
import { formatDate } from "../../data/mockData.js";

const PRIORITY_COLOR = {
  LOW: "text-slate-600",
  MEDIUM: "text-amber-600",
  HIGH: "text-orange-600",
  CRITICAL: "text-red-600",
};

/* Maintenance checklist templates by issue type */
const CHECKLIST_TEMPLATES = {
  "Mechanical Fault": [
    "Inspect mechanical components for wear/damage",
    "Check lubrication levels",
    "Test moving parts for smooth operation",
    "Tighten loose connections/fasteners",
    "Record findings in service log",
  ],
  "Electrical Fault": [
    "Power off and lockout/tagout",
    "Inspect wiring and connections",
    "Check fuses and circuit breakers",
    "Test voltage/current levels",
    "Restore power and verify function",
  ],
  "Software / Calibration Issue": [
    "Record current readings/values",
    "Run diagnostics / self-test",
    "Apply calibration standards",
    "Update firmware/software if needed",
    "Document calibration results",
  ],
  default: [
    "Inspect equipment condition",
    "Identify root cause of issue",
    "Perform corrective action",
    "Test equipment post-repair",
    "Update service log",
  ],
};

function getChecklist(issueType) {
  return CHECKLIST_TEMPLATES[issueType] || CHECKLIST_TEMPLATES.default;
}

/* ================================================================ */
/*  Main exported component                                          */
/* ================================================================ */
export default function TechnicianWorkOrderView({ tasks, equipment, onUpdateTask, onResolveTask, toast }) {
  const [tab, setTab] = useState("open"); // "open" | "history" | "equipment" | "schedule"
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const open = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );
  const history = tasks.filter(
    (t) => t.status === "COMPLETED" || t.status === "CANCELLED"
  );

  const equipmentById = Object.fromEntries(equipment.map((e) => [e.id, e]));

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  /* ── Detail view ── */
  if (selectedTaskId && selectedTask) {
    return (
      <WorkOrderDetail
        task={selectedTask}
        equipment={equipmentById[selectedTask.equipmentId]}
        allTasks={tasks}
        onBack={() => setSelectedTaskId(null)}
        onUpdateStatus={(status) => {
          onUpdateTask(selectedTaskId, { status });
          toast(`Work order ${selectedTaskId} status updated to ${status.replace(/_/g, " ")}.`, "success");
        }}
        onSaveNotes={(notes) => onUpdateTask(selectedTaskId, { notes })}
        onResolve={(notes) => {
          onResolveTask(selectedTaskId, notes);
          setSelectedTaskId(null);
        }}
      />
    );
  }

  return (
    <div>
      <ViewHeader
        title="Work Orders"
        subtitle="Maintenance tasks assigned to you, service history, and planned maintenance."
      />

      {/* Summary stats */}
      <div className="grid sm:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon={AlertTriangle}
          label="Open Tasks"
          value={open.filter((t) => t.status === "OPEN").length}
          tone="text-amber-600"
          bg="bg-amber-50"
          onClick={() => setTab("open")}
        />
        <StatCard
          icon={Wrench}
          label="In Progress"
          value={open.filter((t) => t.status === "IN_PROGRESS").length}
          tone="text-blue-600"
          bg="bg-blue-50"
          onClick={() => setTab("open")}
        />
        <StatCard
          icon={Clock}
          label="Waiting for Parts"
          value={open.filter((t) => t.status === "WAITING_FOR_PARTS").length}
          tone="text-purple-600"
          bg="bg-purple-50"
          onClick={() => setTab("open")}
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={history.length}
          tone="text-emerald-600"
          bg="bg-emerald-50"
          onClick={() => setTab("history")}
        />
      </div>

      {/* Demo data notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 mb-5">
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Demo data mode:</span> Work order assignments
          are shown from demonstration data. The backend does not yet expose an API
          for technician-assigned issue reports (no{" "}
          <code className="font-mono text-[10px]">GET /api/issue-reports?assignedTo=me</code>{" "}
          endpoint). Status updates are local only. When that API is added, this view
          will connect to it.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit mb-5">
        {[
          { id: "open", label: `Open (${open.length})` },
          { id: "history", label: `History (${history.length})` },
          { id: "equipment", label: "Equipment Status" },
          { id: "schedule", label: "Maintenance Schedule" },
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

      {tab === "open" && (
        <OpenTasksTab tasks={open} equipmentById={equipmentById} onOpen={setSelectedTaskId} />
      )}
      {tab === "history" && (
        <HistoryTab tasks={history} equipmentById={equipmentById} onOpen={setSelectedTaskId} />
      )}
      {tab === "equipment" && (
        <EquipmentStatusTab equipment={equipment} tasks={tasks} />
      )}
      {tab === "schedule" && (
        <ScheduleTab tasks={tasks} equipment={equipment} />
      )}
    </div>
  );
}

/* ── Open Tasks ── */
function OpenTasksTab({ tasks, equipmentById, onOpen }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No open work orders"
        subtitle="All tasks are resolved or you have no assigned tasks."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
          <tr>
            <th className="text-left font-semibold px-5 py-3">Work Order</th>
            <th className="text-left font-semibold px-5 py-3">Equipment</th>
            <th className="text-left font-semibold px-5 py-3">Issue Type</th>
            <th className="text-left font-semibold px-5 py-3">Priority</th>
            <th className="text-left font-semibold px-5 py-3">Status</th>
            <th className="text-left font-semibold px-5 py-3">Due Date</th>
            <th className="text-right font-semibold px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((t) => {
            const overdue = t.dueDate && new Date(t.dueDate) < new Date();
            return (
              <tr
                key={t.id}
                onClick={() => onOpen(t.id)}
                className="hover:bg-slate-50 cursor-pointer transition-colors"
              >
                <td className="px-5 py-3.5 font-semibold text-blue-600">{t.id}</td>
                <td className="px-5 py-3.5 text-slate-700 max-w-[160px] truncate">
                  {equipmentById[t.equipmentId]?.name || `Eq #${t.equipmentId}`}
                </td>
                <td className="px-5 py-3.5 text-slate-600 max-w-[150px] truncate">{t.issueType}</td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={t.priority} />
                </td>
                <td className="px-5 py-3.5">
                  <StatusBadge status={t.status} />
                </td>
                <td className={`px-5 py-3.5 text-xs font-semibold ${overdue ? "text-red-500" : "text-slate-500"}`}>
                  {t.dueDate ? formatDate(t.dueDate) : "—"}
                  {overdue && <span className="ml-1.5 text-[10px] font-bold">OVERDUE</span>}
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
  );
}

/* ── History Tab ── */
function HistoryTab({ tasks, equipmentById, onOpen }) {
  const [expandedId, setExpandedId] = useState(null);

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No completed work orders"
        subtitle="Resolved and completed tasks will appear here."
      />
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
          <tr>
            <th className="text-left font-semibold px-5 py-3">Work Order</th>
            <th className="text-left font-semibold px-5 py-3">Equipment</th>
            <th className="text-left font-semibold px-5 py-3">Issue Type</th>
            <th className="text-left font-semibold px-5 py-3">Priority</th>
            <th className="text-left font-semibold px-5 py-3">Status</th>
            <th className="text-left font-semibold px-5 py-3">Resolved</th>
            <th className="text-right font-semibold px-5 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tasks.map((t) => {
            const isExpanded = expandedId === t.id;
            return (
              <>
                <tr
                  key={t.id}
                  onClick={() => setExpandedId(isExpanded ? null : t.id)}
                  className="hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-5 py-3.5 font-semibold text-emerald-600">{t.id}</td>
                  <td className="px-5 py-3.5 text-slate-700 max-w-[160px] truncate">
                    {equipmentById[t.equipmentId]?.name || `Eq #${t.equipmentId}`}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-[150px] truncate">{t.issueType}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.priority} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500 text-xs">
                    {t.dueDate ? formatDate(t.dueDate) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 ml-auto transition-transform ${isExpanded ? "rotate-180" : ""}`}
                    />
                  </td>
                </tr>
                {isExpanded && (
                  <tr key={`${t.id}-detail`} className="bg-slate-50">
                    <td colSpan={7} className="px-5 py-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Problem Description</p>
                          <p className="text-xs text-slate-700 leading-relaxed">{t.description || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Service Notes</p>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {t.notes || <span className="text-slate-400 italic">No service notes recorded.</span>}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Reported By</p>
                          <p className="text-xs text-slate-700">{t.reportedBy || "—"}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Equipment</p>
                          <p className="text-xs text-slate-700">{equipmentById[t.equipmentId]?.name || `Eq #${t.equipmentId}`} · {equipmentById[t.equipmentId]?.location || ""}</p>
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
  );
}

/* ── Equipment Status Tab ── */
function EquipmentStatusTab({ equipment, tasks }) {
  return (
    <div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipment.map((e) => {
          const openTask = tasks.find(
            (t) => t.equipmentId === e.id && t.status !== "COMPLETED" && t.status !== "CANCELLED"
          );
          const taskHistory = tasks.filter((t) => t.equipmentId === e.id);
          const completedCount = taskHistory.filter((t) => t.status === "COMPLETED").length;

          return (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{e.image || "🔧"}</span>
                <StatusBadge status={e.status} />
              </div>
              <h3 className="text-sm font-bold text-slate-900 leading-snug">{e.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5 mb-3">{e.location}</p>

              {openTask ? (
                <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 flex items-start gap-2 mb-2">
                  <AlertTriangle size={12} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-amber-700">{openTask.id}</p>
                    <p className="text-[10px] text-amber-600">{openTask.status.replace(/_/g, " ")} · {openTask.priority}</p>
                    <p className="text-[10px] text-amber-600 truncate">{openTask.issueType}</p>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 flex items-center gap-2 mb-2">
                  <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-semibold">No open issues</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500 mt-2">
                <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <p className="text-slate-400 text-[10px]">Calibration</p>
                  <p className="font-semibold text-slate-700">{e.calibrationStatus || "—"}</p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2.5 py-1.5">
                  <p className="text-slate-400 text-[10px]">Tasks done</p>
                  <p className="font-semibold text-slate-700">{completedCount} / {taskHistory.length}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Maintenance Schedule Tab (demo/local only) ── */
function ScheduleTab({ tasks, equipment }) {
  /* Build a simple upcoming maintenance list from tasks + equipment calibration dates */
  const upcoming = equipment
    .filter((e) => e.nextCalibration)
    .map((e) => ({
      type: "Calibration",
      equipment: e.name,
      equipmentId: e.id,
      date: e.nextCalibration,
      status: e.calibrationStatus,
      priority: e.calibrationStatus === "Overdue" ? "HIGH" : e.calibrationStatus === "Due soon" ? "MEDIUM" : "LOW",
    }))
    .sort((a, b) => (a.date > b.date ? 1 : -1));

  const openTasks = tasks.filter(
    (t) => t.status !== "COMPLETED" && t.status !== "CANCELLED"
  );

  return (
    <div className="space-y-6">
      {/* Backend limitation notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
        <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Demo view only — no backend persistence.</span>{" "}
          This schedule is derived from demo equipment calibration data. The backend does not
          provide a dedicated maintenance scheduling endpoint for technicians.
        </p>
      </div>

      {/* Upcoming maintenance from calibration data */}
      <div>
        <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
          <CalendarDays size={15} className="text-blue-600" />
          Upcoming Calibration & Maintenance Dates
        </h2>
        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarDays}
            title="No upcoming maintenance dates"
            subtitle="Equipment calibration dates will appear here."
          />
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left font-semibold px-5 py-3">Equipment</th>
                  <th className="text-left font-semibold px-5 py-3">Maintenance Type</th>
                  <th className="text-left font-semibold px-5 py-3">Scheduled Date</th>
                  <th className="text-left font-semibold px-5 py-3">Priority</th>
                  <th className="text-left font-semibold px-5 py-3">Calibration Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcoming.map((u) => {
                  const isPast = u.date && new Date(u.date) < new Date();
                  return (
                    <tr key={u.equipmentId} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 text-slate-700 font-semibold">{u.equipment}</td>
                      <td className="px-5 py-3.5 text-slate-600">{u.type}</td>
                      <td className={`px-5 py-3.5 text-xs font-semibold ${isPast ? "text-red-500" : "text-slate-600"}`}>
                        {formatDate(u.date)}
                        {isPast && <span className="ml-1.5 text-[10px] font-bold">OVERDUE</span>}
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={u.priority} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                          u.status === "Overdue"
                            ? "border-red-200 bg-red-50 text-red-600"
                            : u.status === "Due soon"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                        }`}>
                          {u.status || "Up to date"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Active work orders as a timeline */}
      {openTasks.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Wrench size={15} className="text-orange-600" />
            Active Work Orders
          </h2>
          <div className="space-y-3">
            {openTasks.map((t) => {
              const overdue = t.dueDate && new Date(t.dueDate) < new Date();
              return (
                <div key={t.id} className={`rounded-xl border p-4 flex items-start gap-4 ${
                  overdue ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                }`}>
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    overdue ? "bg-red-100" : "bg-orange-100"
                  }`}>
                    <Wrench size={15} className={overdue ? "text-red-500" : "text-orange-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-slate-900">{t.id}</p>
                      <StatusBadge status={t.priority} />
                      <StatusBadge status={t.status} />
                      {overdue && (
                        <span className="rounded-full bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 uppercase">Overdue</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{t.issueType}</p>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Clock size={11} />
                      Due: {t.dueDate ? formatDate(t.dueDate) : "No due date set"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ================================================================ */
/*  Work Order Detail                                                */
/* ================================================================ */
function WorkOrderDetail({ task, equipment, allTasks, onBack, onUpdateStatus, onSaveNotes, onResolve }) {
  const [notes, setNotes] = useState(task?.notes || "");
  const [fileName, setFileName] = useState("");
  const [confirmResolve, setConfirmResolve] = useState(false);
  const [checklistState, setChecklistState] = useState({});

  /* Service / maintenance history for this equipment */
  const eqHistory = allTasks
    .filter((t) => t.equipmentId === task.equipmentId && t.id !== task.id)
    .sort((a, b) => (b.dueDate || "").localeCompare(a.dueDate || ""));

  if (!task) return null;

  const isOpen = task.status !== "COMPLETED" && task.status !== "CANCELLED";

  /* Maintenance checklist */
  const checklist = getChecklist(task.issueType);

  const toggleCheck = (idx) =>
    setChecklistState((s) => ({ ...s, [idx]: !s[idx] }));

  const doneCount = checklist.filter((_, i) => checklistState[i]).length;

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Work Orders
      </button>

      <div className="space-y-5">
        {/* Main card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-7">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{task.id}</p>
              <h1 className="text-xl font-extrabold text-slate-900 mt-1">
                {equipment?.name || `Equipment #${task.equipmentId}`}
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                {task.issueType} · Reported by {task.reportedBy}
              </p>
            </div>
            <div className="flex gap-2">
              <StatusBadge status={task.priority} />
              <StatusBadge status={task.status} />
            </div>
          </div>

          {/* Equipment info */}
          {equipment && (
            <div className="grid sm:grid-cols-3 gap-3 mb-5">
              <InfoBox label="Location" value={equipment.location} />
              <InfoBox label="Category" value={equipment.category} />
              <InfoBox label="Calibration" value={equipment.calibrationStatus} />
            </div>
          )}

          {/* Problem description */}
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 mb-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Problem Description</p>
            <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
          </div>

          {/* Due date */}
          {task.dueDate && (
            <div className={`flex items-center gap-2 rounded-lg px-3 py-2 mb-5 text-xs font-semibold w-fit ${
              new Date(task.dueDate) < new Date() && task.status !== "COMPLETED"
                ? "border border-red-200 bg-red-50 text-red-700"
                : "border border-slate-100 bg-slate-50 text-slate-600"
            }`}>
              <Clock size={12} />
              Due: {formatDate(task.dueDate)}
              {new Date(task.dueDate) < new Date() && task.status !== "COMPLETED" && (
                <span className="ml-1 font-bold">— OVERDUE</span>
              )}
            </div>
          )}

          {/* Maintenance checklist */}
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 mb-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Maintenance Checklist
              </p>
              <span className="text-xs font-semibold text-slate-500">
                {doneCount}/{checklist.length} done
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-slate-200 mb-3 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${(doneCount / checklist.length) * 100}%` }}
              />
            </div>
            <div className="space-y-2">
              {checklist.map((item, i) => (
                <button
                  key={i}
                  onClick={() => isOpen && toggleCheck(i)}
                  disabled={!isOpen}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors ${
                    checklistState[i]
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-white border border-slate-100 hover:bg-slate-50"
                  } ${!isOpen ? "cursor-not-allowed" : "cursor-pointer"}`}
                >
                  {checklistState[i]
                    ? <CheckSquare size={14} className="text-emerald-500 shrink-0" />
                    : <Square size={14} className="text-slate-400 shrink-0" />
                  }
                  <span className={`text-xs ${checklistState[i] ? "line-through text-emerald-600" : "text-slate-700"}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>
            {!isOpen && (
              <p className="text-[10px] text-slate-400 mt-2 italic">Task is closed — checklist is read-only.</p>
            )}
          </div>

          {/* Service log / notes */}
          <div className="space-y-4">
            <Field label="Service Log / Repair Notes">
              <textarea
                value={notes}
                onChange={(e) => {
                  setNotes(e.target.value);
                  onSaveNotes(e.target.value);
                }}
                disabled={!isOpen}
                rows={5}
                placeholder="Log diagnostic findings, actions taken, parts used, repair steps completed…"
                className={`${inputClass()} ${!isOpen ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
              />
            </Field>
            {isOpen && (
              <p className="text-[10px] text-amber-600 -mt-2">
                ⚠ Notes are saved to local state only (demo mode). Backend does not provide a note-save endpoint for technicians.
              </p>
            )}

            {isOpen && (
              <Field label="Attach Diagnostic Photo / Document">
                <label className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors py-5 flex flex-col items-center justify-center gap-1.5 text-slate-500 cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
                  />
                  <Camera size={18} className="text-blue-500" />
                  <span className="text-xs font-medium">{fileName || "Upload photo or document"}</span>
                  <span className="text-[10px] text-slate-400">PNG, JPG, PDF up to 10MB</span>
                </label>
              </Field>
            )}
          </div>

          {/* Status update and resolve — demo only, no real API */}
          {isOpen && (
            <div className="mt-5 border-t border-slate-100 pt-5">
              <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3.5 py-2.5 mb-4">
                <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  <span className="font-semibold">Backend note:</span> Status updates and
                  resolution require backend endpoints not yet available for the technician role.
                  These actions update local demo state only.
                  The real resolve API (<code className="font-mono text-[10px]">POST /api/issue-reports/{"{id}"}/resolve</code>)
                  is available to Lab Managers.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Update Status">
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateStatus(e.target.value)}
                    className={inputClass()}
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
                  </select>
                </Field>

                <div className="flex flex-col justify-end">
                  {!confirmResolve ? (
                    <button
                      onClick={() => setConfirmResolve(true)}
                      className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={16} /> Mark Resolved
                    </button>
                  ) : (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 space-y-2">
                      <p className="text-xs text-emerald-800 font-semibold">Confirm resolve?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => onResolve(notes)}
                          className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmResolve(false)}
                          className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold py-2 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Equipment maintenance history */}
        {eqHistory.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-slate-400" />
              Equipment Service History
              <span className="text-xs font-normal text-slate-400">({eqHistory.length} record{eqHistory.length !== 1 ? "s" : ""})</span>
            </h2>
            <div className="divide-y divide-slate-100">
              {eqHistory.map((h) => (
                <div key={h.id} className="py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">
                        {h.id} — {h.issueType}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Reported by {h.reportedBy}
                        {h.dueDate ? ` · Due ${formatDate(h.dueDate)}` : ""}
                      </p>
                      {h.description && (
                        <p className="text-xs text-slate-600 mt-1 line-clamp-2">{h.description}</p>
                      )}
                      {h.notes && (
                        <div className="mt-2 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-600">
                          <span className="font-semibold text-slate-500">Service notes:</span> {h.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <StatusBadge status={h.priority} />
                      <StatusBadge status={h.status} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoBox({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-slate-700 font-semibold">{value || "—"}</p>
    </div>
  );
}
