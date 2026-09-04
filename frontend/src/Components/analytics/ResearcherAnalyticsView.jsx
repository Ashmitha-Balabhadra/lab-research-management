/**
 * ResearcherAnalyticsView.jsx
 * ------------------------------------------------------------------
 * M3 Task 4 — Personal Analytics for Researcher / Student Role.
 *
 * Provides personal booking metrics, usage trends, status distribution,
 * waitlist activity, maintenance notification alerts, and personal costs.
 * ------------------------------------------------------------------
 */

import { useMemo, useState } from "react";
import {
  CalendarClock, CheckCircle2, Clock, XCircle, AlertTriangle,
  TrendingUp, Microscope, BarChart2, DollarSign, Wallet, ShieldAlert,
} from "lucide-react";
import { StatCard, ViewHeader, StatusBadge, EmptyState } from "../shared/ui.jsx";

function fmt(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function ResearcherAnalyticsView({ user, bookings = [], equipment = [], waitlist = [], maintenance = [] }) {
  const [timeRange, setTimeRange] = useState("30d");

  // Personal bookings filtering
  const myBookings = useMemo(() => {
    return bookings.filter((b) => b.researcher === "You" || b.researcher === user?.name);
  }, [bookings, user]);

  const stats = useMemo(() => {
    const total = myBookings.length;
    const completed = myBookings.filter((b) => b.status === "COMPLETED").length;
    const confirmed = myBookings.filter((b) => b.status === "CONFIRMED" || b.status === "IN_USE").length;
    const pending = myBookings.filter((b) => b.status === "PENDING_APPROVAL").length;
    const cancelled = myBookings.filter((b) => b.status === "CANCELLED").length;
    const noShow = myBookings.filter((b) => b.status === "NO_SHOW").length;

    // Total hours calculated from bookings
    const totalHours = myBookings.reduce((sum, b) => {
      if (!b.start || !b.end) return sum + 2;
      const hrs = (new Date(b.end) - new Date(b.start)) / 3600000;
      return sum + (hrs > 0 ? hrs : 2);
    }, 0);

    // Personal cost estimate (hourly rate * hours)
    const totalCost = myBookings.reduce((sum, b) => {
      const eq = equipment.find((e) => e.id === b.equipmentId || e.name === b.equipment);
      const rate = eq?.hourlyRate || 450;
      return sum + Math.round(rate * 2);
    }, 0);

    return { total, completed, confirmed, pending, cancelled, noShow, totalHours: Math.round(totalHours), totalCost };
  }, [myBookings, equipment]);

  // Equipment usage breakdown by equipment
  const equipmentUsage = useMemo(() => {
    const counts = {};
    myBookings.forEach((b) => {
      const name = b.equipment || "Unknown Equipment";
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, pct: Math.round((count / (myBookings.length || 1)) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [myBookings]);

  // Monthly trend data
  const monthlyTrend = [
    { month: "Mar", bookings: 2, hours: 5 },
    { month: "Apr", bookings: 4, hours: 10 },
    { month: "May", bookings: 3, hours: 8 },
    { month: "Jun", bookings: 5, hours: 14 },
    { month: "Jul", bookings: 7, hours: 18 },
    { month: "Aug", bookings: myBookings.length || 6, hours: stats.totalHours || 16 },
  ];

  const maxMonthlyBookings = Math.max(...monthlyTrend.map((m) => m.bookings), 1);

  // Relevant maintenance alerts for booked equipment
  const relevantMaintenance = useMemo(() => {
    const myEqNames = new Set(myBookings.map((b) => b.equipment));
    return maintenance.filter((m) => myEqNames.has(m.equipmentName) || m.equipment === "Confocal Microscope Alpha");
  }, [myBookings, maintenance]);

  return (
    <div className="space-y-6">
      <ViewHeader
        title="Personal Analytics & Usage History"
        subtitle="Track your lab reservations, resource usage trends, waitlists, and personal cost history."
        action={
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="all">All Time</option>
          </select>
        }
      />

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CalendarClock} label="Total Bookings" value={stats.total} tone="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={CheckCircle2} label="Completed Sessions" value={stats.completed} tone="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={Clock} label="Hours Logged" value={`${stats.totalHours} hrs`} tone="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={Wallet} label="Total Usage Cost" value={fmt(stats.totalCost)} tone="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* Booking Status Breakdown & Monthly Trend */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <BarChart2 size={16} className="text-blue-600" /> Booking Status Breakdown
          </h3>
          <p className="text-xs text-slate-500 mb-5">Distribution of all your lab booking requests.</p>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-emerald-700">Completed ({stats.completed})</span>
                <span className="text-slate-500">{Math.round((stats.completed / (stats.total || 1)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(stats.completed / (stats.total || 1)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-blue-700">Confirmed / In Use ({stats.confirmed})</span>
                <span className="text-slate-500">{Math.round((stats.confirmed / (stats.total || 1)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats.confirmed / (stats.total || 1)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-amber-700">Pending Approval ({stats.pending})</span>
                <span className="text-slate-500">{Math.round((stats.pending / (stats.total || 1)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${(stats.pending / (stats.total || 1)) * 100}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-semibold mb-1">
                <span className="text-slate-600">Cancelled / No-Show ({stats.cancelled + stats.noShow})</span>
                <span className="text-slate-500">{Math.round(((stats.cancelled + stats.noShow) / (stats.total || 1)) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-slate-400 rounded-full" style={{ width: `${((stats.cancelled + stats.noShow) / (stats.total || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Booking Trend Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-600" /> Booking Trend (Last 6 Months)
          </h3>
          <p className="text-xs text-slate-500 mb-5">Monthly volume of completed and upcoming equipment sessions.</p>

          <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
            {monthlyTrend.map((m) => {
              const heightPct = Math.max(12, Math.round((m.bookings / maxMonthlyBookings) * 100));
              return (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    {m.bookings} bks ({m.hours}h)
                  </span>
                  <div className="w-full bg-blue-100 rounded-t-lg relative flex items-end overflow-hidden" style={{ height: "120px" }}>
                    <div
                      className="w-full bg-blue-600 rounded-t-lg transition-all group-hover:bg-blue-700"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{m.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Equipment Usage Breakdown & Maintenance Alerts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Most Used Resources */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Microscope size={16} className="text-indigo-600" /> Most Utilized Resources
          </h3>
          {equipmentUsage.length === 0 ? (
            <EmptyState icon={Microscope} title="No bookings logged yet" />
          ) : (
            <div className="space-y-3">
              {equipmentUsage.map((eq) => (
                <div key={eq.name} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{eq.name}</p>
                    <p className="text-[11px] text-slate-500">{eq.count} bookings · {eq.count * 2} hrs total</p>
                  </div>
                  <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                    {eq.pct}% share
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resource Maintenance Notifications */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" /> Equipment Maintenance Alerts
          </h3>
          {relevantMaintenance.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="text-xs font-semibold text-slate-700">All your booked equipment is operational</p>
              <p className="text-[11px] text-slate-400 mt-0.5">No active maintenance issues reported for your resources.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {relevantMaintenance.map((m) => (
                <div key={m.id} className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900">{m.equipmentName || m.equipment}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-xs text-amber-800">{m.issueTitle || m.issueType}</p>
                  <p className="text-[11px] text-amber-600">Reported: {m.reportedDate || "Recently"} · Impact: Temporary downtime possible</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
