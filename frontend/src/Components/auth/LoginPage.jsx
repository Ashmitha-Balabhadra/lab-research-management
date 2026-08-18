import { useState } from "react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Logo } from "../common/Logo";
import { useAuth } from "../../context/AuthContext";

export function LoginPage({ goTo, toast, pendingAccounts = [], prefillEmail = "" }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: prefillEmail, password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const err = {};
    if (!/^\S+@\S+\.\S+$/.test(form.email)) err.email = "Enter a valid institutional email.";
    if (!form.password) err.password = "Password is required.";

    const pendingMatch = pendingAccounts.find(
      (a) => a.email === form.email.trim().toLowerCase()
    );

    if (Object.keys(err).length > 0) {
      setErrors(err);
      toast("Please fix the highlighted fields.", "error");
      return;
    }

    if (pendingMatch) {
      setErrors({ email: "This account is still pending approval." });
      toast(
        `Your ${pendingMatch.roleLabel || "account"} application is pending approval. You can sign in once a System Administrator approves it.`,
        "error"
      );
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const user = await login(form.email.trim().toLowerCase(), form.password);
      toast("Signed in successfully.", "success");
      if (user.roles?.includes("RESEARCHER")) {
        goTo("researcher-dashboard");
      } else {
        goTo("dashboard");
      }
    } catch (e) {
      toast(e.message || "Invalid email or password.", "error");
      setErrors({ password: "Invalid email or password." });
    } finally {
      setSubmitting(false);
    }
  };

  const googleLogin = () => {
    toast("Google sign-in is not connected yet.", "info");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Left branding panel */}
      <div className="lg:w-1/2 bg-slate-900 text-white flex flex-col justify-center px-8 sm:px-14 py-16 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="relative">
          <Logo dark onClick={() => goTo("landing")} />
          <h1 className="mt-8 text-3xl sm:text-4xl font-extrabold leading-tight">
            Precision Management for<br />Modern Laboratories.
          </h1>
          <p className="mt-4 text-slate-400 max-w-sm leading-relaxed">
            Streamline workflows, track equipment telemetry, and manage institutional
            resources with scientific rigor.
          </p>

          <div className="mt-10 max-w-sm rounded-2xl border border-slate-700 bg-slate-800 p-5">
            <p className="text-[11px] font-semibold tracking-wide text-slate-400 uppercase mb-3">Dashboard Preview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-900/60 border border-slate-700 p-3">
                <p className="text-[10px] text-slate-500">Utilization</p>
                <p className="text-lg font-bold text-blue-400">87.4%</p>
              </div>
              <div className="rounded-lg bg-slate-900/60 border border-slate-700 p-3">
                <p className="text-[10px] text-slate-500">Uptime</p>
                <p className="text-lg font-bold text-emerald-400">98.2%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <button
            onClick={() => goTo("roles")}
            className="mb-6 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} /> Back to role selection
          </button>

          <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
          <p className="mt-1.5 text-sm text-slate-600">Sign in to access your LabFlow Pro dashboard.</p>

          <div className="mt-7 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institutional Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="name@institution.edu"
                  className={`w-full rounded-lg border pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400" : "border-slate-200"}`}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="•••••••••••"
                  className={`w-full rounded-lg border pl-10 pr-10 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-400" : "border-slate-200"}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.remember}
                onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              Remember this workstation
            </label>

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
            >
              {submitting ? "Signing in…" : "Sign In to LabFlow"}
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-semibold text-slate-400">OR</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            onClick={googleLogin}
            className="w-full flex items-center justify-center gap-2.5 rounded-lg border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 19 13 24 13c3 0 5.8 1.1 7.9 3l5.7-5.7C34.6 6 29.6 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 35.5 27 36.5 24 36.5c-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.7 35.9 44 30.4 44 24c0-1.3-.1-2.7-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-7 text-center text-sm text-slate-600">
            Don't have an account?{" "}
            <button onClick={() => goTo("roles")} className="font-semibold text-blue-600 hover:text-blue-700">
              Get started
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
