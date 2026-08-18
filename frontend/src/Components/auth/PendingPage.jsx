import { CheckCircle2, Clock } from "lucide-react";
import { Logo } from "../common/Logo";

export function PendingPage({ goTo, role }) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-9 shadow-sm text-center">
        <div className="flex justify-center mb-5">
          <Logo onClick={() => goTo("landing")} />
        </div>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h1 className="text-xl font-extrabold text-slate-900">Registration Submitted</h1>
        <p className="mt-3 text-sm text-slate-600 leading-relaxed">
          Your {role?.label || "account"} application has been submitted successfully.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-4 py-1.5 text-xs font-bold text-amber-600">
          <Clock size={13} /> PENDING APPROVAL
        </div>

        <p className="mt-5 text-sm text-slate-600 leading-relaxed">
          A System Administrator will review your application. You can sign in once your account has been approved.
        </p>

        <button
          onClick={() => goTo("login")}
          className="mt-7 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
