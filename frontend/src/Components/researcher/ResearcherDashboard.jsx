import { useEffect, useState } from "react";
import { Beaker, CalendarClock, Clock3, ListChecks, ArrowRight } from "lucide-react";
import { equipmentApi } from "../../api/equipmentApi";
import { bookingApi } from "../../api/bookingApi";
import { waitlistApi } from "../../api/waitlistApi";
import { notificationApi } from "../../api/notificationApi";
import { useAuth } from "../../context/AuthContext";

export function ResearcherDashboard({ onNavigate, toast }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availableCount, setAvailableCount] = useState(0);
  const [upcoming, setUpcoming] = useState([]);
  const [waitlistCount, setWaitlistCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      equipmentApi.search({ status: "AVAILABLE", institutionId: user?.institutionId }),
      bookingApi.myBookings("upcoming"),
      waitlistApi.myWaitlist(),
      notificationApi.list(),
    ])
      .then(([equipment, bookings, waitlist, notifs]) => {
        if (cancelled) return;
        setAvailableCount(equipment.length);
        setUpcoming(bookings.slice(0, 5));
        setWaitlistCount(waitlist.length);
        setNotifications(notifs.slice(0, 5));
      })
      .catch((e) => toast(e.message || "Could not load dashboard data.", "error"))
      .finally(() => !cancelled && setLoading(false));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pendingCount = upcoming.filter((b) => b.status === "PENDING_APPROVAL").length;

  const cards = [
    { label: "Available Equipment", value: availableCount, icon: Beaker, tone: "text-blue-600 bg-blue-50" },
    { label: "Upcoming Bookings", value: upcoming.length, icon: CalendarClock, tone: "text-emerald-600 bg-emerald-50" },
    { label: "Pending Requests", value: pendingCount, icon: Clock3, tone: "text-amber-600 bg-amber-50" },
    { label: "Waitlist Position(s)", value: waitlistCount, icon: ListChecks, tone: "text-violet-600 bg-violet-50" },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome back, {user?.firstName || "Researcher"} 👋</h1>
        <p className="mt-1 text-sm text-slate-600">Here's what's happening with your lab bookings.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${c.tone} mb-3`}>
              <c.icon size={18} />
            </span>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{c.label}</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{loading ? "—" : c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Bookings</h2>
            <button onClick={() => onNavigate("bookings")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : upcoming.length === 0 ? (
            <p className="text-sm text-slate-500">No upcoming bookings yet. Search for equipment to get started.</p>
          ) : (
            <div className="space-y-3">
              {upcoming.map((b) => (
                <div key={b.bookingId} className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{b.equipmentName}</p>
                    <p className="text-xs text-slate-500">{new Date(b.startTime).toLocaleString()}</p>
                  </div>
                  <StatusPill status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Notifications</h2>
            <button onClick={() => onNavigate("notifications")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ArrowRight size={13} />
            </button>
          </div>
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-slate-500">You're all caught up.</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div key={n.notificationId} className="text-sm">
                  <p className={`font-semibold ${n.isRead ? "text-slate-600" : "text-slate-900"}`}>{n.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="text-base font-bold text-slate-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => onNavigate("search")} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
            Search Equipment
          </button>
          <button onClick={() => onNavigate("report-issue")} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold px-4 py-2.5 transition-colors">
            Report an Issue
          </button>
          <button onClick={() => onNavigate("bookings")} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold px-4 py-2.5 transition-colors">
            View My Bookings
          </button>
        </div>
      </div>
    </div>
  );
}

export function StatusPill({ status }) {
  const map = {
    PENDING_APPROVAL: "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
    IN_USE: "bg-violet-50 text-violet-700 border-violet-200",
    COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
    NO_SHOW: "bg-red-50 text-red-700 border-red-200",
    WAITING: "bg-amber-50 text-amber-700 border-amber-200",
    NOTIFIED: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${map[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
