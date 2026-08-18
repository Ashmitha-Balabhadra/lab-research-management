import { useEffect, useState } from "react";
import { bookingApi } from "../../api/bookingApi";
import { waitlistApi } from "../../api/waitlistApi";
import { StatusPill } from "./ResearcherDashboard";
import { ApiError } from "../../api/client";

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "active", label: "Active" },
  { id: "history", label: "History" },
  { id: "waitlist", label: "Waitlist" },
];

export function MyBookings({ toast }) {
  const [tab, setTab] = useState("upcoming");
  const [bookings, setBookings] = useState([]);
  const [waitlist, setWaitlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    const request = tab === "waitlist" ? waitlistApi.myWaitlist() : bookingApi.myBookings(tab);
    request
      .then((data) => (tab === "waitlist" ? setWaitlist(data) : setBookings(data)))
      .catch((e) => toast(e.message || "Could not load bookings.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const cancelBooking = async (bookingId) => {
    try {
      await bookingApi.cancel(bookingId);
      toast("Booking cancelled.", "success");
      load();
    } catch (err) {
      toast(err instanceof ApiError ? err.message : "Could not cancel booking.", "error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">My Bookings</h1>
        <p className="mt-1 text-sm text-slate-600">Track requests, active sessions, history, and waitlist position.</p>
      </div>

      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 mb-6 w-fit">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
              tab === t.id ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : tab === "waitlist" ? (
        waitlist.length === 0 ? (
          <EmptyState text="You're not on any waitlists right now." />
        ) : (
          <div className="space-y-3">
            {waitlist.map((w) => (
              <div key={w.waitlistId} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-bold text-slate-900">{w.equipmentName}</p>
                  <p className="text-xs text-slate-500">
                    Preferred: {new Date(w.requestedStartTime).toLocaleString()} → {new Date(w.requestedEndTime).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Estimated wait: {w.estimatedWait}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-500">Queue Position</p>
                  <p className="text-xl font-extrabold text-blue-600">#{w.position}</p>
                </div>
              </div>
            ))}
          </div>
        )
      ) : bookings.length === 0 ? (
        <EmptyState text={`No ${tab} bookings.`} />
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.bookingId} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-bold text-slate-900">{b.equipmentName}</p>
                <p className="text-xs text-slate-500">
                  {new Date(b.startTime).toLocaleString()} → {new Date(b.endTime).toLocaleString()}
                </p>
                {b.purpose && <p className="text-xs text-slate-500 mt-0.5">{b.purpose}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={b.status} />
                {tab === "upcoming" && (
                  <button
                    onClick={() => cancelBooking(b.bookingId)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
      {text}
    </div>
  );
}
