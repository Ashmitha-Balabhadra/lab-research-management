import { useMemo, useState } from "react";
import {
  Search, UserPlus, MoreVertical, ArrowLeft, Building2, Users as UsersIcon,
  ShieldCheck, UserCog, Wrench, ChevronRight,
} from "lucide-react";
import { Modal, Field, inputClass, EmptyState } from "../shared/ui.jsx";

/* ================================================================== *
 *  User Management (Institution Admin)                                *
 *                                                                      *
 *  Two views, as recommended:                                         *
 *   - All Users:    search, filter, deactivate, remove — everyone     *
 *                    at a glance.                                     *
 *   - Departments:  one card per department; drill into a department  *
 *                    to see/manage its single Department Head, single *
 *                    Lab Manager, and its Lab Technicians. This is     *
 *                    where the 1-Head / 1-Manager rule is enforced —   *
 *                    role changes go through "Change Role", never a   *
 *                    raw dropdown in the table, so an admin can't      *
 *                    accidentally create a second Department Head.    *
 * ================================================================== */

const ROLE_OPTIONS = ["DEPARTMENT_HEAD", "LAB_MANAGER", "TECHNICIAN"];
const ROLE_LABEL = { DEPARTMENT_HEAD: "Department Head", LAB_MANAGER: "Lab Manager", TECHNICIAN: "Lab Technician" };
const ROLE_STYLE = {
  DEPARTMENT_HEAD: "bg-purple-50 text-purple-600 border-purple-200",
  LAB_MANAGER: "bg-blue-50 text-blue-600 border-blue-200",
  TECHNICIAN: "bg-slate-100 text-slate-600 border-slate-200",
};
const STATUS_DOT = { ACTIVE: "bg-emerald-500", INVITED: "bg-blue-500", INACTIVE: "bg-slate-400", REMOVED: "bg-red-500" };
const STATUS_TEXT = { ACTIVE: "text-emerald-600", INVITED: "text-blue-600", INACTIVE: "text-slate-500", REMOVED: "text-red-500" };

const DEPARTMENTS = ["Chemistry", "Biology", "Materials Science", "Mechanical Engineering", "Instrumentation & Maintenance"];

const SEED_USERS = [
  { id: "U-1", name: "Vikram Nair", email: "vikram.nair@sunrise.edu", department: "Chemistry", role: "DEPARTMENT_HEAD", status: "ACTIVE" },
  { id: "U-2", name: "Ananya Rao", email: "ananya.rao@sunrise.edu", department: "Chemistry", role: "LAB_MANAGER", status: "ACTIVE" },
  { id: "U-3", name: "Arjun Mehta", email: "arjun.mehta@sunrise.edu", department: "Chemistry", role: "TECHNICIAN", status: "ACTIVE" },
  { id: "U-4", name: "Sara Iyer", email: "sara.iyer@sunrise.edu", department: "Chemistry", role: "TECHNICIAN", status: "INACTIVE" },
  { id: "U-5", name: "John Mathew", email: "john.mathew@sunrise.edu", department: "Chemistry", role: "TECHNICIAN", status: "ACTIVE" },
  { id: "U-6", name: "Rahul Kumar", email: "rahul.kumar@sunrise.edu", department: "Chemistry", role: "TECHNICIAN", status: "INVITED" },
  { id: "U-7", name: "Meera Pillai", email: "meera.pillai@sunrise.edu", department: "Biology", role: "LAB_MANAGER", status: "ACTIVE" },
  { id: "U-8", name: "Karthik Subramaniam", email: "karthik.s@sunrise.edu", department: "Biology", role: "TECHNICIAN", status: "ACTIVE" },
  { id: "U-9", name: "Divya Menon", email: "divya.menon@sunrise.edu", department: "Biology", role: "TECHNICIAN", status: "ACTIVE" },
  { id: "U-10", name: "Neha Kulkarni", email: "neha.kulkarni@sunrise.edu", department: "Materials Science", role: "DEPARTMENT_HEAD", status: "ACTIVE" },
  { id: "U-11", name: "Farhan Ali", email: "farhan.ali@sunrise.edu", department: "Materials Science", role: "LAB_MANAGER", status: "ACTIVE" },
  { id: "U-12", name: "Sanjay Gupta", email: "sanjay.gupta@sunrise.edu", department: "Materials Science", role: "TECHNICIAN", status: "ACTIVE" },
  { id: "U-13", name: "Rahul Deshmukh", email: "rahul.deshmukh@sunrise.edu", department: "Instrumentation & Maintenance", role: "TECHNICIAN", status: "ACTIVE" },
];

const PAGE_SIZE = 8;

function initials(name) {
  const parts = name.trim().split(" ");
  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
}

/* Enforce the "one active/invited Department Head, one active/invited Lab Manager per department" rule. */
function findRoleConflict(users, department, role, excludeUserId) {
  if (role !== "DEPARTMENT_HEAD" && role !== "LAB_MANAGER") return null;
  return users.find(
    (u) => u.id !== excludeUserId && u.department === department && u.role === role && (u.status === "ACTIVE" || u.status === "INVITED")
  ) || null;
}

export default function UserManagementView({ toast }) {
  const [tab, setTab] = useState("all"); // "all" | "departments"
  const [users, setUsers] = useState(SEED_USERS);
  const [selectedDept, setSelectedDept] = useState(null);

  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const [inviteTarget, setInviteTarget] = useState(null); // { department, role } | null
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [detailModal, setDetailModal] = useState(null); // { user, mode: "view" | "edit" }
  const [openMenuId, setOpenMenuId] = useState(null);

  const summary = useMemo(() => {
    const live = users.filter((u) => u.status !== "REMOVED");
    return {
      total: live.length,
      heads: live.filter((u) => u.role === "DEPARTMENT_HEAD").length,
      managers: live.filter((u) => u.role === "LAB_MANAGER").length,
      technicians: live.filter((u) => u.role === "TECHNICIAN").length,
    };
  }, [users]);

  const filtered = useMemo(() => {
    return users.filter((u) =>
      u.status !== "REMOVED" &&
      `${u.name} ${u.email}`.toLowerCase().includes(search.toLowerCase()) &&
      (deptFilter === "ALL" || u.department === deptFilter) &&
      (roleFilter === "ALL" || u.role === roleFilter) &&
      (statusFilter === "ALL" || u.status === statusFilter)
    );
  }, [users, search, deptFilter, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const clearFilters = () => { setSearch(""); setDeptFilter("ALL"); setRoleFilter("ALL"); setStatusFilter("ALL"); setPage(1); };

  /* ---- actions ---- */
  const applyInvite = (form) => {
    const conflict = findRoleConflict(users, form.department, form.role, null);
    if (conflict) {
      toast(`${form.department} already has ${conflict.status === "ACTIVE" ? "an active" : "an invited"} ${ROLE_LABEL[form.role]}: ${conflict.name}. Change their role first.`, "error");
      return false;
    }
    const id = `U-${Date.now()}`;
    setUsers((list) => [{ id, name: form.name, email: form.email, department: form.department, role: form.role, status: "INVITED" }, ...list]);
    toast(`Invitation sent to ${form.email}.`, "success");
    setInviteTarget(null);
    return true;
  };
  const applyRoleChange = (userId, newRole) => {
    const user = users.find((u) => u.id === userId);
    const conflict = findRoleConflict(users, user.department, newRole, userId);
    if (conflict) {
      toast(`${user.department} already has ${conflict.status === "ACTIVE" ? "an active" : "an invited"} ${ROLE_LABEL[newRole]}: ${conflict.name}. Reassign or deactivate them first.`, "error");
      return false;
    }
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    toast(`${user.name}'s role changed to ${ROLE_LABEL[newRole]}.`, "success");
    setRoleModalUser(null);
    return true;
  };
  const saveUserEdit = (userId, patch) => {
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, ...patch } : u)));
    toast("User details updated.", "success");
    setDetailModal(null);
  };
  const setStatus = (userId, status, message) => {
    setUsers((list) => list.map((u) => (u.id === userId ? { ...u, status } : u)));
    toast(message, status === "REMOVED" ? "error" : "success");
    setOpenMenuId(null);
  };
  const cancelInvitation = (userId) => {
    const user = users.find((u) => u.id === userId);
    setUsers((list) => list.filter((u) => u.id !== userId));
    toast(`Invitation to ${user?.email} cancelled.`, "info");
    setOpenMenuId(null);
  };
  const resendInvitation = (user) => {
    toast(`Invitation resent to ${user.email}.`, "success");
    setOpenMenuId(null);
  };

  const menuActions = (user) => {
    const view = { label: "View Details", onClick: () => setDetailModal({ user, mode: "view" }) };
    if (user.status === "INVITED") {
      return [
        view,
        { label: "Edit Invitation", onClick: () => setDetailModal({ user, mode: "edit" }) },
        { label: "Resend Invitation", onClick: () => resendInvitation(user) },
        { divider: true },
        { label: "Cancel Invitation", danger: true, onClick: () => cancelInvitation(user.id) },
      ];
    }
    if (user.status === "INACTIVE") {
      return [
        view,
        { label: "Edit User", onClick: () => setDetailModal({ user, mode: "edit" }) },
        { label: "Activate", onClick: () => setStatus(user.id, "ACTIVE", `${user.name} reactivated.`) },
        { divider: true },
        { label: "Remove User", danger: true, onClick: () => setStatus(user.id, "REMOVED", `${user.name} removed from the institution.`) },
      ];
    }
    // ACTIVE
    return [
      view,
      { label: "Edit User", onClick: () => setDetailModal({ user, mode: "edit" }) },
      { label: "Change Role", onClick: () => setRoleModalUser(user) },
      { divider: true },
      { label: "Deactivate", onClick: () => setStatus(user.id, "INACTIVE", `${user.name} deactivated.`) },
      { divider: true },
      { label: "Remove User", danger: true, onClick: () => setStatus(user.id, "REMOVED", `${user.name} removed from the institution.`) },
    ];
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage department heads, lab managers, and lab technicians across your institution.</p>
        </div>
        <button
          onClick={() => setInviteTarget({ department: DEPARTMENTS[0], role: "TECHNICIAN" })}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <UserPlus size={15} /> Invite User
        </button>
      </div>

      {/* ---- Summary ---- */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 my-6">
        <SummaryCard icon={UsersIcon} label="Total Users" value={summary.total} tone="text-slate-700" bg="bg-slate-100" />
        <SummaryCard icon={ShieldCheck} label="Department Heads" value={summary.heads} tone="text-purple-600" bg="bg-purple-50" />
        <SummaryCard icon={UserCog} label="Lab Managers" value={summary.managers} tone="text-blue-600" bg="bg-blue-50" />
        <SummaryCard icon={Wrench} label="Lab Technicians" value={summary.technicians} tone="text-emerald-600" bg="bg-emerald-50" />
      </div>

      {/* ---- Tabs ---- */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit mb-6">
        <button onClick={() => setTab("all")} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>All Users</button>
        <button onClick={() => { setTab("departments"); setSelectedDept(null); }} className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === "departments" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Departments</button>
      </div>

      {tab === "all" ? (
        <>
          {/* ---- Search + filters ---- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
            <div className="relative mb-3">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email…" className={`${inputClass()} pl-9`} />
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <select value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }} className={inputClass()}>
                <option value="ALL">All Departments</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
              <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className={inputClass()}>
                <option value="ALL">All Roles</option>
                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className={inputClass()}>
                <option value="ALL">All Status</option>
                {["ACTIVE", "INVITED", "INACTIVE"].map((s) => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
              </select>
              <button onClick={clearFilters} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold transition-colors">Clear</button>
            </div>
          </div>

          <p className="text-xs text-slate-400 mb-3">Showing {filtered.length} user{filtered.length === 1 ? "" : "s"}</p>

          {filtered.length === 0 ? (
            <EmptyState icon={UsersIcon} title="No users match your filters" />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white overflow-visible">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                  <tr>
                    <th className="text-left font-semibold px-5 py-3 w-[34%]">User</th>
                    <th className="text-left font-semibold px-5 py-3">Department</th>
                    <th className="text-left font-semibold px-5 py-3">Role</th>
                    <th className="text-left font-semibold px-5 py-3">Status</th>
                    <th className="text-right font-semibold px-5 py-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pageRows.map((u) => (
                    <tr key={u.id}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">{initials(u.name)}</span>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 truncate">{u.name}</p>
                            <p className="text-xs text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{u.department}</td>
                      <td className="px-5 py-3.5"><RoleBadge role={u.role} /></td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${STATUS_TEXT[u.status]}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[u.status]}`} /> {u.status[0] + u.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right relative">
                        <button onClick={() => setOpenMenuId(openMenuId === u.id ? null : u.id)} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 transition-colors">
                          <MoreVertical size={16} />
                        </button>
                        {openMenuId === u.id && <ActionsMenu actions={menuActions(u)} onClose={() => setOpenMenuId(null)} />}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-5">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-xs font-semibold text-slate-500 disabled:text-slate-300 hover:text-slate-700">← Previous</button>
              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setPage(p)} className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors ${p === page ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"}`}>{p}</button>
                ))}
              </div>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-xs font-semibold text-slate-500 disabled:text-slate-300 hover:text-slate-700">Next →</button>
            </div>
          )}
        </>
      ) : selectedDept ? (
        <DepartmentDetail
          department={selectedDept}
          users={users.filter((u) => u.department === selectedDept && u.status !== "REMOVED")}
          onBack={() => setSelectedDept(null)}
          onInvite={(role) => setInviteTarget({ department: selectedDept, role })}
          menuActions={menuActions}
          openMenuId={openMenuId}
          setOpenMenuId={setOpenMenuId}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEPARTMENTS.map((d) => {
            const deptUsers = users.filter((u) => u.department === d && u.status !== "REMOVED");
            const head = deptUsers.find((u) => u.role === "DEPARTMENT_HEAD");
            const manager = deptUsers.find((u) => u.role === "LAB_MANAGER");
            const techCount = deptUsers.filter((u) => u.role === "TECHNICIAN").length;
            return (
              <button key={d} onClick={() => setSelectedDept(d)} className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={18} /></span>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-900">{d}</p>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p>Department Head: <span className={head ? "font-semibold text-slate-700" : "text-amber-600 font-semibold"}>{head ? head.name : "Unassigned"}</span></p>
                  <p>Lab Manager: <span className={manager ? "font-semibold text-slate-700" : "text-amber-600 font-semibold"}>{manager ? manager.name : "Unassigned"}</span></p>
                  <p>Lab Technicians: <span className="font-semibold text-slate-700">{techCount}</span></p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {inviteTarget && (
        <InviteUserModal
          departments={DEPARTMENTS}
          defaultDepartment={inviteTarget.department}
          defaultRole={inviteTarget.role}
          onClose={() => setInviteTarget(null)}
          onSubmit={applyInvite}
        />
      )}
      {roleModalUser && (
        <ChangeRoleModal user={roleModalUser} onClose={() => setRoleModalUser(null)} onSubmit={(role) => applyRoleChange(roleModalUser.id, role)} />
      )}
      {detailModal && (
        <UserDetailModal
          user={detailModal.user}
          mode={detailModal.mode}
          departments={DEPARTMENTS}
          onClose={() => setDetailModal(null)}
          onSave={(patch) => saveUserEdit(detailModal.user.id, patch)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
function SummaryCard({ icon: Icon, label, value, tone, bg }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${tone} mb-3`}><Icon size={16} /></span>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${ROLE_STYLE[role]}`}>
      {ROLE_LABEL[role]}
    </span>
  );
}

/* ---------------------------------------------------------------- */
function ActionsMenu({ actions, onClose }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-5 top-11 z-50 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 text-left">
        {actions.map((a, i) =>
          a.divider ? (
            <div key={i} className="my-1 border-t border-slate-100" />
          ) : (
            <button
              key={i}
              onClick={() => { a.onClick(); onClose(); }}
              className={`w-full text-left px-3.5 py-2 text-xs font-semibold transition-colors ${a.danger ? "text-red-500 hover:bg-red-50" : "text-slate-700 hover:bg-slate-50"}`}
            >
              {a.label}
            </button>
          )
        )}
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- */
/*  Department Detail                                                  */
/* ---------------------------------------------------------------- */
function DepartmentDetail({ department, users, onBack, onInvite, menuActions, openMenuId, setOpenMenuId }) {
  const head = users.find((u) => u.role === "DEPARTMENT_HEAD");
  const manager = users.find((u) => u.role === "LAB_MANAGER");
  const technicians = users.filter((u) => u.role === "TECHNICIAN");

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={13} /> Back to Departments
      </button>
      <h2 className="text-lg font-extrabold text-slate-900 uppercase tracking-wide mb-5">{department} Department</h2>

      <SlotRow
        label="Department Head"
        user={head}
        emptyAction={() => onInvite("DEPARTMENT_HEAD")}
        emptyLabel="Assign Department Head"
        menuActions={menuActions}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
      />
      <div className="my-5 border-t border-slate-100" />
      <SlotRow
        label="Lab Manager"
        user={manager}
        emptyAction={() => onInvite("LAB_MANAGER")}
        emptyLabel="Assign Lab Manager"
        menuActions={menuActions}
        openMenuId={openMenuId}
        setOpenMenuId={setOpenMenuId}
      />
      <div className="my-5 border-t border-slate-100" />

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-slate-900">Lab Technicians ({technicians.length})</h3>
        <button onClick={() => onInvite("TECHNICIAN")} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 transition-colors">
          <UserPlus size={13} /> Invite Technician
        </button>
      </div>
      {technicians.length === 0 ? (
        <EmptyState icon={Wrench} title="No lab technicians in this department yet" />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
          {technicians.map((t) => (
            <div key={t.id} className="p-4 flex items-center justify-between gap-4 relative">
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-bold">{initials(t.name)}</span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{t.name}</p>
                  <p className="text-xs text-slate-400 truncate">{t.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${STATUS_TEXT[t.status]}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[t.status]}`} /> {t.status[0] + t.status.slice(1).toLowerCase()}
                </span>
                <button onClick={() => setOpenMenuId(openMenuId === t.id ? null : t.id)} className="rounded-lg p-1.5 hover:bg-slate-100 text-slate-500 transition-colors">
                  <MoreVertical size={16} />
                </button>
                {openMenuId === t.id && <ActionsMenu actions={menuActions(t)} onClose={() => setOpenMenuId(null)} />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SlotRow({ label, user, emptyAction, emptyLabel, menuActions, openMenuId, setOpenMenuId }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{label}</p>
      {user ? (
        <div className="flex items-center justify-between gap-4 relative">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-bold">{initials(user.name)}</span>
            <div>
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${STATUS_TEXT[user.status]}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[user.status]}`} /> {user.status[0] + user.status.slice(1).toLowerCase()}
              </span>
            </div>
          </div>
          <button onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-4 py-2 transition-colors">
            Manage
          </button>
          {openMenuId === user.id && <ActionsMenu actions={menuActions(user)} onClose={() => setOpenMenuId(null)} />}
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-dashed border-slate-200 px-4 py-3.5">
          <p className="text-xs text-amber-600 font-semibold">No {label.toLowerCase()} assigned yet.</p>
          <button onClick={emptyAction} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3.5 py-2 flex items-center gap-1.5 transition-colors">
            <UserPlus size={13} /> {emptyLabel}
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Modals                                                             */
/* ---------------------------------------------------------------- */
function InviteUserModal({ departments, defaultDepartment, defaultRole, onClose, onSubmit }) {
  const [form, setForm] = useState({ name: "", email: "", department: defaultDepartment, role: defaultRole });
  const [errors, setErrors] = useState({});
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit(form);
  };

  return (
    <Modal title="Invite User" subtitle={`New ${ROLE_LABEL[form.role]} for ${form.department}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Full Name" required error={errors.name}>
          <input value={form.name} onChange={set("name")} placeholder="e.g. Priya Sharma" className={inputClass(errors.name)} />
        </Field>
        <Field label="Email" required error={errors.email}>
          <input type="email" value={form.email} onChange={set("email")} placeholder="name@sunrise.edu" className={inputClass(errors.email)} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Department">
            <select value={form.department} onChange={set("department")} className={inputClass()}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={set("role")} className={inputClass()}>
              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
          </Field>
        </div>
        <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Send Invitation
        </button>
      </div>
    </Modal>
  );
}

function ChangeRoleModal({ user, onClose, onSubmit }) {
  const [role, setRole] = useState(user.role);
  return (
    <Modal title="Change Role" subtitle={`${user.name} · ${user.department}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="New Role" hint="Only one active Department Head and one active Lab Manager are allowed per department.">
          <select value={role} onChange={(e) => setRole(e.target.value)} className={inputClass()}>
            {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
        </Field>
        <button onClick={() => onSubmit(role)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Save Role
        </button>
      </div>
    </Modal>
  );
}

function UserDetailModal({ user, mode, departments, onClose, onSave }) {
  const [editing, setEditing] = useState(mode === "edit");
  const [form, setForm] = useState({ name: user.name, email: user.email, department: user.department });
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <Modal title={editing ? (user.status === "INVITED" ? "Edit Invitation" : "Edit User") : "User Details"} subtitle={user.id} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold">{initials(user.name)}</span>
          <div>
            <RoleBadge role={user.role} />
            <span className={`ml-2 inline-flex items-center gap-1.5 text-xs font-bold align-middle ${STATUS_TEXT[user.status]}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[user.status]}`} /> {user.status[0] + user.status.slice(1).toLowerCase()}
            </span>
          </div>
        </div>

        <Field label="Full Name"><input disabled={!editing} value={form.name} onChange={set("name")} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} /></Field>
        <Field label="Email"><input disabled={!editing} value={form.email} onChange={set("email")} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} /></Field>
        <Field label="Department">
          {editing ? (
            <select value={form.department} onChange={set("department")} className={inputClass()}>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          ) : (
            <input disabled value={form.department} className={`${inputClass()} bg-slate-50 text-slate-500`} />
          )}
        </Field>

        {editing ? (
          <button onClick={() => onSave(form)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">Save Changes</button>
        ) : (
          <button onClick={() => setEditing(true)} className="w-full rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 transition-colors">Edit</button>
        )}
      </div>
    </Modal>
  );
}
