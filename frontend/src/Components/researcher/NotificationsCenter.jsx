import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { notificationApi } from "../../api/notificationApi";

export function NotificationsCenter({ toast, onRefreshUnread }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    notificationApi
      .list()
      .then(setNotifications)
      .catch((e) => toast(e.message || "Could not load notifications.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = async (id) => {
    try {
      await notificationApi.markRead(id);
      setNotifications((list) => list.map((n) => (n.notificationId === id ? { ...n, isRead: true } : n)));
      onRefreshUnread?.();
    } catch (err) {
      toast(err.message || "Could not update notification.", "error");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-600">Booking updates, waitlist alerts, and maintenance notices.</p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : notifications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          <Bell size={22} className="mx-auto mb-2 text-slate-300" />
          You're all caught up.
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <button
              key={n.notificationId}
              onClick={() => !n.isRead && markRead(n.notificationId)}
              className={`w-full text-left rounded-xl border p-4 transition-colors ${
                n.isRead ? "border-slate-100 bg-white" : "border-blue-200 bg-blue-50/60"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-900">{n.title}</p>
                  <p className="mt-0.5 text-sm text-slate-600">{n.message}</p>
                </div>
                {!n.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-blue-500 shrink-0" />}
              </div>
              <p className="mt-2 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
