import {
  LayoutDashboard, Search, CalendarCheck, AlertTriangle, Bell, User, LogOut,
} from "lucide-react";
import { Logo } from "../common/Logo";
import { useAuth } from "../../context/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Search Equipment", icon: Search },
  { id: "bookings", label: "My Bookings", icon: CalendarCheck },
  { id: "report-issue", label: "Report Issue", icon: AlertTriangle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile", icon: User },
];

export function ResearcherLayout({ activeView, onNavigate, unreadCount = 0, onLogout, children }) {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside className="hidden md:flex md:flex-col w-64 shrink-0 border-r border-slate-200 bg-white">
        <div className="h-16 flex items-center px-5 border-b border-slate-200">
          <Logo onClick={() => onNavigate("dashboard")} />
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <item.icon size={17} />
                  {item.label}
                </span>
                {item.id === "notifications" && unreadCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white">
                    {unreadCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-sm font-bold">
              {(user?.firstName?.[0] || "?").toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="mt-1 w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut size={17} /> Logout
          </button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <Logo onClick={() => onNavigate("dashboard")} />
        <button onClick={onLogout} className="text-slate-500" aria-label="Logout">
          <LogOut size={18} />
        </button>
      </div>
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-slate-200 flex justify-around py-2">
        {NAV_ITEMS.map((item) => {
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-semibold ${
                active ? "text-blue-600" : "text-slate-500"
              }`}
            >
              <item.icon size={18} />
              {item.label.split(" ")[0]}
              {item.id === "notifications" && unreadCount > 0 && (
                <span className="absolute -top-0.5 right-1 h-2 w-2 rounded-full bg-red-500" />
              )}
            </button>
          );
        })}
      </nav>

      <main className="flex-1 min-w-0 pt-14 pb-16 md:pt-0 md:pb-0">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
