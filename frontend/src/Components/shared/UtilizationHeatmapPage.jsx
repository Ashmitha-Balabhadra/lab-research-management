import { useMemo, useState } from "react";
import {
  Gauge, Package, TrendingUp, Clock, AlertTriangle, Target, Lightbulb,
  LayoutGrid, List as ListIcon, ChevronRight, Building2,
} from "lucide-react";
import { Field, inputClass, StatCard, ViewHeader, EmptyState, Modal } from "./ui.jsx";

/* ================================================================== *
 *  Utilization Heatmap & Analytics — shared across Lab Manager,       *
 *  Department Head, and Institution Administrator dashboards.         *
 *                                                                       *
 *  One grid, four "View By" bucket modes (day / week / month / year), *
 *  two scope levels (department roll-up of equipment vs institution   *
 *  roll-up of departments), and a heatmap/table toggle over the same  *
 *  computed dataset — per the design spec.                             *
 *                                                                       *
 *  DEMO DATA NOTE: `DEMO_BOOKINGS` in mockData.js only contains a      *
 *  handful of real reservations, which isn't enough to paint a full    *
 *  heatmap. Where no real booking overlaps a cell, this component      *
 *  falls back to a deterministic "modeled" utilization value (seeded   *
 *  by equipment/department + time bucket, NOT Math.random, so it's     *
 *  stable across renders) purely so the UI has something realistic to  *
 *  show. Cells backed by a real booking are flagged `real: true` and   *
 *  the popover says so; modeled cells are labeled as such. Swap        *
 *  `computeCell` for a real API response when the backend is ready —   *
 *  everything downstream (grid, table, summary, trend) just consumes   *
 *  `{ value, real, usedHrs, availableHrs, bookings }` per cell.        *
 * ================================================================== */

/* ---------------------------------------------------------------- */
/*  Constants                                                        */
/* ---------------------------------------------------------------- */
const DEMO_TODAY = new Date(2026, 7, 15); // anchors "today" to match the rest of the demo dataset (Aug 2026)

const VIEW_BY_OPTIONS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
  { id: "year", label: "Year" },
];
const DAY_HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17]; // operating hours, 8 AM – 6 PM
const WEEKDAYS_SHORT = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const UNDERUTILIZED_THRESHOLD = 30;
const TARGET_UTILIZATION = 75;

/* ---------------------------------------------------------------- */
/*  Date helpers                                                     */
/* ---------------------------------------------------------------- */
function pad2(n) { return String(n).padStart(2, "0"); }
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function daysInMonth(year, monthIdx) { return new Date(year, monthIdx + 1, 0).getDate(); }
function startOfWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + ((day === 0 ? -6 : 1) - day));
  d.setHours(0, 0, 0, 0);
  return d;
}
function isoWeekValue(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad2(weekNo)}`;
}
function mondayFromIsoWeek(value) {
  const [yearStr, weekStr] = value.split("-W");
  const year = Number(yearStr);
  const week = Number(weekStr);
  const mondayOfWeek1 = startOfWeekMonday(new Date(year, 0, 4));
  return addDays(mondayOfWeek1, (week - 1) * 7);
}
function formatHour(h) {
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}
function operatingHours(date) {
  const day = date.getDay();
  return day === 0 || day === 6 ? 4 : 10; // weekend hours are reduced, not closed
}
function overlapHours(aStartMs, aEndMs, bStartMs, bEndMs) {
  const start = Math.max(aStartMs, bStartMs);
  const end = Math.min(aEndMs, bEndMs);
  return Math.max(0, (end - start) / 3600000);
}
function isUsageBooking(b) {
  return b.status === "CONFIRMED" || b.status === "COMPLETED";
}

/* ---------------------------------------------------------------- */
/*  Deterministic "modeled" utilization (demo fallback only)         */
/* ---------------------------------------------------------------- */
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function hourShapeFactor(h) {
  if (h >= 10 && h <= 15) return 1.15;
  if (h === 8 || h === 17) return 0.6;
  return 0.9;
}
function modeledPercent(rowSeed, colKey, factor = 1) {
  const rowBias = (hashStr(rowSeed) % 45) - 8;          // each row has its own "busyness" level
  const noise = (hashStr(`${rowSeed}::${colKey}`) % 30) - 15; // per-cell variance
  const base = 45 + rowBias + noise;
  return Math.max(3, Math.min(97, Math.round(base * factor)));
}

/* ---------------------------------------------------------------- */
/*  Column (x-axis bucket) builders — same grid, 4 bucket modes      */
/* ---------------------------------------------------------------- */
function buildDayColumns(dayValue) {
  const date = dayValue ? new Date(`${dayValue}T00:00:00`) : new Date(DEMO_TODAY);
  const dayStart = new Date(date); dayStart.setHours(0, 0, 0, 0);
  const columns = DAY_HOURS.map((h) => {
    const start = new Date(dayStart); start.setHours(h, 0, 0, 0);
    const end = new Date(dayStart); end.setHours(h + 1, 0, 0, 0);
    return {
      key: `${dayValue || "today"}-${h}`, label: formatHour(h), start, end, isHourly: true,
      meta: `${dayStart.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}, ${formatHour(h)}–${formatHour(h + 1)}`,
    };
  });
  return {
    columns,
    label: dayStart.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    rangeStart: dayStart, rangeEnd: addDays(dayStart, 1),
  };
}
function buildWeekColumns(weekValue) {
  const monday = mondayFromIsoWeek(weekValue || isoWeekValue(DEMO_TODAY));
  const columns = WEEKDAYS_SHORT.map((label, i) => {
    const start = addDays(monday, i); start.setHours(0, 0, 0, 0);
    const end = addDays(start, 1);
    return {
      key: `${weekValue || isoWeekValue(DEMO_TODAY)}-${i}`, label, start, end, isHourly: false,
      meta: start.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
    };
  });
  return {
    columns,
    label: `Week of ${monday.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`,
    rangeStart: monday, rangeEnd: addDays(monday, 7),
  };
}
function buildMonthColumns(monthValue) {
  const value = monthValue || `${DEMO_TODAY.getFullYear()}-${pad2(DEMO_TODAY.getMonth() + 1)}`;
  const [y, m] = value.split("-").map(Number);
  const total = daysInMonth(y, m - 1);
  const columns = [];
  for (let d = 1; d <= total; d++) {
    const start = new Date(y, m - 1, d);
    const end = addDays(start, 1);
    columns.push({
      key: `${value}-${d}`, label: String(d), start, end, isHourly: false,
      meta: start.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }),
    });
  }
  return { columns, label: `${MONTH_NAMES[m - 1]} ${y}`, rangeStart: new Date(y, m - 1, 1), rangeEnd: new Date(y, m, 1) };
}
function buildYearColumns(year) {
  const y = year || DEMO_TODAY.getFullYear();
  const columns = MONTH_SHORT.map((label, i) => {
    const start = new Date(y, i, 1);
    const end = new Date(y, i + 1, 1);
    return { key: `${y}-${i}`, label, start, end, isHourly: false, meta: `${MONTH_NAMES[i]} ${y}` };
  });
  return { columns, label: `${y}`, rangeStart: new Date(y, 0, 1), rangeEnd: new Date(y + 1, 0, 1) };
}
function last6MonthColumns() {
  const columns = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(DEMO_TODAY.getFullYear(), DEMO_TODAY.getMonth() - i, 1);
    const start = d;
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    columns.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_SHORT[d.getMonth()], start, end, isHourly: false, meta: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
  }
  return columns;
}

/* ---------------------------------------------------------------- */
/*  Cell computation — real bookings first, modeled fallback second  */
/* ---------------------------------------------------------------- */
function availableHoursForRange(start, end, isHourly) {
  if (isHourly) return 1;
  let hrs = 0;
  let d = new Date(start);
  while (d < end) { hrs += operatingHours(d); d = addDays(d, 1); }
  return hrs;
}
function computeCell({ col, equipmentIds, bookings, rowSeed }) {
  const availableHrs = availableHoursForRange(col.start, col.end, col.isHourly);
  if (availableHrs <= 0) return { value: null, real: false, availableHrs: 0, usedHrs: 0, bookings: [] };

  const startMs = col.start.getTime(), endMs = col.end.getTime();
  const matches = bookings.filter(
    (b) => equipmentIds.includes(b.equipmentId) && isUsageBooking(b) &&
      overlapHours(new Date(b.start).getTime(), new Date(b.end).getTime(), startMs, endMs) > 0
  );
  const usedHrsReal = matches.reduce(
    (sum, b) => sum + overlapHours(new Date(b.start).getTime(), new Date(b.end).getTime(), startMs, endMs), 0
  );

  if (usedHrsReal > 0) {
    return { value: Math.round(Math.min(100, (usedHrsReal / availableHrs) * 100)), real: true, availableHrs, usedHrs: +usedHrsReal.toFixed(1), bookings: matches };
  }
  const weekendFactor = col.start.getDay() === 0 || col.start.getDay() === 6 ? 0.5 : 1;
  const hourFactor = col.isHourly ? hourShapeFactor(col.start.getHours()) : 1;
  const pct = modeledPercent(rowSeed, col.key, weekendFactor * hourFactor);
  return { value: pct, real: false, availableHrs, usedHrs: +(availableHrs * pct / 100).toFixed(1), bookings: [] };
}

/* ---------------------------------------------------------------- */
/*  Heat color scale                                                  */
/* ---------------------------------------------------------------- */
function heatColor(v) {
  if (v === null || v === undefined) return "bg-slate-50";
  if (v >= 85) return "bg-blue-600";
  if (v >= 65) return "bg-blue-400";
  if (v >= 40) return "bg-blue-200";
  if (v >= 20) return "bg-blue-100";
  return "bg-slate-100";
}
function heatText(v) { return v !== null && v !== undefined && v >= 65 ? "text-white" : "text-slate-500"; }

/* ---------------------------------------------------------------- */
/*  Role → scope configuration                                       */
/* ---------------------------------------------------------------- */
function useScopeConfig(role, user, departments) {
  return useMemo(() => {
    if (role === "institution-admin") {
      // Institution Admin gets a real "All Departments" option plus every department, in one dropdown.
      return { options: ["ALL", ...departments], locked: false, showBenchmark: true };
    }
    // Manager & Department Head are scoped to their own department only.
    const ownDept = user?.department || departments[0] || "";
    return { options: [ownDept], locked: true, showBenchmark: role === "department-head" };
  }, [role, user, departments]);
}

/* ================================================================== */
/*  Main component                                                     */
/* ================================================================== */
export default function UtilizationHeatmapPage({ role = "manager", user, equipment, bookings, toast }) {
  const activeEquipment = useMemo(() => equipment.filter((e) => e.status !== "RETIRED"), [equipment]);
  const departments = useMemo(() => [...new Set(activeEquipment.map((e) => e.department))].sort(), [activeEquipment]);
  const categories = useMemo(() => [...new Set(activeEquipment.map((e) => e.category))].sort(), [activeEquipment]);
  const scopeConfig = useScopeConfig(role, user, departments);
  const defaultDept = scopeConfig.options[0] || "";

  // "Applied" filters drive the grid; "draft" filters are edited in the bar and committed via Apply Filters.
  const [applied, setApplied] = useState({
    department: defaultDept, category: "ALL", viewBy: "month",
    dayValue: "", weekValue: isoWeekValue(DEMO_TODAY),
    monthValue: `${DEMO_TODAY.getFullYear()}-${pad2(DEMO_TODAY.getMonth() + 1)}`, year: DEMO_TODAY.getFullYear(),
  });
  const [draft, setDraft] = useState(applied);
  const setDraftField = (field) => (value) => setDraft((f) => ({ ...f, [field]: value }));

  const [display, setDisplay] = useState("heatmap"); // "heatmap" | "table"
  const [cellModal, setCellModal] = useState(null);
  const [trendModal, setTrendModal] = useState(null);

  const applyFilters = () => {
    setApplied(draft);
    setCellModal(null);
    toast?.("Filters applied.", "info");
  };
  const drillIntoDepartment = (deptName) => {
    const next = { ...applied, department: deptName };
    setApplied(next);
    setDraft(next);
    toast?.(`Viewing ${deptName} department.`, "info");
  };

  /* ---- columns for the selected View By ---- */
  const grid = useMemo(() => {
    if (applied.viewBy === "day") return buildDayColumns(applied.dayValue);
    if (applied.viewBy === "week") return buildWeekColumns(applied.weekValue);
    if (applied.viewBy === "year") return buildYearColumns(applied.year);
    return buildMonthColumns(applied.monthValue);
  }, [applied.viewBy, applied.dayValue, applied.weekValue, applied.monthValue, applied.year]);

  /* ---- rows: equipment (a single department) or departments (institution-wide "ALL") ---- */
  const rows = useMemo(() => {
    if (applied.department === "ALL") {
      return departments.map((d) => ({
        id: d, name: d, kind: "department",
        equipmentIds: activeEquipment.filter((e) => e.department === d && (applied.category === "ALL" || e.category === applied.category)).map((e) => e.id),
      }));
    }
    return activeEquipment
      .filter((e) => e.department === applied.department && (applied.category === "ALL" || e.category === applied.category))
      .map((e) => ({ id: e.id, name: e.name, kind: "equipment", equipmentIds: [e.id], equipment: e }));
  }, [applied.department, applied.category, departments, activeEquipment]);

  /* ---- computed cells per row ---- */
  const rowsWithCells = useMemo(
    () => rows.map((row) => ({
      ...row,
      cells: grid.columns.map((col) => ({ col, ...computeCell({ col, equipmentIds: row.equipmentIds, bookings, rowSeed: row.id }) })),
    })),
    [rows, grid.columns, bookings]
  );

  /* ---- summary stats, derived straight from the grid ---- */
  const stats = useMemo(() => {
    const flat = rowsWithCells.flatMap((r) => r.cells).filter((c) => c.value !== null);
    const avg = flat.length ? Math.round(flat.reduce((a, c) => a + c.value, 0) / flat.length) : 0;
    const totalAvailable = flat.reduce((a, c) => a + c.availableHrs, 0);
    const totalUsed = flat.reduce((a, c) => a + c.usedHrs, 0);
    let peak = null, quiet = null;
    flat.forEach((c) => {
      if (!peak || c.value > peak.value) peak = c;
      if (!quiet || c.value < quiet.value) quiet = c;
    });
    const rowAverages = rowsWithCells.map((r) => {
      const vals = r.cells.filter((c) => c.value !== null);
      const rowAvg = vals.length ? Math.round(vals.reduce((a, c) => a + c.value, 0) / vals.length) : 0;
      const used = vals.reduce((a, c) => a + c.usedHrs, 0);
      const avail = vals.reduce((a, c) => a + c.availableHrs, 0);
      return { ...r, avg: rowAvg, usedHrs: +used.toFixed(1), availableHrs: +avail.toFixed(1) };
    }).sort((a, b) => b.avg - a.avg);
    const idleCount = rowAverages.filter((r) => r.avg < UNDERUTILIZED_THRESHOLD).length;
    return { avg, totalAvailable: Math.round(totalAvailable), totalUsed: Math.round(totalUsed), peak, quiet, rowAverages, idleCount };
  }, [rowsWithCells]);

  const busiest = stats.rowAverages.slice(0, 3);
  const idle = [...stats.rowAverages].sort((a, b) => a.avg - b.avg).slice(0, 3);
  const bottleneck = stats.rowAverages.find((r) => r.avg >= 85);
  const benchmark = 65; // synthetic institution-wide benchmark, for role comparison context

  /* ---- trend (equipment rows only): last 6 months, independent of View By ---- */
  const openTrend = (row) => {
    if (row.kind === "department") { drillIntoDepartment(row.id); return; }
    const cols = last6MonthColumns();
    const points = cols.map((col) => ({ label: col.label, ...computeCell({ col, equipmentIds: row.equipmentIds, bookings, rowSeed: row.id }) }));
    setTrendModal({ row, points });
  };

  const scopeValueLabel = applied.department === "ALL" ? "All Departments" : applied.department;

  return (
    <div>
      <ViewHeader title="Utilization Heatmap & Analytics" subtitle="Identify peak usage hours, idle time, and underutilized equipment." />

      {/* ---- Filter bar ---- */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 mb-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Field label="Department">
            {scopeConfig.locked ? (
              <input value={draft.department} disabled className={`${inputClass()} bg-slate-50 text-slate-500`} />
            ) : (
              <select value={draft.department} onChange={(e) => setDraftField("department")(e.target.value)} className={inputClass()}>
                <option value="ALL">All Departments</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            )}
          </Field>

          <Field label="Equipment">
            <select value={draft.category} onChange={(e) => setDraftField("category")(e.target.value)} className={inputClass()}>
              <option value="ALL">All Equipment</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="View By">
            <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
              {VIEW_BY_OPTIONS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setDraftField("viewBy")(v.id)}
                  className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${draft.viewBy === v.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </Field>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <Field label="Date / Period">
            {draft.viewBy === "day" && (
              <input type="date" value={draft.dayValue} onChange={(e) => e.target.value && setDraftField("dayValue")(e.target.value)} className={inputClass()} />
            )}
            {draft.viewBy === "week" && (
              <input type="week" value={draft.weekValue} onChange={(e) => e.target.value && setDraftField("weekValue")(e.target.value)} className={inputClass()} />
            )}
            {draft.viewBy === "month" && (
              <input type="month" value={draft.monthValue} onChange={(e) => e.target.value && setDraftField("monthValue")(e.target.value)} className={inputClass()} />
            )}
            {draft.viewBy === "year" && (
              <select value={draft.year} onChange={(e) => setDraftField("year")(Number(e.target.value))} className={`${inputClass()} max-w-full`}>
                {[DEMO_TODAY.getFullYear() - 2, DEMO_TODAY.getFullYear() - 1, DEMO_TODAY.getFullYear(), DEMO_TODAY.getFullYear() + 1].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}
          </Field>

          <div className="sm:col-span-2 lg:col-span-2 flex justify-end">
            <button
              onClick={applyFilters}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-6 py-2.5 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Package} title="No equipment in this scope yet" />
      ) : (
        <>
          {/* ---- Summary cards ---- */}
          <div className={`grid sm:grid-cols-2 ${scopeConfig.showBenchmark ? "lg:grid-cols-5" : "lg:grid-cols-4"} gap-4 mb-6`}>
            <StatCard icon={Gauge} label="Average Utilization" value={`${stats.avg}%`} tone="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={TrendingUp} label="Highest Utilized" value={busiest[0] ? `${busiest[0].name.split(" ").slice(0, 2).join(" ")} (${busiest[0].avg}%)` : "—"} tone="text-emerald-600" bg="bg-emerald-50" />
            <StatCard icon={Clock} label="Lowest Utilized" value={idle[0] ? `${idle[0].name.split(" ").slice(0, 2).join(" ")} (${idle[0].avg}%)` : "—"} tone="text-indigo-600" bg="bg-indigo-50" />
            <StatCard icon={AlertTriangle} label="Idle Equipment Alert" value={`${stats.idleCount} below ${UNDERUTILIZED_THRESHOLD}%`} tone="text-amber-600" bg="bg-amber-50" />
            {scopeConfig.showBenchmark && (
              <StatCard icon={Building2} label="Vs. Institution Benchmark" value={`${stats.avg - benchmark >= 0 ? "+" : ""}${stats.avg - benchmark}%`} tone={stats.avg >= benchmark ? "text-emerald-600" : "text-amber-600"} bg={stats.avg >= benchmark ? "bg-emerald-50" : "bg-amber-50"} />
            )}
          </div>

          {/* ---- Heatmap / Table ---- */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
              <h2 className="text-sm font-bold text-slate-900">Equipment Utilization Rate (%)</h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{grid.label} · {scopeValueLabel}</span>
                <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
                  <button onClick={() => setDisplay("heatmap")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${display === "heatmap" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    <LayoutGrid size={13} /> Heatmap
                  </button>
                  <button onClick={() => setDisplay("table")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${display === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                    <ListIcon size={13} /> Table
                  </button>
                </div>
              </div>
            </div>

            {display === "heatmap" ? (
              <>
                <div className="overflow-x-auto mt-4">
                  <div className="min-w-[640px]">
                    <div className="grid gap-1.5 items-center" style={{ gridTemplateColumns: `176px repeat(${grid.columns.length}, minmax(30px,1fr)) 64px` }}>
                      <div />
                      {grid.columns.map((c, i) => (
                        <div key={i} className="text-center text-[10px] font-semibold text-slate-400">{c.label}</div>
                      ))}
                      <div className="text-center text-[10px] font-semibold text-slate-400">Avg</div>

                      {rowsWithCells.map((row) => {
                        const rowAvg = stats.rowAverages.find((r) => r.id === row.id)?.avg ?? 0;
                        return (
                          <>
                            <button
                              key={`${row.id}-label`}
                              onClick={() => openTrend(row)}
                              title={row.kind === "department" ? `View ${row.name} department` : `View utilization trend for ${row.name}`}
                              className="text-left text-xs font-semibold text-slate-700 hover:text-blue-600 truncate flex items-center gap-1 group"
                            >
                              <span className="truncate">{row.name}</span>
                              <ChevronRight size={12} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                            {row.cells.map((cell, ci) => (
                              <button
                                key={ci}
                                onClick={() => setCellModal({ row, cell })}
                                title={`${cell.col.meta} — ${cell.value ?? "no data"}%`}
                                className={`h-8 rounded-md flex items-center justify-center text-[10px] font-bold transition-transform hover:scale-105 ${heatColor(cell.value)} ${heatText(cell.value)}`}
                              >
                                {cell.value !== null ? cell.value : "–"}
                              </button>
                            ))}
                            <span className="text-center text-xs font-bold text-slate-700">{rowAvg}%</span>
                          </>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-400">
                  <span>Low</span>
                  <span className="h-3 w-3 rounded bg-slate-100" />
                  <span className="h-3 w-3 rounded bg-blue-100" />
                  <span className="h-3 w-3 rounded bg-blue-200" />
                  <span className="h-3 w-3 rounded bg-blue-400" />
                  <span className="h-3 w-3 rounded bg-blue-600" />
                  <span>High</span>
                  <span className="ml-4">Click a cell for details · click a row name for its trend{applied.department === "ALL" ? " or to drill in" : ""}.</span>
                </div>
              </>
            ) : (
              <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
                    <tr>
                      <th className="text-left font-semibold px-4 py-2.5">{applied.department === "ALL" ? "Department" : "Equipment"}</th>
                      <th className="text-right font-semibold px-4 py-2.5">Utilization %</th>
                      <th className="text-right font-semibold px-4 py-2.5">Used Hrs</th>
                      <th className="text-right font-semibold px-4 py-2.5">Idle Hrs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.rowAverages.map((r) => (
                      <tr key={r.id}>
                        <td className="px-4 py-2.5">
                          <button onClick={() => openTrend(r)} className="font-semibold text-slate-700 hover:text-blue-600 text-left">{r.name}</button>
                        </td>
                        <td className={`px-4 py-2.5 text-right font-bold ${r.avg < UNDERUTILIZED_THRESHOLD ? "text-amber-600" : "text-slate-700"}`}>{r.avg}%</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{r.usedHrs}</td>
                        <td className="px-4 py-2.5 text-right text-slate-600">{Math.max(0, +(r.availableHrs - r.usedHrs).toFixed(1))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---- Busiest / Idle ---- */}
          <div className="mt-6 grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5"><Gauge size={15} className="text-emerald-600" /> Busiest {applied.department === "ALL" ? "Departments" : "Equipment"}</h3>
              <p className="text-[11px] text-slate-400 mb-4">Share of available time actually booked, this period.</p>
              <div className="space-y-3">
                {busiest.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <p className="text-sm text-slate-700">{r.name}</p>
                    <span className="text-sm font-extrabold text-emerald-600">{r.avg}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5"><AlertTriangle size={15} className="text-amber-500" /> Idle / Underutilized</h3>
              <p className="text-[11px] text-slate-400 mb-4">Below {UNDERUTILIZED_THRESHOLD}% of available time booked.</p>
              <div className="space-y-3">
                {idle.map((r) => (
                  <div key={r.id} className="flex items-center justify-between">
                    <p className="text-sm text-slate-700">{r.name}</p>
                    <span className={`text-sm font-extrabold ${r.avg < UNDERUTILIZED_THRESHOLD ? "text-amber-600" : "text-slate-500"}`}>{r.avg}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ---- Target vs Actual ---- */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5"><Target size={15} className="text-blue-600" /> Target vs Actual Utilization</h3>
            <div className="flex flex-wrap items-center gap-8">
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Actual</p><p className="text-2xl font-extrabold text-slate-900">{stats.avg}%</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Target</p><p className="text-2xl font-extrabold text-slate-900">{TARGET_UTILIZATION}%</p></div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-wide">Status</p>
                <p className={`text-sm font-bold ${stats.avg - TARGET_UTILIZATION >= 0 ? "text-emerald-600" : "text-amber-600"}`}>
                  {stats.avg === TARGET_UTILIZATION ? "On target" : stats.avg > TARGET_UTILIZATION ? `${stats.avg - TARGET_UTILIZATION}% above target` : `${TARGET_UTILIZATION - stats.avg}% below target`}
                </p>
              </div>
              <div className="flex-1 min-w-[160px]">
                <div className="h-2.5 rounded-full bg-slate-100 relative overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(stats.avg, 100)}%` }} />
                  <div className="absolute top-0 h-full w-0.5 bg-slate-900" style={{ left: `${Math.min(TARGET_UTILIZATION, 100)}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* ---- Summary strip (same numbers, export/report-ready shape) ---- */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4">Summary — {grid.label}, {scopeValueLabel}</h3>
            <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-4 text-sm">
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Average Utilization</p><p className="font-bold text-slate-800 mt-0.5">{stats.avg}%</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Highest Utilized</p><p className="font-bold text-slate-800 mt-0.5">{busiest[0] ? `${busiest[0].name} (${busiest[0].avg}%)` : "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Lowest Utilized</p><p className="font-bold text-slate-800 mt-0.5">{idle[0] ? `${idle[0].name} (${idle[0].avg}%)` : "—"}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Total Available / Used Hrs</p><p className="font-bold text-slate-800 mt-0.5">{stats.totalAvailable} / {stats.totalUsed}</p></div>
              <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Idle Equipment Alert</p><p className="font-bold text-amber-600 mt-0.5">{stats.idleCount} below {UNDERUTILIZED_THRESHOLD}%</p></div>
            </div>
          </div>

          {/* ---- Insights ---- */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-1.5"><Lightbulb size={15} className="text-amber-500" /> Insights</h3>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-semibold text-slate-800 shrink-0">Peak usage period:</span> {stats.peak ? `${stats.peak.col.meta} (${stats.peak.value}% utilized)` : "Not enough data yet."}</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-800 shrink-0">Most utilized:</span> {busiest[0] ? `${busiest[0].name} (${busiest[0].avg}%)` : "Not enough data yet."}</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-800 shrink-0">Most underutilized:</span> {idle[0] ? `${idle[0].name} (${idle[0].avg}%)` : "Not enough data yet."}</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-800 shrink-0">Possible bottleneck:</span> {bottleneck ? `${bottleneck.name} is running at ${bottleneck.avg}% — consider a backup unit or extended hours.` : "Nothing is currently over-booked."}</li>
              <li className="flex gap-2"><span className="font-semibold text-slate-800 shrink-0">Scheduling opportunity:</span> {stats.quiet ? `${stats.quiet.col.meta} sees the lowest demand (${stats.quiet.value}%) — good for maintenance or training.` : "Not enough data yet."}</li>
            </ul>
          </div>
        </>
      )}

      {/* ---- Cell drill-down popover ---- */}
      {cellModal && (
        <Modal title={cellModal.row.name} subtitle={cellModal.cell.col.meta} onClose={() => setCellModal(null)}>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <span className="text-slate-500">Utilization</span>
              <span className="text-lg font-extrabold text-slate-900">{cellModal.cell.value ?? "—"}%</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Used {cellModal.cell.usedHrs} hrs of {cellModal.cell.availableHrs} hrs available</span>
              <span className={`font-semibold ${cellModal.cell.real ? "text-emerald-600" : "text-slate-400"}`}>{cellModal.cell.real ? "From booking data" : "Modeled (demo)"}</span>
            </div>
            {cellModal.cell.bookings.length > 0 ? (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-700 mb-2">Bookings in this window</p>
                <div className="space-y-2">
                  {cellModal.cell.bookings.map((b) => (
                    <div key={b.id} className="rounded-lg border border-slate-200 px-3 py-2 text-xs">
                      <p className="font-semibold text-slate-800">{b.id} — {b.researcher}</p>
                      <p className="text-slate-500">{new Date(b.start).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} – {new Date(b.end).toLocaleString(undefined, { hour: "numeric", minute: "2-digit" })}</p>
                      <p className="text-slate-500 mt-0.5">{b.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 pt-2 border-t border-slate-100">No individual bookings recorded for this window — shown as a modeled estimate for demo purposes. Connect live booking data to replace this.</p>
            )}
          </div>
        </Modal>
      )}

      {/* ---- Trend drill-down (equipment rows) ---- */}
      {trendModal && (
        <Modal title={trendModal.row.name} subtitle="Utilization trend — last 6 months" onClose={() => setTrendModal(null)} wide>
          <TrendChart points={trendModal.points} />
        </Modal>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- */
/*  Tiny inline trend chart — no chart library dependency needed     */
/* ---------------------------------------------------------------- */
function TrendChart({ points }) {
  const width = 560, height = 180, pad = 28;
  const stepX = (width - pad * 2) / (points.length - 1 || 1);
  const y = (v) => height - pad - ((v ?? 0) / 100) * (height - pad * 2);
  const coords = points.map((p, i) => [pad + i * stepX, y(p.value)]);
  const path = coords.map(([x, py], i) => `${i === 0 ? "M" : "L"}${x},${py}`).join(" ");

  const trendUp = points.length > 1 && (points[points.length - 1].value ?? 0) >= (points[0].value ?? 0);

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44">
        {[0, 25, 50, 75, 100].map((g) => (
          <line key={g} x1={pad} x2={width - pad} y1={y(g)} y2={y(g)} stroke="#e2e8f0" strokeWidth="1" />
        ))}
        <path d={path} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map(([x, py], i) => (
          <circle key={i} cx={x} cy={py} r="4" fill={points[i].real ? "#2563eb" : "#93c5fd"} stroke="white" strokeWidth="1.5" />
        ))}
        {coords.map(([x, py], i) => (
          <text key={i} x={x} y={py - 10} textAnchor="middle" fontSize="10" fontWeight="700" fill="#334155">{points[i].value ?? "–"}%</text>
        ))}
        {points.map((p, i) => (
          <text key={i} x={pad + i * stepX} y={height - 6} textAnchor="middle" fontSize="10" fill="#94a3b8">{p.label}</text>
        ))}
      </svg>
      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-slate-400">
          <span className="h-2 w-2 rounded-full bg-blue-600" /> From booking data
          <span className="h-2 w-2 rounded-full bg-blue-300 ml-3" /> Modeled (demo)
        </span>
        <span className={`font-semibold ${trendUp ? "text-emerald-600" : "text-amber-600"}`}>
          {trendUp ? "Trending up" : "Trending down"} over the last 6 months
        </span>
      </div>
    </div>
  );
}
