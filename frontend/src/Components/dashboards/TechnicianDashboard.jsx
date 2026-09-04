import { useMemo, useState } from "react";
import {
  LayoutDashboard, Wrench, Thermometer, Bell, UserRound, ClipboardList,
  Camera, Upload, ChevronRight, CircleCheckBig, AlertTriangle, Package,
  Search, Clock, ArrowLeft, Info, ShieldCheck,
} from "lucide-react";
import {
  Modal, Field, inputClass, StatusBadge, StatCard, DashboardShell, ViewHeader, EmptyState,
} from "../shared/ui.jsx";
import {
  DEMO_EQUIPMENT, DEMO_MAINTENANCE_REQUESTS, DEMO_CALIBRATIONS, DEMO_NOTIFICATIONS,
  formatDate,
} from "../../data/mockData.js";
import TechnicianWorkOrderView from "../maintenance/TechnicianWorkOrderView.jsx";
import NotificationCenter from "../notifications/NotificationCenter.jsx";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Assigned Tasks", icon: ClipboardList },
  { id: "workorders", label: "Work Orders", icon: Package },
  { id: "maintenance", label: "Equipment Maintenance", icon: Wrench },
  { id: "calibration", label: "Calibration Logs", icon: Thermometer },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile", icon: UserRound },
];

const TECH_ID = "T-1"; // current signed-in technician for this demo session

export default function TechnicianDashboard({ user, onLogout, toast }) {
  const [view, setView] = useState("home");
  const [equipment, setEquipment] = useState(DEMO_EQUIPMENT);
  const [tasks, setTasks] = useState(DEMO_MAINTENANCE_REQUESTS);
  const [calibrations, setCalibrations] = useState(DEMO_CALIBRATIONS);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS.technician);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [calModalFor, setCalModalFor] = useState(null);

  const myTasks = useMemo(() => tasks.filter((t) => t.assignedTechnicianId === TECH_ID), [tasks]);
  const equipmentById = useMemo(() => Object.fromEntries(equipment.map((e) => [e.id, e])), [equipment]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const updateTask = (id, patch) => setTasks((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));

  const markResolved = (id, finalNotes) => {
    const task = tasks.find((t) => t.id === id);
    updateTask(id, { status: "COMPLETED", notes: finalNotes ?? task.notes });
    setEquipment((list) => list.map((e) => (e.id === task.equipmentId ? { ...e, status: "AVAILABLE" } : e)));
    toast(`${id} marked resolved — equipment set back to Available. Lab Manager & affected users notified.`, "success");
    setSelectedTaskId(null);
  };

  const saveCalibration = (equipmentId, { certificateNumber, nextDue, performedBy, notes }) => {
    setCalibrations((list) => {
      const exists = list.find((c) => c.equipmentId === equipmentId);
      const today = new Date().toISOString().slice(0, 10);
      const patch = { certificateNumber, nextDue, lastCalibration: today, compliance: "Up to date", performedBy, notes };
      if (exists) {
        return list.map((c) => (c.equipmentId === equipmentId ? { ...c, ...patch } : c));
      }
      return [...list, { equipmentId, ...patch }];
    });
    setEquipment((list) => list.map((e) => (e.id === equipmentId ? { ...e, calibrationStatus: "Up to date", nextCalibration: nextDue } : e)));
    toast("Calibration record saved (local session only — no backend write endpoint).", "success");
    setCalModalFor(null);
  };

  const markNotifRead = (id) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeView={view}
      setActiveView={(v) => { setSelectedTaskId(null); setView(v); }}
      onLogout={onLogout}
      roleLabel="Lab Technician"
      roleTag="Signed in as"
      userName={user.name}
      notifCount={unreadCount}
    >
      {view === "home" && (
        <HomeView
          myTasks={myTasks}
          equipment={equipment}
          notifications={notifications}
          onOpenTasks={() => setView("tasks")}
          onOpenCalibration={() => setView("calibration")}
        />
      )}

      {view === "tasks" && (
        selectedTaskId ? (
          <TaskDetails
            task={tasks.find((t) => t.id === selectedTaskId)}
            equipment={equipmentById[tasks.find((t) => t.id === selectedTaskId)?.equipmentId]}
            onBack={() => setSelectedTaskId(null)}
            onUpdateStatus={(status) => updateTask(selectedTaskId, { status })}
            onSaveNotes={(notes) => updateTask(selectedTaskId, { notes })}
            onMarkResolved={(notes) => markResolved(selectedTaskId, notes)}
          />
        ) : (
          <TasksView tasks={myTasks} equipmentById={equipmentById} onOpen={setSelectedTaskId} />
        )
      )}

      {view === "workorders" && (
        <TechnicianWorkOrderView
          tasks={tasks}
          equipment={equipment}
          onUpdateTask={updateTask}
          onResolveTask={markResolved}
          toast={toast}
        />
      )}

      {view === "maintenance" && <EquipmentMaintenanceView equipment={equipment} tasks={tasks} />}

      {view === "calibration" && (
        <CalibrationView equipment={equipment} calibrations={calibrations} onOpen={(id) => setCalModalFor(id)} />
      )}

      {view === "notifications" && (
        <NotificationCenter
          role="technician"
          user={user}
          notifications={notifications}
          setNotifications={setNotifications}
          onNavigate={(targetView) => { setSelectedTaskId(null); setView(targetView); }}
          toast={toast}
        />
      )}

      {view === "profile" && <ProfileView user={user} tasks={myTasks} toast={toast} />}

      {calModalFor && (
        <CalibrationModal
          equipment={equipmentById[calModalFor]}
          existing={calibrations.find((c) => c.equipmentId === calModalFor)}
          onClose={() => setCalModalFor(null)}
          onSave={(payload) => saveCalibration(calModalFor, payload)}
        />
      )}
    </DashboardShell>
  );
}

/* ================================================================== */
/*  2.1  Dashboard Home                                                 */
/* ================================================================== */
function HomeView({ myTasks, equipment, notifications, onOpenTasks, onOpenCalibration }) {
  const open = myTasks.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS" || t.status === "WAITING_FOR_PARTS").length;
  const pendingCal = equipment.filter((e) => e.calibrationStatus !== "Up to date").length;
  const underRepair = equipment.filter((e) => e.status === "UNDER_MAINTENANCE").length;
  const assigned = myTasks.length;

  return (
    <div>
      <ViewHeader title="Technician Dashboard" subtitle="Your assigned work orders and calibration workload at a glance." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ClipboardList} label="Open Maintenance Tasks" value={open} tone="text-amber-600" bg="bg-amber-50" onClick={onOpenTasks} />
        <StatCard icon={Thermometer} label="Pending Calibrations" value={pendingCal} tone="text-purple-600" bg="bg-purple-50" onClick={onOpenCalibration} />
        <StatCard icon={Wrench} label="Equipment Under Repair" value={underRepair} tone="text-orange-600" bg="bg-orange-50" />
        <StatCard icon={CircleCheckBig} label="Assigned Equipment" value={assigned} tone="text-blue-600" bg="bg-blue-50" onClick={onOpenTasks} />
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">My Open Tasks</h2>
            <button onClick={onOpenTasks} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {myTasks.filter((t) => t.status !== "COMPLETED").length === 0 ? (
            <EmptyState icon={ClipboardList} title="No open tasks — nice and clear!" />
          ) : (
            <div className="divide-y divide-slate-100">
              {myTasks.filter((t) => t.status !== "COMPLETED").slice(0, 5).map((t) => (
                <div key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{t.id} — {t.issueType}</p>
                    <p className="text-xs text-slate-500">Due {formatDate(t.dueDate)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-base font-bold text-slate-900 mb-4">Notifications</h2>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className={`rounded-lg border p-3 text-xs ${n.read ? "border-slate-100 bg-slate-50" : "border-blue-100 bg-blue-50"}`}>
                <p className="font-semibold text-slate-800">{n.title}</p>
                <p className="text-slate-500 mt-0.5">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  2.2  Assigned Tasks (Work Orders)                                   */
/* ================================================================== */
function TasksView({ tasks, equipmentById, onOpen }) {
  return (
    <div>
      <ViewHeader title="Assigned Tasks" subtitle="Work orders assigned to you by the Lab Manager." />
      {tasks.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tasks assigned yet" />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Request ID</th>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                <th className="text-left font-semibold px-5 py-3">Issue</th>
                <th className="text-left font-semibold px-5 py-3">Priority</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-left font-semibold px-5 py-3">Due</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id} onClick={() => onOpen(t.id)} className="cursor-pointer hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-blue-600">{t.id}</td>
                  <td className="px-5 py-3.5 text-slate-700">{equipmentById[t.equipmentId]?.name}</td>
                  <td className="px-5 py-3.5 text-slate-600 max-w-[220px] truncate">{t.issueType}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.priority} /></td>
                  <td className="px-5 py-3.5"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(t.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function TaskDetails({ task, equipment, onBack, onUpdateStatus, onSaveNotes, onMarkResolved }) {
  const [notes, setNotes] = useState(task?.notes || "");
  const [fileName, setFileName] = useState("");

  if (!task) return null;

  return (
    <div>
      <button onClick={onBack} className="mb-5 text-sm font-semibold text-slate-500 hover:text-blue-600">← Back to Assigned Tasks</button>
      <div className="rounded-2xl border border-slate-200 bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{task.id}</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{equipment?.name}</h1>
            <p className="text-sm text-slate-500">{task.issueType} · Reported by {task.reportedBy}</p>
          </div>
          <div className="flex gap-2">
            <StatusBadge status={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Problem Description</p>
          <p className="mt-1.5 text-sm text-slate-700">{task.description}</p>
        </div>

        <div className="mt-5">
          <Field label="Repair Notes">
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); onSaveNotes(e.target.value); }}
              rows={4}
              placeholder="Log diagnostic findings, parts used, and repair steps…"
              className={inputClass()}
            />
          </Field>
        </div>

        <div className="mt-4">
          <Field label="Diagnostic Photo">
            <label className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors py-5 flex flex-col items-center justify-center gap-1 text-slate-500 cursor-pointer">
              <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
              <Camera size={18} className="text-blue-600" />
              <span className="text-xs">{fileName || "Upload a diagnostic photo"}</span>
            </label>
          </Field>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 gap-4 items-end">
          <Field label="Status">
            <select value={task.status} onChange={(e) => onUpdateStatus(e.target.value)} className={inputClass()}>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_PARTS">Waiting for Parts</option>
            </select>
          </Field>
          <button
            onClick={() => onMarkResolved(notes)}
            className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2"
          >
            <CircleCheckBig size={16} /> Mark Resolved
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Equipment Maintenance (status overview, read view for technicians)  */
/* ================================================================== */
function EquipmentMaintenanceView({ equipment, tasks }) {
  return (
    <div>
      <ViewHeader title="Equipment Maintenance" subtitle="Live maintenance status across all department equipment." />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {equipment.map((e) => {
          const openTask = tasks.find((t) => t.equipmentId === e.id && t.status !== "COMPLETED");
          return (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start justify-between">
                <span className="text-2xl">{e.image}</span>
                <StatusBadge status={e.status} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{e.name}</h3>
              <p className="text-xs text-slate-500">{e.location}</p>
              {openTask ? (
                <div className="mt-3 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 flex items-center gap-2">
                  <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                  <p className="text-[11px] text-amber-700 font-semibold">{openTask.id} — {openTask.status.replace(/_/g, " ")}</p>
                </div>
              ) : (
                <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2 flex items-center gap-2">
                  <CircleCheckBig size={13} className="text-emerald-500 shrink-0" />
                  <p className="text-[11px] text-emerald-700 font-semibold">No open issues</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Calibration helpers                                                */
/* ================================================================== */
function calDaysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(dateStr); due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

function CalDaysChip({ days }) {
  if (days === null) return <span className="text-xs text-slate-400">No date</span>;
  if (days < 0)
    return <span className="text-xs font-bold text-red-600">{Math.abs(days)}d overdue</span>;
  if (days === 0)
    return <span className="text-xs font-bold text-red-500">Due today</span>;
  if (days <= 30)
    return <span className="text-xs font-bold text-amber-600">Due in {days}d</span>;
  return <span className="text-xs text-emerald-600">Due in {days}d</span>;
}

const CAL_TECH_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "Overdue", label: "Overdue" },
  { id: "Due soon", label: "Due Soon" },
  { id: "Up to date", label: "Up to Date" },
  { id: "No record", label: "No Record" },
];

/* ================================================================== */
/*  2.3  Calibration Logs                                               */
/* ================================================================== */
function CalibrationView({ equipment, calibrations, onOpen }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const byId = Object.fromEntries(calibrations.map((c) => [c.equipmentId, c]));
  const getCompliance = (e) => byId[e.id]?.compliance || "No record";

  const counts = {
    overdue: equipment.filter((e) => getCompliance(e) === "Overdue").length,
    dueSoon: equipment.filter((e) => getCompliance(e) === "Due soon").length,
    noRecord: equipment.filter((e) => !byId[e.id]).length,
  };

  const filtered = equipment.filter((e) => {
    const compliance = getCompliance(e);
    if (filter !== "ALL" && compliance !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (e.name || "").toLowerCase().includes(q) ||
        (e.category || "").toLowerCase().includes(q) ||
        (e.location || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedEquip = equipment.find((e) => e.id === selectedId);
  const selectedCal = byId[selectedId];

  if (selectedId && selectedEquip) {
    return (
      <CalibrationDetailPanel
        equipment={selectedEquip}
        calibration={selectedCal}
        onBack={() => setSelectedId(null)}
        onUpdate={() => onOpen(selectedId)}
      />
    );
  }

  return (
    <div>
      <ViewHeader
        title="Calibration Logs"
        subtitle="Track calibration records, compliance status, and upcoming due dates across all equipment."
      />

      {/* Demo data notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 mb-5">
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Local session data.</span> The backend has no{" "}
          <code className="font-mono text-[10px]">GET /api/calibrations</code> or{" "}
          <code className="font-mono text-[10px]">POST /api/calibrations</code> endpoint.
          Records shown are from demo data and updates are local-only — not persisted to the database.
        </p>
      </div>

      {/* Alert banners */}
      {counts.overdue > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {counts.overdue} equipment item{counts.overdue !== 1 ? "s are" : " is"} overdue for calibration.
          </p>
          <button
            onClick={() => setFilter("Overdue")}
            className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 shrink-0"
          >
            View →
          </button>
        </div>
      )}
      {counts.dueSoon > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 mb-4">
          <Clock size={15} className="text-amber-500 shrink-0" />
          <p className="text-sm font-semibold text-amber-700">
            {counts.dueSoon} equipment item{counts.dueSoon !== 1 ? "s are" : " is"} due for calibration soon.
          </p>
          <button
            onClick={() => setFilter("Due soon")}
            className="ml-auto text-xs font-semibold text-amber-600 hover:text-amber-700 shrink-0"
          >
            View →
          </button>
        </div>
      )}

      {/* Filter + search toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment…"
            className="rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-wrap">
          {CAL_TECH_FILTERS.map((f) => (
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
        <span className="ml-auto text-xs text-slate-400">{filtered.length} item{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Thermometer}
          title="No calibration records found"
          subtitle="Try adjusting the filter or clearing the search."
        />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                <th className="text-left font-semibold px-5 py-3">Certificate #</th>
                <th className="text-left font-semibold px-5 py-3">Last Calibration</th>
                <th className="text-left font-semibold px-5 py-3">Next Due</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
                <th className="text-left font-semibold px-5 py-3">Days</th>
                <th className="text-right font-semibold px-5 py-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((e) => {
                const c = byId[e.id];
                const compliance = c?.compliance || "No record";
                const days = calDaysUntil(c?.nextDue);
                const isOverdue = compliance === "Overdue";
                const isDueSoon = compliance === "Due soon";
                const rowBg = isOverdue ? "bg-red-50/40" : isDueSoon ? "bg-amber-50/30" : "";
                return (
                  <tr
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`cursor-pointer hover:bg-slate-50 transition-colors ${rowBg}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800">{e.name}</p>
                      <p className="text-[11px] text-slate-400">{e.category} · {e.location}</p>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs font-mono">
                      {c?.certificateNumber || "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {c ? formatDate(c.lastCalibration) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 text-xs">
                      {c ? formatDate(c.nextDue) : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={compliance} />
                    </td>
                    <td className="px-5 py-3.5">
                      <CalDaysChip days={days} />
                    </td>
                    <td
                      className="px-5 py-3.5 text-right"
                      onClick={(ev) => { ev.stopPropagation(); onOpen(e.id); }}
                    >
                      <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto">
                        <Upload size={12} /> Update
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ── Calibration Detail Panel ── */
function CalibrationDetailPanel({ equipment, calibration, onBack, onUpdate }) {
  const days = calDaysUntil(calibration?.nextDue);
  const isOverdue = calibration?.compliance === "Overdue";
  const isDueSoon = calibration?.compliance === "Due soon";

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Calibration Logs
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{equipment.id}</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{equipment.name}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{equipment.category} · {equipment.location}</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <StatusBadge status={equipment.status} />
            <StatusBadge status={calibration?.compliance || "No record"} />
          </div>
        </div>

        {/* Urgency alerts */}
        {isOverdue && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Calibration Overdue</p>
              <p className="text-xs text-red-600 mt-0.5">
                Was due {formatDate(calibration?.nextDue)} —{" "}
                {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} ago. Schedule calibration immediately.
              </p>
            </div>
          </div>
        )}
        {isDueSoon && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700">Calibration Due Soon</p>
              <p className="text-xs text-amber-600 mt-0.5">
                Due {formatDate(calibration?.nextDue)} — {days} day{days !== 1 ? "s" : ""} remaining.
              </p>
            </div>
          </div>
        )}

        {/* Calibration record */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Calibration Record (Demo)</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <CalInfoBox label="Compliance" value={calibration?.compliance || "No record"} isStatus />
            <CalInfoBox label="Certificate #" value={calibration?.certificateNumber || "—"} mono />
            <CalInfoBox label="Last Calibration" value={calibration ? formatDate(calibration.lastCalibration) : "—"} />
            <CalInfoBox label="Next Due Date" value={calibration ? formatDate(calibration.nextDue) : "—"} />
            <CalInfoBox
              label="Days Remaining"
              value={
                days === null
                  ? "No date recorded"
                  : days < 0
                  ? `${Math.abs(days)} days overdue`
                  : days === 0
                  ? "Due today"
                  : `${days} days remaining`
              }
            />
            {calibration?.performedBy && (
              <CalInfoBox label="Performed By" value={calibration.performedBy} />
            )}
          </div>
          {calibration?.notes && (
            <div className="mt-4 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Calibration Notes</p>
              <p className="text-sm text-slate-700">{calibration.notes}</p>
            </div>
          )}
        </div>

        {/* Certification section */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-2">
            <ShieldCheck size={12} className="text-blue-500" /> Certification Details
          </p>
          {calibration?.certificateNumber ? (
            <div className="grid sm:grid-cols-2 gap-4">
              <CalInfoBox label="Certificate Number" value={calibration.certificateNumber} mono />
              <CalInfoBox label="Calibration Date" value={formatDate(calibration.lastCalibration)} />
              <div className="sm:col-span-2 rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5">
                  Local Session Only
                </p>
                <p className="text-xs text-amber-700">
                  Certificate PDF uploads and record changes are stored in local session state only.
                  The backend has no{" "}
                  <code className="font-mono text-[10px]">POST /api/calibrations</code> endpoint —
                  data will not persist across page refreshes.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-center">
              <ShieldCheck size={20} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-500">No certificate on record</p>
              <p className="text-xs text-slate-400 mt-0.5">Use the Update Record button to add a certificate.</p>
            </div>
          )}
        </div>

        {/* Equipment info */}
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Equipment Info</p>
          <div className="grid sm:grid-cols-2 gap-4">
            {equipment.specs && <CalInfoBox label="Specifications" value={equipment.specs} />}
            {equipment.department && <CalInfoBox label="Department" value={equipment.department} />}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-slate-100 pt-5 flex flex-wrap items-center gap-3">
          <button
            onClick={onUpdate}
            className="flex items-center gap-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            <Upload size={15} /> Update Calibration Record
          </button>
          <span className="text-xs text-amber-600 flex items-center gap-1">
            <Info size={11} /> Local session only — no backend write API.
          </span>
        </div>
      </div>
    </div>
  );
}

function CalInfoBox({ label, value, isStatus = false, mono = false }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
      {isStatus
        ? <StatusBadge status={value} />
        : <p className={`text-sm text-slate-700 font-semibold ${mono ? "font-mono" : ""}`}>{value || "—"}</p>
      }
    </div>
  );
}

/* ── Enhanced CalibrationModal ── */
function CalibrationModal({ equipment, existing, onClose, onSave }) {
  const [certificateNumber, setCertificateNumber] = useState(existing?.certificateNumber || "");
  const [nextDue, setNextDue] = useState(existing?.nextDue || "");
  const [performedBy, setPerformedBy] = useState(existing?.performedBy || "");
  const [notes, setNotes] = useState(existing?.notes || "");
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState({});

  const submit = () => {
    const e = {};
    if (!certificateNumber.trim()) e.certificateNumber = "Certificate number is required.";
    if (!nextDue) e.nextDue = "Next calibration due date is required.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ certificateNumber, nextDue, performedBy, notes });
  };

  return (
    <Modal title="Update Calibration Record" subtitle={equipment?.name} onClose={onClose}>
      <div className="space-y-4">
        {/* Local-only disclaimer */}
        <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
          <Info size={13} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            <span className="font-semibold">Local session only.</span> No backend write endpoint
            exists (<code className="font-mono text-[10px]">POST /api/calibrations</code> is not implemented).
            This record updates the current session state only and will not be saved to the database.
          </p>
        </div>

        <Field label="Calibration Certificate (PDF)">
          <label className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors py-5 flex flex-col items-center justify-center gap-1 text-slate-500 cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={(e) => setFileName(e.target.files?.[0]?.name || "")}
            />
            <Upload size={18} className="text-blue-600" />
            <span className="text-xs">{fileName || "Upload calibration certificate (PDF)"}</span>
          </label>
        </Field>

        <Field label="Certificate Number" required error={errors.certificateNumber}>
          <input
            value={certificateNumber}
            onChange={(e) => setCertificateNumber(e.target.value)}
            placeholder="CAL-2026-0123"
            className={inputClass(errors.certificateNumber)}
          />
        </Field>

        <Field label="Next Calibration Due Date" required error={errors.nextDue}>
          <input
            type="date"
            value={nextDue}
            onChange={(e) => setNextDue(e.target.value)}
            className={inputClass(errors.nextDue)}
          />
        </Field>

        <Field label="Performed By">
          <input
            value={performedBy}
            onChange={(e) => setPerformedBy(e.target.value)}
            placeholder="Technician name or calibration lab"
            className={inputClass()}
          />
        </Field>

        <Field label="Calibration Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Calibration procedure notes, pass/fail criteria, instrument references…"
            className={`${inputClass()} resize-none`}
          />
        </Field>

        <button
          onClick={submit}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Save Calibration Record
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  Notifications                                                       */
/* ================================================================== */
function NotificationsView({ notifications, onRead }) {
  return (
    <div>
      <ViewHeader title="Notifications" subtitle="Task assignments, parts updates, and resolution confirmations." />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => onRead(n.id)}
              className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${n.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/60"}`}
            >
              <span className={`mt-0.5 flex h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-blue-500"}`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">{n.type} · {n.time}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Profile                                                              */
/* ================================================================== */
function ProfileView({ user, tasks, toast }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });

  const resolved = tasks.filter((t) => t.status === "COMPLETED").length;

  return (
    <div>
      <ViewHeader title="Profile" subtitle="Manage your technician account details." />
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
              {user.firstName[0]}{user.lastName?.[0] || ""}
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input disabled={!editing} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} />
            </Field>
            <Field label="Last Name">
              <input disabled={!editing} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} />
            </Field>
            <Field label="Email"><input disabled value={user.email} className={`${inputClass()} bg-slate-50 text-slate-500`} /></Field>
            <Field label="Phone">
              <input disabled={!editing} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} />
            </Field>
            <Field label="Department"><input disabled value={user.department} className={`${inputClass()} bg-slate-50 text-slate-500`} /></Field>
          </div>
          <div className="mt-6 flex gap-3">
            {editing ? (
              <>
                <button onClick={() => { setEditing(false); toast("Profile updated.", "success"); }} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">Save Changes</button>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors">Cancel</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">Edit Profile</button>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Work Summary</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
              <span className="text-xs font-semibold text-slate-500">Assigned Tasks</span>
              <span className="text-sm font-extrabold text-blue-600">{tasks.length}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
              <span className="text-xs font-semibold text-slate-500">Resolved</span>
              <span className="text-sm font-extrabold text-emerald-600">{resolved}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
