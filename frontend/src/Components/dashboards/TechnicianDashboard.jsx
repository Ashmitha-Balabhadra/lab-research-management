import { useMemo, useState } from "react";
import {
  LayoutDashboard, Wrench, Thermometer, Bell, UserRound, ClipboardList,
  Camera, Upload, ChevronRight, CircleCheckBig, AlertTriangle,
} from "lucide-react";
import {
  Modal, Field, inputClass, StatusBadge, StatCard, DashboardShell, ViewHeader, EmptyState,
} from "../shared/ui.jsx";
import {
  DEMO_EQUIPMENT, DEMO_MAINTENANCE_REQUESTS, DEMO_CALIBRATIONS, DEMO_NOTIFICATIONS,
  formatDate,
} from "../../data/mockData.js";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "tasks", label: "Assigned Tasks", icon: ClipboardList },
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

  const saveCalibration = (equipmentId, { certificateNumber, nextDue }) => {
    setCalibrations((list) => {
      const exists = list.find((c) => c.equipmentId === equipmentId);
      const today = new Date().toISOString().slice(0, 10);
      if (exists) {
        return list.map((c) => (c.equipmentId === equipmentId ? { ...c, certificateNumber, nextDue, lastCalibration: today, compliance: "Up to date" } : c));
      }
      return [...list, { equipmentId, certificateNumber, nextDue, lastCalibration: today, compliance: "Up to date" }];
    });
    setEquipment((list) => list.map((e) => (e.id === equipmentId ? { ...e, calibrationStatus: "Up to date", nextCalibration: nextDue } : e)));
    toast("Calibration record saved.", "success");
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

      {view === "maintenance" && <EquipmentMaintenanceView equipment={equipment} tasks={tasks} />}

      {view === "calibration" && (
        <CalibrationView equipment={equipment} calibrations={calibrations} onOpen={(id) => setCalModalFor(id)} />
      )}

      {view === "notifications" && <NotificationsView notifications={notifications} onRead={markNotifRead} />}

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
/*  2.3  Calibration Logs                                               */
/* ================================================================== */
function CalibrationView({ equipment, calibrations, onOpen }) {
  const byId = Object.fromEntries(calibrations.map((c) => [c.equipmentId, c]));
  return (
    <div>
      <ViewHeader title="Calibration Logs" subtitle="Track calibration due dates and compliance across equipment." />
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-5 py-3">Equipment</th>
              <th className="text-left font-semibold px-5 py-3">Certificate #</th>
              <th className="text-left font-semibold px-5 py-3">Last Calibration</th>
              <th className="text-left font-semibold px-5 py-3">Next Due</th>
              <th className="text-left font-semibold px-5 py-3">Compliance</th>
              <th className="text-right font-semibold px-5 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipment.map((e) => {
              const c = byId[e.id];
              const status = c?.compliance === "Overdue" ? "OUT_OF_SERVICE" : c?.compliance === "Due soon" ? "BOOKED" : "AVAILABLE";
              return (
                <tr key={e.id}>
                  <td className="px-5 py-3.5 font-semibold text-slate-800">{e.name}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c?.certificateNumber || "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c ? formatDate(c.lastCalibration) : "—"}</td>
                  <td className="px-5 py-3.5 text-slate-600">{c ? formatDate(c.nextDue) : "—"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                      status === "OUT_OF_SERVICE" ? "bg-red-50 text-red-600 border-red-200" :
                      status === "BOOKED" ? "bg-amber-50 text-amber-600 border-amber-200" :
                      "bg-emerald-50 text-emerald-600 border-emerald-200"
                    }`}>
                      {c?.compliance || "No record"}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <button onClick={() => onOpen(e.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto">
                      <Upload size={12} /> Update
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CalibrationModal({ equipment, existing, onClose, onSave }) {
  const [certificateNumber, setCertificateNumber] = useState(existing?.certificateNumber || "");
  const [nextDue, setNextDue] = useState(existing?.nextDue || "");
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState({});

  const submit = () => {
    const e = {};
    if (!certificateNumber.trim()) e.certificateNumber = "Certificate number is required.";
    if (!nextDue) e.nextDue = "Next calibration due date is required.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSave({ certificateNumber, nextDue });
  };

  return (
    <Modal title="Update Calibration Record" subtitle={equipment.name} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Calibration Certificate">
          <label className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors py-5 flex flex-col items-center justify-center gap-1 text-slate-500 cursor-pointer">
            <input type="file" accept=".pdf" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
            <Upload size={18} className="text-blue-600" />
            <span className="text-xs">{fileName || "Upload calibration certificate (PDF)"}</span>
          </label>
        </Field>
        <Field label="Certificate Number" required error={errors.certificateNumber}>
          <input value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} placeholder="CAL-2026-0123" className={inputClass(errors.certificateNumber)} />
        </Field>
        <Field label="Next Calibration Due Date" required error={errors.nextDue}>
          <input type="date" value={nextDue} onChange={(e) => setNextDue(e.target.value)} className={inputClass(errors.nextDue)} />
        </Field>
        <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
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
