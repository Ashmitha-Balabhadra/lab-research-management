import { useMemo, useState } from "react";
import {
  LayoutDashboard, Share2, Users, Gauge, Receipt, ScrollText, UserRound,
  Package, Building2, ShieldCheck, BarChart2, HandCoins, FileText, Bell,
} from "lucide-react";
import {
  StatusBadge, StatCard, DashboardShell, ViewHeader, inputClass,
} from "../shared/ui.jsx";
import UtilizationHeatmapPage from "../shared/UtilizationHeatmapPage.jsx";
import CrossInstitutionSharingView from "./CrossInstitutionSharingView.jsx";
import UserManagementView from "./UserManagementView.jsx";
import { InterInstitutionBillingView, DeptCostView, SharedEquipmentCostView } from "../cost/CostManagementView.jsx";
import InstitutionAdminAnalyticsView from "../analytics/InstitutionAdminAnalyticsView.jsx";
import ReportsDashboardView from "../reports/ReportsDashboardView.jsx";
import NotificationCenter from "../notifications/NotificationCenter.jsx";
import { DEMO_EQUIPMENT, DEMO_BOOKINGS } from "../../data/mockData.js";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "network", label: "Institution Equipment Network", icon: Package },
  { id: "sharing", label: "Cross-Institution Sharing", icon: Share2 },
  { id: "users", label: "User Management", icon: Users },
  { id: "analytics", label: "Institution Analytics", icon: BarChart2 },
  { id: "utilization", label: "Utilization Heatmap", icon: Gauge },
  { id: "reports", label: "Reports & Export", icon: FileText },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "billing", label: "Billing & Cost Recovery", icon: Receipt },
  { id: "dept-cost", label: "Dept Cost Allocation", icon: BarChart2 },
  { id: "shared-cost", label: "Shared Equipment Cost", icon: HandCoins },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "profile", label: "Profile", icon: UserRound },
];

// Matches the seed data in CrossInstitutionSharingView.jsx — used only for the dashboard summary cards below.
const PENDING_ADMIN_APPROVALS = 2;

const DEMO_INVOICES = [
  { id: "INV-2026-081", from: "Chemistry", to: "Northbridge University", amount: 18400, status: "PAID", date: "2026-08-02" },
  { id: "INV-2026-082", from: "Biology", to: "Materials Science (internal)", amount: 4200, status: "PENDING", date: "2026-08-10" },
  { id: "INV-2026-083", from: "Mechanical Engineering", to: "Coastal Research Institute", amount: 9600, status: "OVERDUE", date: "2026-07-15" },
];

const DEMO_AUDIT_LOG = [
  { id: "AL-901", actor: "Sneha Kapoor", action: "Approved sharing agreement AG-12", time: "Today, 9:14 AM" },
  { id: "AL-902", actor: "Sneha Kapoor", action: "Changed role for Sara Iyer to SUSPENDED", time: "Yesterday, 4:02 PM" },
  { id: "AL-903", actor: "System", action: "Nightly institution utilization snapshot generated", time: "Yesterday, 12:00 AM" },
  { id: "AL-904", actor: "Sneha Kapoor", action: "Approved Institution Administrator registration for self", time: "3 days ago" },
];

const INVOICE_STATUS_STYLE = { PAID: "CONFIRMED", PENDING: "PENDING_APPROVAL", OVERDUE: "REJECTED" };

export default function InstitutionAdminDashboard({ user, onLogout, toast }) {
  const [view, setView] = useState("home");
  const [equipment] = useState(DEMO_EQUIPMENT);
  const [bookings] = useState(DEMO_BOOKINGS);

  const departments = useMemo(() => [...new Set(equipment.map((e) => e.department))].sort(), [equipment]);

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeView={view}
      setActiveView={setView}
      onLogout={onLogout}
      roleLabel="Institution Administrator"
      roleTag="Signed in as"
      userName={user.name}
    >
      {view === "home" && (
        <HomeView user={user} equipment={equipment} onOpenAnalytics={() => setView("analytics")} onOpenSharing={() => setView("sharing")} />
      )}
      {view === "network" && <NetworkView equipment={equipment} departments={departments} />}
      {view === "sharing" && <CrossInstitutionSharingView user={user} toast={toast} />}
      {view === "users" && <UserManagementView toast={toast} />}
      {view === "analytics" && (
        <InstitutionAdminAnalyticsView equipment={equipment} bookings={bookings} toast={toast} />
      )}
      {view === "utilization" && (
        <UtilizationHeatmapPage role="institution-admin" user={user} equipment={equipment} bookings={bookings} toast={toast} />
      )}
      {view === "reports" && (
        <ReportsDashboardView role="institution-admin" user={user} toast={toast} />
      )}
      {view === "notifications" && (
        <NotificationCenter role="institution-admin" user={user} onNavigate={setView} toast={toast} />
      )}
      {view === "billing" && <InterInstitutionBillingView toast={toast} />}
      {view === "dept-cost" && <DeptCostView />}
      {view === "shared-cost" && <SharedEquipmentCostView />}
      {view === "audit" && <AuditView />}
      {view === "profile" && <ProfileView user={user} toast={toast} />}
    </DashboardShell>
  );
}

/* ---------------------------------------------------------------- */
function HomeView({ user, equipment, onOpenAnalytics, onOpenSharing }) {
  const activeEquipment = equipment.filter((e) => e.status !== "RETIRED");
  const utilization = 68; // institution-wide headline figure — see Institution Analytics for the breakdown

  return (
    <div>
      <ViewHeader title="Institution Administrator Dashboard" subtitle={`${user.institution} — institution-wide equipment, sharing, and access oversight.`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Total Active Equipment" value={activeEquipment.length} tone="text-blue-600" bg="bg-blue-50" onClick={onOpenAnalytics} />
        <StatCard icon={Gauge} label="Institution-Wide Utilization Rate" value={`${utilization}%`} tone="text-emerald-600" bg="bg-emerald-50" onClick={onOpenAnalytics} />
        <StatCard icon={Share2} label="Cross-Institution Sharing Agreements" value={PENDING_ADMIN_APPROVALS > 0 ? `${PENDING_ADMIN_APPROVALS} pending` : "All settled"} tone="text-indigo-600" bg="bg-indigo-50" onClick={onOpenSharing} />
        <StatCard icon={ShieldCheck} label="Pending Admin Approvals" value={PENDING_ADMIN_APPROVALS} tone="text-amber-600" bg="bg-amber-50" onClick={onOpenSharing} />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Equipment by Department</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...new Set(equipment.map((e) => e.department))].sort().map((d) => (
            <div key={d} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-1.5"><Building2 size={13} className="text-slate-400" /> {d}</span>
              <span className="font-bold text-slate-700 text-sm">{equipment.filter((e) => e.department === d).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function NetworkView({ equipment, departments }) {
  const [deptFilter, setDeptFilter] = useState("ALL");
  const rows = equipment.filter((e) => deptFilter === "ALL" || e.department === deptFilter);
  return (
    <div>
      <ViewHeader
        title="Institution Equipment Network"
        subtitle="Every piece of equipment across departments, in one network view."
        action={
          <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className={`${inputClass()} w-48`}>
            <option value="ALL">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        }
      />
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-5 py-3">Equipment</th>
              <th className="text-left font-semibold px-5 py-3">Department</th>
              <th className="text-left font-semibold px-5 py-3">Location</th>
              <th className="text-left font-semibold px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((e) => (
              <tr key={e.id}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{e.image}</span>
                    <div><p className="font-semibold text-slate-800">{e.name}</p><p className="text-xs text-slate-400">{e.id}</p></div>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-slate-600">{e.department}</td>
                <td className="px-5 py-3.5 text-slate-600">{e.location}</td>
                <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function BillingView() {
  const total = DEMO_INVOICES.reduce((a, i) => a + i.amount, 0);
  const overdue = DEMO_INVOICES.filter((i) => i.status === "OVERDUE").reduce((a, i) => a + i.amount, 0);
  return (
    <div>
      <ViewHeader title="Billing & Cost Recovery" subtitle="Inter-departmental and inter-institution billing logs and cost-recovery tallies." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Receipt} label="Total Billed (30d)" value={`₹${total.toLocaleString()}`} tone="text-slate-700" bg="bg-slate-100" />
        <StatCard icon={Receipt} label="Outstanding / Overdue" value={`₹${overdue.toLocaleString()}`} tone="text-red-600" bg="bg-red-50" />
        <StatCard icon={Receipt} label="Invoices This Period" value={DEMO_INVOICES.length} tone="text-blue-600" bg="bg-blue-50" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-5 py-3">Invoice</th>
              <th className="text-left font-semibold px-5 py-3">From → To</th>
              <th className="text-left font-semibold px-5 py-3">Date</th>
              <th className="text-right font-semibold px-5 py-3">Amount</th>
              <th className="text-left font-semibold px-5 py-3 pl-6">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {DEMO_INVOICES.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-3.5 font-semibold text-blue-600">{i.id}</td>
                <td className="px-5 py-3.5 text-slate-600">{i.from} → {i.to}</td>
                <td className="px-5 py-3.5 text-slate-600">{new Date(i.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</td>
                <td className="px-5 py-3.5 text-right font-semibold text-slate-800">₹{i.amount.toLocaleString()}</td>
                <td className="px-5 py-3.5 pl-6"><StatusBadge status={INVOICE_STATUS_STYLE[i.status]} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function AuditView() {
  return (
    <div>
      <ViewHeader title="Audit Logs" subtitle="A record of institution-level administrative actions." />
      <div className="rounded-2xl border border-slate-200 bg-white divide-y divide-slate-100">
        {DEMO_AUDIT_LOG.map((log) => (
          <div key={log.id} className="p-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">{log.action}</p>
              <p className="text-xs text-slate-500 mt-0.5">by {log.actor}</p>
            </div>
            <span className="text-xs text-slate-400 shrink-0">{log.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function ProfileView({ user, toast }) {
  const [editing, setEditing] = useState(false);
  return (
    <div>
      <ViewHeader title="Profile" subtitle="Manage your Institution Administrator account details." />
      <div className="rounded-2xl border border-slate-200 bg-white p-6 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
            {user.firstName[0]}{user.lastName?.[0] || ""}
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900">{user.firstName} {user.lastName}</p>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Institution</p><p className="text-slate-800">{user.institution}</p></div>
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Phone</p><p className="text-slate-800">{user.phone}</p></div>
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Role</p><p className="text-slate-800">Institution Administrator</p></div>
        </div>
        <button onClick={() => { setEditing((v) => !v); if (editing) toast("Profile updated.", "success"); }} className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
          {editing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>
    </div>
  );
}
