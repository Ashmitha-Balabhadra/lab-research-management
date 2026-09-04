/**
 * CostManagementView.jsx
 * ------------------------------------------------------------------
 * M3 Task 3 — Cost Management & Inter-Institution Billing
 *
 * DEMO DATA NOTICE:
 *   All cost/billing data in this file is frontend-only demo data.
 *   The backend has NO dedicated billing or cost API endpoints.
 *   The only confirmed cost fields from the backend are:
 *     - SharedBooking.usageFee  (BigDecimal)
 *     - SharingAgreement.costSharingTerms  (text)
 *   When the API documentation from the teammate is available,
 *   replace the DEMO_* constants with real API calls via a
 *   costApi.js / billingApi.js service layer.
 *
 * Exports (used by individual dashboards):
 *   - UsageCostView          — Researcher, Manager, Dept Head
 *   - DeptCostView           — Dept Head, Inst Admin
 *   - SharedEquipmentCostView — Dept Head, Inst Admin
 *   - InterInstitutionBillingView — Inst Admin
 *   - MyUsageCostSection     — Researcher (inline in booking history)
 * ------------------------------------------------------------------
 */

import { useState } from "react";
import {
  Receipt, TrendingUp, DollarSign, AlertTriangle, CheckCircle2,
  Clock, Search, ChevronRight, ArrowLeft, Info, Building2,
  Filter, Download, X, Users, Layers, BarChart2, HandCoins,
} from "lucide-react";
import {
  StatusBadge, ViewHeader, StatCard, EmptyState, Modal,
} from "../shared/ui.jsx";

/* ================================================================== */
/*  CURRENCY HELPER                                                     */
/* ================================================================== */
function fmt(n) {
  return `₹${Number(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
function fmtDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

/* ================================================================== */
/*  DEMO DATA — Frontend only. No backend billing/cost endpoint exists. */
/* ================================================================== */

/**
 * Usage cost records — linked by bookingId to DEMO_BOOKINGS.
 * costRate: ₹/hour, duration: hours, totalCost: ₹
 */
export const DEMO_USAGE_COSTS = [
  {
    id: "UC-001",
    bookingId: "BK-2201",
    equipmentId: "EQ-101",
    equipmentName: "Zeiss Axio Confocal Microscope",
    researcher: "Priya Sharma",
    department: "Biology",
    institution: "Own Institution",
    date: "2026-08-14",
    start: "09:00",
    end: "12:00",
    durationHours: 3,
    costRate: 1200,
    totalCost: 3600,
    status: "PENDING",
    category: "Microscopy",
  },
  {
    id: "UC-002",
    bookingId: "BK-2202",
    equipmentId: "EQ-102",
    equipmentName: "Agilent 1260 HPLC System",
    researcher: "Arjun Mehta",
    department: "Chemistry",
    institution: "Own Institution",
    date: "2026-08-15",
    start: "13:00",
    end: "16:00",
    durationHours: 3,
    costRate: 1800,
    totalCost: 5400,
    status: "INVOICED",
    category: "Chromatography",
  },
  {
    id: "UC-003",
    bookingId: "BK-2204",
    equipmentId: "EQ-103",
    equipmentName: "Thermo QuantStudio qPCR",
    researcher: "You",
    department: "Biology",
    institution: "Own Institution",
    date: "2026-08-11",
    start: "08:30",
    end: "10:00",
    durationHours: 1.5,
    costRate: 900,
    totalCost: 1350,
    status: "PAID",
    category: "Molecular Biology",
  },
  {
    id: "UC-004",
    bookingId: "BK-2205",
    equipmentId: "EQ-107",
    equipmentName: "Beckman Coulter Ultracentrifuge",
    researcher: "You",
    department: "Biology",
    institution: "Own Institution",
    date: "2026-08-01",
    start: "09:00",
    end: "10:00",
    durationHours: 1,
    costRate: 750,
    totalCost: 750,
    status: "PAID",
    category: "Sample Prep",
  },
  {
    id: "UC-005",
    bookingId: "BK-2208",
    equipmentId: "EQ-101",
    equipmentName: "Zeiss Axio Confocal Microscope",
    researcher: "You",
    department: "Biology",
    institution: "Own Institution",
    date: "2026-08-20",
    start: "09:00",
    end: "11:00",
    durationHours: 2,
    costRate: 1200,
    totalCost: 2400,
    status: "PENDING",
    category: "Microscopy",
  },
  {
    id: "UC-006",
    bookingId: "BK-EXT-001",
    equipmentId: "EQ-102",
    equipmentName: "Agilent 1260 HPLC System",
    researcher: "Dr. Elena Cross",
    department: "Analytical Chemistry",
    institution: "Northbridge University",
    date: "2026-08-25",
    start: "10:00",
    end: "15:00",
    durationHours: 5,
    costRate: 2200,
    totalCost: 11000,
    status: "INVOICED",
    category: "Chromatography",
  },
  {
    id: "UC-007",
    bookingId: "BK-EXT-002",
    equipmentId: "EQ-105",
    equipmentName: "Malvern Zetasizer Nano",
    researcher: "Dr. Michael Tan",
    department: "Materials Research",
    institution: "Coastal Research Institute",
    date: "2026-09-03",
    start: "09:00",
    end: "12:00",
    durationHours: 3,
    costRate: 1400,
    totalCost: 4200,
    status: "PENDING",
    category: "Particle Analysis",
  },
  {
    id: "UC-008",
    bookingId: "BK-2203",
    equipmentId: "EQ-108",
    equipmentName: "Bruker 400MHz NMR Spectrometer",
    researcher: "Sara Iyer",
    department: "Chemistry",
    institution: "Own Institution",
    date: "2026-08-12",
    start: "10:00",
    end: "11:30",
    durationHours: 1.5,
    costRate: 2500,
    totalCost: 3750,
    status: "CANCELLED",
    category: "Spectroscopy",
  },
];

/** Department-wise cost allocation */
export const DEMO_DEPT_COSTS = [
  {
    department: "Biology",
    bookingCount: 18,
    usageHours: 34.5,
    usageCost: 28400,
    sharedCost: 6200,
    maintenanceCost: 4100,
    totalCost: 38700,
    equipment: ["EQ-101", "EQ-103", "EQ-107"],
  },
  {
    department: "Chemistry",
    bookingCount: 14,
    usageHours: 22,
    usageCost: 24600,
    sharedCost: 11000,
    maintenanceCost: 3800,
    totalCost: 39400,
    equipment: ["EQ-102", "EQ-105", "EQ-108"],
  },
  {
    department: "Materials Science",
    bookingCount: 5,
    usageHours: 9,
    usageCost: 6300,
    sharedCost: 4200,
    maintenanceCost: 12500,
    totalCost: 23000,
    equipment: ["EQ-106"],
  },
  {
    department: "Mechanical Engineering",
    bookingCount: 3,
    usageHours: 6,
    usageCost: 4800,
    sharedCost: 0,
    maintenanceCost: 18200,
    totalCost: 23000,
    equipment: ["EQ-104"],
  },
];

/** Shared equipment cost breakdown */
export const DEMO_SHARED_EQUIP_COSTS = [
  {
    id: "SE-001",
    equipmentId: "EQ-102",
    equipmentName: "Agilent 1260 HPLC System",
    owningDept: "Chemistry",
    owningInstitution: "Own Institution",
    totalUsageCost: 16400,
    status: "ACTIVE",
    shares: [
      { institution: "Own Institution", dept: "Chemistry", usageHours: 4, amount: 5400, pct: 33 },
      { institution: "Northbridge University", dept: "Analytical Chemistry", usageHours: 5, amount: 11000, pct: 67 },
    ],
  },
  {
    id: "SE-002",
    equipmentId: "EQ-105",
    equipmentName: "Malvern Zetasizer Nano",
    owningDept: "Chemistry",
    owningInstitution: "Own Institution",
    totalUsageCost: 4200,
    status: "ACTIVE",
    shares: [
      { institution: "Own Institution", dept: "Chemistry", usageHours: 0, amount: 0, pct: 0 },
      { institution: "Coastal Research Institute", dept: "Materials Research", usageHours: 3, amount: 4200, pct: 100 },
    ],
  },
];

/** Inter-institution billing records */
export const DEMO_BILLING_RECORDS = [
  {
    id: "INV-2026-081",
    reference: "INV-2026-081",
    fromInstitution: "Own Institution",
    toInstitution: "Northbridge University",
    equipmentName: "Agilent 1260 HPLC System",
    usagePeriod: "Aug 25, 2026",
    usageHours: 5,
    amount: 11000,
    billingDate: "2026-08-26",
    dueDate: "2026-09-25",
    status: "INVOICED",
    costSharingTerms: "External access fee at ₹2,200/hr. Institution covers consumables.",
    relatedBookingId: "BK-EXT-001",
  },
  {
    id: "INV-2026-082",
    reference: "INV-2026-082",
    fromInstitution: "Own Institution",
    toInstitution: "Coastal Research Institute",
    equipmentName: "Malvern Zetasizer Nano",
    usagePeriod: "Sep 3, 2026",
    usageHours: 3,
    amount: 4200,
    billingDate: "2026-09-04",
    dueDate: "2026-10-04",
    status: "PENDING",
    costSharingTerms: "Flat access fee ₹1,400/hr. Coastal Research Institute covers transport.",
    relatedBookingId: "BK-EXT-002",
  },
  {
    id: "INV-2026-079",
    reference: "INV-2026-079",
    fromInstitution: "Own Institution",
    toInstitution: "Northbridge University",
    equipmentName: "Bruker 400MHz NMR Spectrometer",
    usagePeriod: "Jul 15–18, 2026",
    usageHours: 8,
    amount: 20000,
    billingDate: "2026-07-20",
    dueDate: "2026-08-19",
    status: "PAID",
    costSharingTerms: "50/50 cost-share on consumables. ₹2,500/hr access fee.",
    relatedBookingId: "BK-EXT-003",
  },
  {
    id: "INV-2026-075",
    reference: "INV-2026-075",
    fromInstitution: "Own Institution",
    toInstitution: "Coastal Research Institute",
    equipmentName: "Zeiss Axio Confocal Microscope",
    usagePeriod: "Jun 10–12, 2026",
    usageHours: 6,
    amount: 7200,
    billingDate: "2026-06-13",
    dueDate: "2026-07-13",
    status: "OVERDUE",
    costSharingTerms: "Standard external access rate ₹1,200/hr.",
    relatedBookingId: "BK-EXT-004",
  },
  {
    id: "INV-2026-070",
    reference: "INV-2026-070",
    fromInstitution: "Own Institution",
    toInstitution: "Northbridge University",
    equipmentName: "Thermo QuantStudio qPCR",
    usagePeriod: "May 22–24, 2026",
    usageHours: 4,
    amount: 3600,
    billingDate: "2026-05-25",
    dueDate: "2026-06-24",
    status: "PAID",
    costSharingTerms: "Flat access fee ₹900/hr.",
    relatedBookingId: "BK-EXT-005",
  },
  {
    id: "INV-2026-068",
    reference: "INV-2026-068",
    fromInstitution: "Own Institution",
    toInstitution: "Westfield Medical Research",
    equipmentName: "Beckman Coulter Ultracentrifuge",
    usagePeriod: "May 5, 2026",
    usageHours: 2,
    amount: 1500,
    billingDate: "2026-05-06",
    dueDate: "2026-06-05",
    status: "PAID",
    costSharingTerms: "Standard external rate ₹750/hr.",
    relatedBookingId: "BK-EXT-006",
  },
  {
    id: "INV-2026-060",
    reference: "INV-2026-060",
    fromInstitution: "Own Institution",
    toInstitution: "Coastal Research Institute",
    equipmentName: "FEI Quanta SEM",
    usagePeriod: "Apr 3–5, 2026",
    usageHours: 10,
    amount: 18000,
    billingDate: "2026-04-06",
    dueDate: "2026-05-06",
    status: "CANCELLED",
    costSharingTerms: "Cancelled due to equipment downtime. No charge.",
    relatedBookingId: "BK-EXT-007",
  },
];

/* ================================================================== */
/*  BILLING STATUS STYLES (added to STATUS_STYLES in ui.jsx separately) */
/* ================================================================== */
const BILL_STATUS_STYLE = {
  DRAFT: "bg-slate-100 text-slate-500 border-slate-200",
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  INVOICED: "bg-blue-50 text-blue-600 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
  OVERDUE: "bg-red-50 text-red-600 border-red-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  APPROVED: "bg-teal-50 text-teal-600 border-teal-200",
};

const USAGE_STATUS_STYLE = {
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  INVOICED: "bg-blue-50 text-blue-600 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-600 border-emerald-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
};

function BillingBadge({ status, map = BILL_STATUS_STYLE }) {
  const cls = map[status] || "bg-slate-100 text-slate-500 border-slate-200";
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${cls}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}

const BILL_FILTERS = ["ALL", "PENDING", "INVOICED", "PAID", "OVERDUE", "CANCELLED"];
const USAGE_FILTERS = ["ALL", "PENDING", "INVOICED", "PAID", "CANCELLED"];

/* ================================================================== */
/*  1. UsageCostView — per-booking usage costs                          */
/* ================================================================== */
export function UsageCostView({ userDept, userRole, userName }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  /* For researcher: only show their own costs */
  const base =
    userRole === "researcher"
      ? DEMO_USAGE_COSTS.filter((r) => r.researcher === "You")
      : userRole === "manager" || userRole === "dept-head"
      ? DEMO_USAGE_COSTS.filter((r) => r.institution === "Own Institution")
      : DEMO_USAGE_COSTS;

  const filtered = base.filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.equipmentName.toLowerCase().includes(q) ||
        r.researcher.toLowerCase().includes(q) ||
        r.department.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = base.reduce((a, r) => a + r.totalCost, 0);
  const paid = base.filter((r) => r.status === "PAID").reduce((a, r) => a + r.totalCost, 0);
  const pending = base.filter((r) => r.status === "PENDING" || r.status === "INVOICED").reduce((a, r) => a + r.totalCost, 0);
  const totalHours = base.reduce((a, r) => a + r.durationHours, 0);

  if (selected) {
    return (
      <UsageCostDetail
        record={selected}
        onBack={() => setSelected(null)}
        userRole={userRole}
      />
    );
  }

  return (
    <div>
      <ViewHeader
        title="Equipment Usage Costs"
        subtitle={
          userRole === "researcher"
            ? "Your equipment usage billing records for the current period."
            : "Usage-based cost records for all equipment in this period. All figures are local demo data — no backend cost API."
        }
      />

      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 mb-5">
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Demo data.</span> No backend cost or billing API endpoint exists.
          Cost rates are illustrative (₹/hour per equipment). In production, these will be populated
          from the billing/cost service when the API becomes available.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Usage Cost" value={fmt(total)} tone="text-slate-700" bg="bg-slate-100" />
        <StatCard icon={CheckCircle2} label="Paid" value={fmt(paid)} tone="text-emerald-600" bg="bg-emerald-50" onClick={() => setFilter("PAID")} />
        <StatCard icon={Clock} label="Pending / Invoiced" value={fmt(pending)} tone="text-amber-600" bg="bg-amber-50" onClick={() => setFilter("PENDING")} />
        <StatCard icon={BarChart2} label="Total Usage Hours" value={`${totalHours.toFixed(1)}h`} tone="text-blue-600" bg="bg-blue-50" />
      </div>

      {/* Filters + search */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search equipment, researcher…"
            className="rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-wrap">
          {USAGE_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} record{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No usage cost records" subtitle="Try adjusting the filter." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                {userRole !== "researcher" && <th className="text-left font-semibold px-5 py-3">Researcher</th>}
                <th className="text-left font-semibold px-5 py-3">Date</th>
                <th className="text-right font-semibold px-5 py-3">Duration</th>
                <th className="text-right font-semibold px-5 py-3">Rate</th>
                <th className="text-right font-semibold px-5 py-3">Total</th>
                <th className="text-left font-semibold px-5 py-3 pl-5">Status</th>
                <th className="text-right font-semibold px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                    r.status === "OVERDUE" ? "bg-red-50/30" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <p className="font-semibold text-slate-800">{r.equipmentName}</p>
                    <p className="text-[11px] text-slate-400">{r.category} · {r.department}</p>
                  </td>
                  {userRole !== "researcher" && (
                    <td className="px-5 py-3.5">
                      <p className="text-sm text-slate-700">{r.researcher}</p>
                      {r.institution !== "Own Institution" && (
                        <p className="text-[11px] text-indigo-500 font-semibold">{r.institution}</p>
                      )}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-xs text-slate-600">{fmtDate(r.date)}</td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-600">{r.durationHours}h</td>
                  <td className="px-5 py-3.5 text-right text-xs text-slate-600">{fmt(r.costRate)}/hr</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{fmt(r.totalCost)}</td>
                  <td className="px-5 py-3.5 pl-5">
                    <BillingBadge status={r.status} map={USAGE_STATUS_STYLE} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight size={14} className="text-slate-400 ml-auto" />
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

/* ── Usage cost detail ── */
function UsageCostDetail({ record: r, onBack, userRole }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Usage Costs
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{r.id}</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{r.equipmentName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{r.category} · {r.department}</p>
          </div>
          <BillingBadge status={r.status} map={USAGE_STATUS_STYLE} />
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CostInfoBox label="Date" value={fmtDate(r.date)} />
          <CostInfoBox label="Session Time" value={`${r.start} – ${r.end}`} />
          <CostInfoBox label="Duration" value={`${r.durationHours} hours`} />
          <CostInfoBox label="Cost Rate" value={`${fmt(r.costRate)} / hr`} />
          <CostInfoBox label="Total Cost" value={fmt(r.totalCost)} highlight />
          <CostInfoBox label="Billing Status" value={<BillingBadge status={r.status} map={USAGE_STATUS_STYLE} />} isJsx />
        </div>

        {userRole !== "researcher" && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Booking Details</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <CostInfoBox label="Researcher" value={r.researcher} />
              <CostInfoBox label="Department" value={r.department} />
              <CostInfoBox label="Institution" value={r.institution} />
              <CostInfoBox label="Booking Reference" value={r.bookingId} mono />
            </div>
          </div>
        )}

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5">Demo Data Notice</p>
          <p className="text-xs text-amber-700">
            Cost rates (₹{r.costRate}/hr) and billing status are frontend-only demo data.
            Real billing will be driven by the backend cost service once the API is available.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  2. DeptCostView — department-wise cost allocation                   */
/* ================================================================== */
export function DeptCostView({ userDept }) {
  const [sortBy, setSortBy] = useState("totalCost");

  const grandTotal = DEMO_DEPT_COSTS.reduce((a, d) => a + d.totalCost, 0);
  const sorted = [...DEMO_DEPT_COSTS].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div>
      <ViewHeader
        title="Department-Wise Cost Allocation"
        subtitle="Usage and shared equipment cost broken down by department. All figures are demo data."
      />

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Institutional Cost" value={fmt(grandTotal)} tone="text-slate-700" bg="bg-slate-100" />
        <StatCard icon={Building2} label="Departments" value={DEMO_DEPT_COSTS.length} tone="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Receipt} label="Total Bookings" value={DEMO_DEPT_COSTS.reduce((a, d) => a + d.bookingCount, 0)} tone="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={HandCoins} label="Shared Equipment Cost" value={fmt(DEMO_DEPT_COSTS.reduce((a, d) => a + d.sharedCost, 0))} tone="text-teal-600" bg="bg-teal-50" />
      </div>

      {/* Sort control */}
      <div className="flex items-center gap-3 mb-5">
        <Filter size={14} className="text-slate-400" />
        <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
        {[
          { id: "totalCost", label: "Total Cost" },
          { id: "usageHours", label: "Usage Hours" },
          { id: "bookingCount", label: "Bookings" },
        ].map((s) => (
          <button
            key={s.id}
            onClick={() => setSortBy(s.id)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              sortBy === s.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Department cards */}
      <div className="space-y-4">
        {sorted.map((d) => {
          const pct = Math.round((d.totalCost / grandTotal) * 100);
          const isCurrentDept = userDept && d.department === userDept;
          return (
            <div
              key={d.department}
              className={`rounded-2xl border bg-white p-5 ${
                isCurrentDept ? "border-blue-300 ring-1 ring-blue-200" : "border-slate-200"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-slate-900">{d.department}</p>
                    {isCurrentDept && (
                      <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Your Dept</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{d.bookingCount} bookings · {d.usageHours}h usage</p>
                </div>
                <p className="text-xl font-extrabold text-slate-900">{fmt(d.totalCost)}</p>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>{pct}% of institutional total</span>
                  <span>{fmt(d.totalCost)}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>

              {/* Cost breakdown */}
              <div className="grid sm:grid-cols-3 gap-3">
                <MiniCostBox label="Usage Cost" value={fmt(d.usageCost)} color="text-blue-600" />
                <MiniCostBox label="Shared Equipment" value={fmt(d.sharedCost)} color="text-teal-600" />
                <MiniCostBox label="Maintenance" value={fmt(d.maintenanceCost)} color="text-orange-600" />
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-slate-400 mt-4 text-center">
        All figures are demo data — no backend cost allocation API exists.
        Real department cost data will come from the cost service API.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  3. SharedEquipmentCostView — shared equipment cost breakdown        */
/* ================================================================== */
export function SharedEquipmentCostView() {
  const [selected, setSelected] = useState(null);

  if (selected) {
    return <SharedEquipmentDetail item={selected} onBack={() => setSelected(null)} />;
  }

  return (
    <div>
      <ViewHeader
        title="Shared Equipment Cost"
        subtitle="Cost breakdown for equipment shared with external institutions. Based on SharingAgreement.costSharingTerms (backend field)."
      />

      <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 mb-5">
        <Info size={14} className="text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700">
          The backend stores cost sharing terms in{" "}
          <code className="font-mono text-[10px]">SharingAgreement.costSharingTerms</code> and usage fees in{" "}
          <code className="font-mono text-[10px]">SharedBooking.usageFee</code>.
          When a dedicated cost reporting API is available, these figures will be loaded from
          <code className="font-mono text-[10px]"> GET /api/sharing/agreements</code>.
          Values shown here are demo data.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={Layers}
          label="Shared Equipment Items"
          value={DEMO_SHARED_EQUIP_COSTS.length}
          tone="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={HandCoins}
          label="Total Shared Revenue"
          value={fmt(DEMO_SHARED_EQUIP_COSTS.reduce((a, e) => a + e.totalUsageCost, 0))}
          tone="text-teal-600"
          bg="bg-teal-50"
        />
      </div>

      <div className="space-y-4">
        {DEMO_SHARED_EQUIP_COSTS.map((item) => (
          <div
            key={item.id}
            onClick={() => setSelected(item)}
            className="rounded-2xl border border-slate-200 bg-white p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <p className="font-bold text-slate-900">{item.equipmentName}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Owned by {item.owningDept} · {item.owningInstitution}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-extrabold text-slate-900">{fmt(item.totalUsageCost)}</p>
                <BillingBadge status={item.status} />
              </div>
            </div>
            <div className="space-y-2">
              {item.shares.map((s) => (
                <div key={s.institution}>
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>{s.institution} ({s.dept})</span>
                    <span className="font-semibold">{fmt(s.amount)} · {s.usageHours}h · {s.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${s.institution === "Own Institution" ? "bg-blue-500" : "bg-indigo-500"}`}
                      style={{ width: `${s.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right">
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 justify-end">
                View detail <ChevronRight size={13} />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SharedEquipmentDetail({ item, onBack }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Shared Equipment Costs
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">{item.id}</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{item.equipmentName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{item.owningDept} · {item.owningInstitution}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-900">{fmt(item.totalUsageCost)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total usage revenue</p>
          </div>
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">
            Cost Allocation by Institution
          </p>
          <div className="space-y-4">
            {item.shares.map((s, i) => (
              <div key={s.institution} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{s.institution}</p>
                    <p className="text-xs text-slate-500">{s.dept}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-extrabold text-slate-900">{fmt(s.amount)}</p>
                    <p className="text-xs text-slate-400">{s.usageHours}h · {s.pct}% share</p>
                  </div>
                </div>
                <div className="h-3 rounded-full bg-slate-200">
                  <div
                    className={`h-full rounded-full ${i === 0 ? "bg-blue-500" : "bg-indigo-500"}`}
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {item.totalUsageCost > 0 && (
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-3">Unallocated</p>
            {(() => {
              const allocated = item.shares.reduce((a, s) => a + s.amount, 0);
              const unalloc = item.totalUsageCost - allocated;
              return unalloc > 0 ? (
                <div className="rounded-xl bg-orange-50 border border-orange-100 p-3">
                  <p className="text-sm font-semibold text-orange-700">
                    {fmt(unalloc)} unallocated ({Math.round((unalloc / item.totalUsageCost) * 100)}%)
                  </p>
                </div>
              ) : (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
                  <p className="text-sm font-semibold text-emerald-700">Fully allocated ✓</p>
                </div>
              );
            })()}
          </div>
        )}

        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wide mb-1.5">Backend Note</p>
          <p className="text-xs text-amber-700">
            Cost sharing terms are stored in{" "}
            <code className="font-mono text-[10px]">SharingAgreement.costSharingTerms</code> and
            usage fees in <code className="font-mono text-[10px]">SharedBooking.usageFee</code>.
            This detail view shows demo-generated values pending API integration.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  4. InterInstitutionBillingView — full billing records              */
/* ================================================================== */
export function InterInstitutionBillingView({ toast }) {
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const filtered = DEMO_BILLING_RECORDS.filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        r.reference.toLowerCase().includes(q) ||
        r.fromInstitution.toLowerCase().includes(q) ||
        r.toInstitution.toLowerCase().includes(q) ||
        r.equipmentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const total = DEMO_BILLING_RECORDS.reduce((a, r) => a + r.amount, 0);
  const paid = DEMO_BILLING_RECORDS.filter((r) => r.status === "PAID").reduce((a, r) => a + r.amount, 0);
  const overdue = DEMO_BILLING_RECORDS.filter((r) => r.status === "OVERDUE").reduce((a, r) => a + r.amount, 0);
  const pending = DEMO_BILLING_RECORDS.filter((r) => ["PENDING", "INVOICED"].includes(r.status)).reduce((a, r) => a + r.amount, 0);

  if (selected) {
    return (
      <BillingDetail
        record={selected}
        onBack={() => setSelected(null)}
        toast={toast}
      />
    );
  }

  return (
    <div>
      <ViewHeader
        title="Inter-Institution Billing"
        subtitle="Billing records for equipment usage by external institutions. No backend billing API — this is demo data."
        action={
          <button
            onClick={() => toast && toast("Export coming when billing API is available.", "info")}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <Download size={13} /> Export
          </button>
        }
      />

      {/* Demo notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 mb-5">
        <Info size={14} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700">
          <span className="font-semibold">Demo data.</span> Backend cost fields confirmed:
          <code className="font-mono text-[10px] mx-1">SharedBooking.usageFee</code> and
          <code className="font-mono text-[10px] mx-1">SharingAgreement.costSharingTerms</code>.
          No dedicated billing API exists yet. Full integration pending API documentation from teammate.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={DollarSign} label="Total Billed" value={fmt(total)} tone="text-slate-700" bg="bg-slate-100" />
        <StatCard icon={CheckCircle2} label="Received (Paid)" value={fmt(paid)} tone="text-emerald-600" bg="bg-emerald-50" onClick={() => setFilter("PAID")} />
        <StatCard icon={Clock} label="Outstanding" value={fmt(pending)} tone="text-amber-600" bg="bg-amber-50" onClick={() => setFilter("PENDING")} />
        <StatCard icon={AlertTriangle} label="Overdue" value={fmt(overdue)} tone="text-red-600" bg="bg-red-50" onClick={() => setFilter("OVERDUE")} />
      </div>

      {/* Overdue alert */}
      {overdue > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 mb-4">
          <AlertTriangle size={15} className="text-red-500 shrink-0" />
          <p className="text-sm font-semibold text-red-700">
            {fmt(overdue)} is overdue from {DEMO_BILLING_RECORDS.filter((r) => r.status === "OVERDUE").length} invoice{DEMO_BILLING_RECORDS.filter((r) => r.status === "OVERDUE").length !== 1 ? "s" : ""}.
          </p>
          <button onClick={() => setFilter("OVERDUE")} className="ml-auto text-xs font-semibold text-red-600 hover:text-red-700 shrink-0">
            View →
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, institution…"
            className="rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 w-60"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 flex-wrap">
          {BILL_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === f ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-slate-400">{filtered.length} invoice{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Billing table */}
      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="No billing records found" subtitle="Try adjusting the filter or search." />
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
              <tr>
                <th className="text-left font-semibold px-5 py-3">Invoice</th>
                <th className="text-left font-semibold px-5 py-3">From → To</th>
                <th className="text-left font-semibold px-5 py-3">Equipment</th>
                <th className="text-left font-semibold px-5 py-3">Billed</th>
                <th className="text-left font-semibold px-5 py-3">Due</th>
                <th className="text-right font-semibold px-5 py-3">Amount</th>
                <th className="text-left font-semibold px-5 py-3 pl-5">Status</th>
                <th className="text-right font-semibold px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className={`cursor-pointer hover:bg-slate-50 transition-colors ${
                    r.status === "OVERDUE" ? "bg-red-50/30" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 font-semibold text-blue-600 font-mono text-xs">{r.reference}</td>
                  <td className="px-5 py-3.5">
                    <p className="text-xs font-semibold text-slate-700">{r.fromInstitution}</p>
                    <p className="text-[11px] text-slate-400">→ {r.toInstitution}</p>
                  </td>
                  <td className="px-5 py-3.5 text-xs text-slate-600 max-w-[160px] truncate">{r.equipmentName}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{fmtDate(r.billingDate)}</td>
                  <td className="px-5 py-3.5 text-xs text-slate-600">{fmtDate(r.dueDate)}</td>
                  <td className="px-5 py-3.5 text-right font-semibold text-slate-800">{fmt(r.amount)}</td>
                  <td className="px-5 py-3.5 pl-5">
                    <BillingBadge status={r.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <ChevronRight size={14} className="text-slate-400 ml-auto" />
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

/* ── Billing detail panel ── */
function BillingDetail({ record: r, onBack, toast }) {
  return (
    <div>
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft size={15} /> Back to Billing Records
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-7 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide font-mono">{r.reference}</p>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">{r.fromInstitution} → {r.toInstitution}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{r.equipmentName}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-extrabold text-slate-900">{fmt(r.amount)}</p>
            <BillingBadge status={r.status} />
          </div>
        </div>

        {r.status === "OVERDUE" && (
          <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
            <AlertTriangle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm font-bold text-red-700">
              Payment overdue — due {fmtDate(r.dueDate)}. Please follow up with {r.toInstitution}.
            </p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CostInfoBox label="Billing Date" value={fmtDate(r.billingDate)} />
          <CostInfoBox label="Due Date" value={fmtDate(r.dueDate)} />
          <CostInfoBox label="Usage Period" value={r.usagePeriod} />
          <CostInfoBox label="Usage Hours" value={`${r.usageHours}h`} />
          <CostInfoBox label="Total Amount" value={fmt(r.amount)} highlight />
          <CostInfoBox label="Related Booking" value={r.relatedBookingId} mono />
        </div>

        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">Cost Sharing Terms</p>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-sm text-slate-700">{r.costSharingTerms || "No terms recorded."}</p>
            <p className="text-[11px] text-slate-400 mt-2">
              Stored in <code className="font-mono">SharingAgreement.costSharingTerms</code> (backend field).
            </p>
          </div>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => toast && toast("Download will be available with billing API integration.", "info")}
            className="flex items-center gap-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors"
          >
            <Download size={14} /> Download Invoice PDF
          </button>
          <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-2.5 flex items-center gap-2">
            <Info size={13} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">Demo data — PDF download requires backend billing API.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  5. MyUsageCostSection — inline in researcher booking history        */
/* ================================================================== */
export function MyUsageCostSection() {
  const myRecords = DEMO_USAGE_COSTS.filter((r) => r.researcher === "You");
  const [selectedId, setSelectedId] = useState(null);

  const total = myRecords.reduce((a, r) => a + r.totalCost, 0);
  const paid = myRecords.filter((r) => r.status === "PAID").reduce((a, r) => a + r.totalCost, 0);
  const pending = myRecords.filter((r) => r.status !== "PAID" && r.status !== "CANCELLED").reduce((a, r) => a + r.totalCost, 0);

  const selected = myRecords.find((r) => r.id === selectedId);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Receipt size={16} className="text-blue-600" />
        <h2 className="text-base font-bold text-slate-900">My Usage Costs</h2>
        <span className="ml-1 text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-100 rounded-full px-2 py-0.5">Demo data</span>
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">Total Usage Cost</p>
          <p className="text-lg font-extrabold text-slate-900">{fmt(total)}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
          <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mb-1">Paid</p>
          <p className="text-lg font-extrabold text-emerald-700">{fmt(paid)}</p>
        </div>
        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3.5">
          <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wide mb-1">Pending</p>
          <p className="text-lg font-extrabold text-amber-700">{fmt(pending)}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
            <tr>
              <th className="text-left font-semibold px-4 py-3">Equipment</th>
              <th className="text-left font-semibold px-4 py-3">Date</th>
              <th className="text-right font-semibold px-4 py-3">Duration</th>
              <th className="text-right font-semibold px-4 py-3">Cost</th>
              <th className="text-left font-semibold px-4 py-3 pl-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {myRecords.map((r) => (
              <tr
                key={r.id}
                onClick={() => setSelectedId(r.id === selectedId ? null : r.id)}
                className="cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 text-xs">{r.equipmentName}</p>
                </td>
                <td className="px-4 py-3 text-xs text-slate-500">{fmtDate(r.date)}</td>
                <td className="px-4 py-3 text-right text-xs text-slate-600">{r.durationHours}h</td>
                <td className="px-4 py-3 text-right text-xs font-semibold text-slate-800">{fmt(r.totalCost)}</td>
                <td className="px-4 py-3 pl-4">
                  <BillingBadge status={r.status} map={USAGE_STATUS_STYLE} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Inline detail */}
      {selected && (
        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50/40 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-bold text-slate-900">{selected.equipmentName}</p>
              <p className="text-xs text-slate-500">{fmtDate(selected.date)} · {selected.start}–{selected.end}</p>
            </div>
            <button onClick={() => setSelectedId(null)} className="text-slate-400 hover:text-slate-600">
              <X size={15} />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-3">
            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Rate</p><p className="text-xs font-semibold text-slate-700">{fmt(selected.costRate)}/hr</p></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Duration</p><p className="text-xs font-semibold text-slate-700">{selected.durationHours}h</p></div>
            <div><p className="text-[10px] text-slate-400 font-bold uppercase">Total</p><p className="text-xs font-bold text-slate-900">{fmt(selected.totalCost)}</p></div>
          </div>
          <p className="text-[10px] text-amber-600 mt-3 flex items-center gap-1">
            <Info size={10} /> Cost rates and status are demo values — not persisted in the backend.
          </p>
        </div>
      )}

      <p className="text-xs text-slate-400 mt-3">
        Cost rates are illustrative (₹/hr per equipment category). Actual billing will be driven by
        the backend cost service when the API is available.
      </p>
    </div>
  );
}

/* ================================================================== */
/*  Shared helper components                                            */
/* ================================================================== */
function CostInfoBox({ label, value, isJsx, highlight, mono }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{label}</p>
      {isJsx
        ? value
        : <p className={`text-sm font-semibold ${highlight ? "text-blue-700 text-base" : "text-slate-700"} ${mono ? "font-mono" : ""}`}>
            {value || "—"}
          </p>
      }
    </div>
  );
}

function MiniCostBox({ label, value, color }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-sm font-bold ${color}`}>{value}</p>
    </div>
  );
}
