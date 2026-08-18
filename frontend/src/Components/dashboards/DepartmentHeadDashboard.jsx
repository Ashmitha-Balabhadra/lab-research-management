import { useMemo, useState } from "react";
import {
  LayoutDashboard, Package, Gauge, Wallet, Share2, FileText, UserRound,
  TrendingUp, HandCoins, Recycle, ThumbsUp, ThumbsDown, Download,
} from "lucide-react";
import {
  StatusBadge, StatCard, DashboardShell, ViewHeader, EmptyState,
} from "../shared/ui.jsx";
import UtilizationHeatmapPage from "../shared/UtilizationHeatmapPage.jsx";
import { DEMO_EQUIPMENT, DEMO_BOOKINGS } from "../../data/mockData.js";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "equipment", label: "Department Equipment Catalog", icon: Package },
  { id: "utilization", label: "Utilization & Analytics", icon: Gauge },
  { id: "budget", label: "Cost & Budget Tracking", icon: Wallet },
  { id: "sharing", label: "Inter-Institution Requests", icon: Share2 },
  { id: "reports", label: "Reports & Export", icon: FileText },
  { id: "profile", label: "Profile", icon: UserRound },
];

// Demo-only inter-institution sharing requests (frontend-only state, per the app's existing pattern).
const DEMO_SHARING_REQUESTS = [
  { id: "SR-301", institution: "Northbridge University", equipment: "Agilent 1260 HPLC System", requestedBy: "Dr. Elena Cross", window: "Aug 25 – Aug 29, 2026", terms: "Cost-shared, 50/50 split on consumables.", status: "PENDING" },
  { id: "SR-302", institution: "Coastal Research Institute", equipment: "Malvern Zetasizer Nano", requestedBy: "Dr. Michael Tan", window: "Sep 3 – Sep 5, 2026", terms: "Flat access fee, institution covers transport.", status: "PENDING" },
];

export default function DepartmentHeadDashboard({ user, onLogout, toast }) {
  const [view, setView] = useState("home");
  const [equipment] = useState(DEMO_EQUIPMENT);
  const [bookings] = useState(DEMO_BOOKINGS);
  const [sharingRequests, setSharingRequests] = useState(DEMO_SHARING_REQUESTS);

  const deptEquipment = useMemo(() => equipment.filter((e) => e.department === user.department), [equipment, user.department]);
  const decideSharing = (id, decision) => {
    setSharingRequests((list) => list.map((r) => (r.id === id ? { ...r, status: decision } : r)));
    toast(`Sharing request ${id} ${decision === "APPROVED" ? "approved" : "denied"}.`, decision === "APPROVED" ? "success" : "error");
  };

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeView={view}
      setActiveView={setView}
      onLogout={onLogout}
      roleLabel="Department Head"
      roleTag="Signed in as"
      userName={user.name}
    >
      {view === "home" && (
        <HomeView user={user} deptEquipment={deptEquipment} sharingRequests={sharingRequests} onOpenUtilization={() => setView("utilization")} onOpenSharing={() => setView("sharing")} />
      )}
      {view === "equipment" && <EquipmentCatalogView equipment={deptEquipment} department={user.department} />}
      {view === "utilization" && (
        <UtilizationHeatmapPage role="department-head" user={user} equipment={equipment} bookings={bookings} toast={toast} />
      )}
      {view === "budget" && <BudgetView deptEquipment={deptEquipment} />}
      {view === "sharing" && <SharingView requests={sharingRequests} onDecide={decideSharing} />}
      {view === "reports" && <ReportsView toast={toast} />}
      {view === "profile" && <ProfileView user={user} toast={toast} />}
    </DashboardShell>
  );
}

/* ---------------------------------------------------------------- */
function HomeView({ user, deptEquipment, sharingRequests, onOpenUtilization, onOpenSharing }) {
  const utilization = 71.4; // headline figure — see Utilization & Analytics for the full breakdown
  const budgetUsedPct = 62;
  const pendingSharing = sharingRequests.filter((r) => r.status === "PENDING").length;
  const roiFlags = deptEquipment.filter((e) => e.calibrationStatus === "Overdue").length;

  return (
    <div>
      <ViewHeader title="Department Head Dashboard" subtitle={`${user.department} Department — utilization, budget, and cross-institution activity.`} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Gauge} label="Overall Department Utilization" value={`${utilization}%`} tone="text-blue-600" bg="bg-blue-50" onClick={onOpenUtilization} />
        <StatCard icon={Wallet} label="Budget Utilization" value={`${budgetUsedPct}%`} tone="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Share2} label="Cross-Department Sharing Requests" value={pendingSharing} tone="text-amber-600" bg="bg-amber-50" onClick={onOpenSharing} />
        <StatCard icon={Recycle} label="Equipment ROI & Lifecycle Flags" value={roiFlags} tone="text-orange-600" bg="bg-orange-50" />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900">Department Equipment Snapshot</h2>
          <span className="text-xs text-slate-400">{deptEquipment.length} assets</span>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {["AVAILABLE", "BOOKED", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"].map((s) => (
            <div key={s} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-center justify-between">
              <StatusBadge status={s} />
              <span className="font-bold text-slate-700 text-sm">{deptEquipment.filter((e) => e.status === s).length}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function EquipmentCatalogView({ equipment, department }) {
  return (
    <div>
      <ViewHeader title="Department Equipment Catalog" subtitle={`Full inventory catalog for the ${department} department (read-only — managed by your Lab Manager).`} />
      {equipment.length === 0 ? (
        <EmptyState icon={Package} title="No equipment on record" />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                <th className="text-left font-semibold px-5 py-3">Category</th>
                <th className="text-left font-semibold px-5 py-3">Location</th>
                <th className="text-left font-semibold px-5 py-3">Calibration</th>
                <th className="text-left font-semibold px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {equipment.map((e) => (
                <tr key={e.id}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{e.image}</span>
                      <div>
                        <p className="font-semibold text-slate-800">{e.name}</p>
                        <p className="text-xs text-slate-400">{e.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{e.category}</td>
                  <td className="px-5 py-3.5 text-slate-600">{e.location}</td>
                  <td className="px-5 py-3.5 text-slate-600">{e.calibrationStatus}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={e.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
function BudgetView({ deptEquipment }) {
  const budgetTotal = 480000;
  const budgetUsed = 297600;
  const lines = [
    { label: "Equipment usage & consumables", amount: 168400 },
    { label: "Maintenance & repairs", amount: 74200 },
    { label: "Calibration & compliance", amount: 31000 },
    { label: "Cross-institution sharing chargebacks", amount: 24000 },
  ];
  return (
    <div>
      <ViewHeader title="Cost & Budget Tracking" subtitle="Usage-based cost allocation and maintenance spend for your department." />
      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} label="Annual Budget" value={`₹${(budgetTotal / 1000).toFixed(0)}K`} tone="text-slate-700" bg="bg-slate-100" />
        <StatCard icon={TrendingUp} label="Consumed" value={`₹${(budgetUsed / 1000).toFixed(0)}K`} tone="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={HandCoins} label="Remaining" value={`₹${((budgetTotal - budgetUsed) / 1000).toFixed(0)}K`} tone="text-emerald-600" bg="bg-emerald-50" />
      </div>
      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-bold text-slate-900 mb-4">Spend Breakdown</h2>
        <div className="space-y-3">
          {lines.map((l) => (
            <div key={l.label}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{l.label}</span>
                <span className="font-semibold text-slate-800">₹{l.amount.toLocaleString()}</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round((l.amount / budgetUsed) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-4">{deptEquipment.length} assets contribute to this department's chargeback pool.</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- */
function SharingView({ requests, onDecide }) {
  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");
  return (
    <div>
      <ViewHeader title="Inter-Institution Sharing Requests" subtitle="Requests from external universities or research centers for shared equipment access." />
      {pending.length === 0 ? (
        <EmptyState icon={Share2} title="No pending sharing requests" />
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">{r.equipment}</p>
                  <span className="text-xs text-slate-400">{r.id}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-xs text-slate-500 mt-1">{r.institution} · requested by {r.requestedBy}</p>
                <p className="text-xs text-slate-500">{r.window}</p>
                <p className="text-xs text-slate-600 mt-1.5">{r.terms}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => onDecide(r.id, "APPROVED")} className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2.5 flex items-center gap-1.5 transition-colors">
                  <ThumbsUp size={13} /> Approve Sharing
                </button>
                <button onClick={() => onDecide(r.id, "DENIED")} className="rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-4 py-2.5 flex items-center gap-1.5 transition-colors">
                  <ThumbsDown size={13} /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {decided.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-slate-900 mb-3">Decided</h2>
          <div className="space-y-2">
            {decided.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{r.equipment} — {r.institution}</p>
                  <p className="text-xs text-slate-500">{r.id} · {r.window}</p>
                </div>
                <StatusBadge status={r.status === "APPROVED" ? "CONFIRMED" : "REJECTED"} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
function ReportsView({ toast }) {
  const reportTypes = [
    { id: "UTILIZATION", label: "Equipment Utilization", desc: "Department utilization vs. institutional benchmark." },
    { id: "MAINTENANCE", label: "Maintenance Downtime", desc: "Work orders, downtime, and technician workload." },
    { id: "BUDGET", label: "Budget Audit", desc: "Usage-based cost allocation and chargeback detail." },
  ];
  return (
    <div>
      <ViewHeader title="Reports & Export" subtitle="Generate reports for institutional leadership." />
      <div className="grid sm:grid-cols-3 gap-5">
        {reportTypes.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-3"><FileText size={17} /></span>
            <h3 className="text-sm font-bold text-slate-900">{r.label}</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => toast(`${r.label} exported as PDF.`, "success")} className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 flex items-center justify-center gap-1.5 transition-colors">
                <Download size={12} /> PDF
              </button>
              <button onClick={() => toast(`${r.label} exported as Excel.`, "success")} className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 flex items-center justify-center gap-1.5 transition-colors">
                <Download size={12} /> Excel
              </button>
            </div>
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
      <ViewHeader title="Profile" subtitle="Manage your Department Head account details." />
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
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Department</p><p className="text-slate-800">{user.department}</p></div>
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Institution</p><p className="text-slate-800">{user.institution}</p></div>
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Phone</p><p className="text-slate-800">{user.phone}</p></div>
          <div><p className="text-xs font-semibold text-slate-500 mb-1">Role</p><p className="text-slate-800">Department Head</p></div>
        </div>
        <button onClick={() => { setEditing((v) => !v); if (editing) toast("Profile updated.", "success"); }} className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
          {editing ? "Save Changes" : "Edit Profile"}
        </button>
      </div>
    </div>
  );
}
