import { useState, useCallback } from "react";
import { Beaker, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Toast system (frontend-only, in-memory)                            */
/* ------------------------------------------------------------------ */
export function useToasts() {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((message, tone = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return { toasts, push };
}

export function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 shadow-lg text-sm font-medium bg-white animate-[fadeIn_0.2s_ease-out] ${
            t.tone === "success"
              ? "border-emerald-200 text-emerald-700"
              : t.tone === "error"
              ? "border-red-200 text-red-700"
              : "border-slate-200 text-slate-700"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo                                                                */
/* ------------------------------------------------------------------ */
export function Logo({ onClick, dark = false }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 group"
      aria-label="Go to homepage"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
        <Beaker size={17} strokeWidth={2.4} />
      </span>
      <span className={`text-[15px] font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
        LABFLOW <span className="text-blue-600">PRO</span>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Modal                                                               */
/* ------------------------------------------------------------------ */
export function Modal({ title, subtitle, onClose, children, wide = false, footer }) {
  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4 py-8 overflow-y-auto"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className={`w-full ${wide ? "max-w-2xl" : "max-w-md"} rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 my-auto`}>
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 shrink-0" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="text-sm text-slate-600 leading-relaxed mt-3">{children}</div>
        {footer ? (
          <div className="mt-5">{footer}</div>
        ) : (
          <button
            onClick={onClose}
            className="mt-5 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            Got it
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Form helpers                                                        */
/* ------------------------------------------------------------------ */
export function SectionLabel({ children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">{children}</p>
      <div className="mt-2 h-px bg-slate-200" />
    </div>
  );
}

export function Field({ label, required, error, children, hint }) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export const inputClass = (err) =>
  `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
    err ? "border-red-400" : "border-slate-200"
  }`;

/* ------------------------------------------------------------------ */
/*  Status badge — shared across all dashboards                        */
/* ------------------------------------------------------------------ */
const STATUS_STYLES = {
  // Booking statuses
  PENDING_APPROVAL: "bg-amber-50 text-amber-600 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  REJECTED: "bg-red-50 text-red-600 border-red-200",
  IN_USE: "bg-blue-50 text-blue-600 border-blue-200",
  COMPLETED: "bg-slate-100 text-slate-600 border-slate-200",
  CANCELLED: "bg-slate-100 text-slate-500 border-slate-200",
  NO_SHOW: "bg-red-50 text-red-500 border-red-200",
  WAITING: "bg-purple-50 text-purple-600 border-purple-200",
  NOTIFIED: "bg-blue-50 text-blue-600 border-blue-200",
  // Equipment statuses
  AVAILABLE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  BOOKED: "bg-amber-50 text-amber-600 border-amber-200",
  UNDER_MAINTENANCE: "bg-orange-50 text-orange-600 border-orange-200",
  OUT_OF_SERVICE: "bg-red-50 text-red-600 border-red-200",
  RETIRED: "bg-slate-100 text-slate-500 border-slate-200",
  // Maintenance statuses
  OPEN: "bg-amber-50 text-amber-600 border-amber-200",
  IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-200",
  WAITING_FOR_PARTS: "bg-purple-50 text-purple-600 border-purple-200",
  RESOLVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  // Priority
  LOW: "bg-slate-100 text-slate-600 border-slate-200",
  MEDIUM: "bg-amber-50 text-amber-600 border-amber-200",
  HIGH: "bg-orange-50 text-orange-600 border-orange-200",
  CRITICAL: "bg-red-50 text-red-600 border-red-200",
  // Calibration statuses — from real backend EquipmentDto (calibrationStatus field)
  VALID: "bg-emerald-50 text-emerald-600 border-emerald-200",
  DUE_SOON: "bg-amber-50 text-amber-600 border-amber-200",
  OVERDUE: "bg-red-50 text-red-600 border-red-200",
  NOT_RECORDED: "bg-slate-100 text-slate-500 border-slate-200",
  // Calibration compliance labels — from DEMO_CALIBRATIONS / DEMO_EQUIPMENT (mock data)
  "Up to date": "bg-emerald-50 text-emerald-600 border-emerald-200",
  "Due soon": "bg-amber-50 text-amber-600 border-amber-200",
  "Overdue": "bg-red-50 text-red-600 border-red-200",
  "No record": "bg-slate-100 text-slate-500 border-slate-200",
  // User account statuses
  ACTIVE: "bg-emerald-50 text-emerald-600 border-emerald-200",
  INVITED: "bg-blue-50 text-blue-600 border-blue-200",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  REMOVED: "bg-red-50 text-red-500 border-red-200",
  // Cross-institution request / agreement statuses
  PENDING: "bg-amber-50 text-amber-600 border-amber-200",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  DECLINED: "bg-red-50 text-red-600 border-red-200",
};

export function StatusBadge({ status, className = "" }) {
  const style = STATUS_STYLES[status] || "bg-slate-100 text-slate-600 border-slate-200";
  const label = String(status || "").replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Stat card                                                           */
/* ------------------------------------------------------------------ */
export function StatCard({ icon: Icon, label, value, tone = "text-blue-600", bg = "bg-blue-50", onClick }) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={`rounded-2xl border border-slate-200 bg-white p-5 text-left w-full ${onClick ? "hover:border-blue-300 hover:shadow-md transition-all" : ""}`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && (
          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${tone}`}>
            <Icon size={16} />
          </span>
        )}
      </div>
      <p className={`mt-2 text-2xl font-extrabold ${tone}`}>{value}</p>
    </Comp>
  );
}

/* ------------------------------------------------------------------ */
/*  Generic dashboard shell: sidebar + topbar                          */
/* ------------------------------------------------------------------ */
export function DashboardShell({ navItems, activeView, setActiveView, onLogout, roleLabel, roleTag, userName, children, notifCount = 0 }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile nav toggle */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4">
        <Logo />
        <button onClick={() => setMobileNavOpen((v) => !v)} className="text-slate-700" aria-label="Toggle navigation">
          {mobileNavOpen ? <X size={22} /> : <span className="text-xl leading-none">≡</span>}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static z-40 top-14 lg:top-0 left-0 h-[calc(100vh-3.5rem)] lg:h-screen w-64 shrink-0 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ${
          mobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } lg:sticky lg:top-0`}
      >
        <div className="hidden lg:flex items-center h-16 px-5 border-b border-slate-800">
          <Logo dark />
        </div>

        <div className="px-5 pt-5 pb-3">
          <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">{roleTag}</p>
          <p className="text-sm font-bold text-white mt-0.5 truncate">{userName}</p>
          <p className="text-xs text-slate-400">{roleLabel}</p>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveView(item.id); setMobileNavOpen(false); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative ${
                activeView === item.id
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <item.icon size={17} />
              {item.label}
              {item.id === "notifications" && notifCount > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {notifCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOutIcon /> Logout
          </button>
        </div>
      </aside>

      {mobileNavOpen && (
        <div
          className="lg:hidden fixed inset-0 top-14 bg-slate-900/40 z-30"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pt-14 lg:pt-0">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-8">{children}</div>
      </main>
    </div>
  );
}

function LogOutIcon() {
  // Small inline icon to avoid an extra import cycle; mirrors lucide LogOut.
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Page header inside a dashboard view                                */
/* ------------------------------------------------------------------ */
export function ViewHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
      {Icon && (
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon size={20} />
        </span>
      )}
      <p className="text-sm font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
