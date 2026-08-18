import { LogOut, ShieldCheck } from "lucide-react";
import { Logo } from "./Logo";

export function DashboardPage({ goTo, toast }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo onClick={() => goTo("landing")} />
          <button
            onClick={() => { toast("Signed out."); goTo("landing"); }}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-red-500 transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-5 sm:px-8 py-16 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <ShieldCheck size={30} className="text-blue-600" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome to LabFlow Pro</h1>
        <p className="mt-2 text-slate-600">Your dashboard is being prepared. This is a placeholder home screen.</p>
        <div className="mt-10 grid sm:grid-cols-3 gap-5 text-left">
          {[
            { label: "Active Bookings", value: "12", tone: "text-blue-600" },
            { label: "Pending Maintenance", value: "3", tone: "text-amber-500" },
            { label: "Utilization", value: "87.4%", tone: "text-emerald-500" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className={`mt-2 text-2xl font-extrabold ${s.tone}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
