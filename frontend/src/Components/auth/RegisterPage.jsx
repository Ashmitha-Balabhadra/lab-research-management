import { useState } from "react";
import { ArrowLeft, Landmark } from "lucide-react";
import { Logo } from "../common/Logo";

export function RegisterPage({ goTo, role, toast, addPendingAccount }) {
  const [form, setForm] = useState({
    fullName: "", email: "", institution: "", phone: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid institutional email.";
    if (!form.institution.trim()) e.institution = "Institution name is required.";
    if (!form.phone.trim()) e.phone = "Phone number is required.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (validate()) {
      addPendingAccount(form.email, role?.label);
      goTo("pending");
    } else {
      toast("Please fix the highlighted fields.", "error");
    }
  };

  const Icon = role?.icon || Landmark;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo onClick={() => goTo("landing")} />
          <button
            onClick={() => goTo("roles")}
            className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft size={16} /> Change Role
          </button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Icon size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">Registration</p>
              <h1 className="text-lg font-extrabold text-slate-900">{role?.label || "Create your account"}</h1>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3 mb-6">
            Fill in your details below. Your application will be reviewed before access is granted.
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Full Name</label>
              <input
                value={form.fullName}
                onChange={update("fullName")}
                placeholder="Dr. Jane Cooper"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.fullName ? "border-red-400" : "border-slate-200"}`}
              />
              {errors.fullName && <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institutional Email</label>
              <input
                value={form.email}
                onChange={update("email")}
                placeholder="name@institution.edu"
                className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400" : "border-slate-200"}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Institution</label>
                <input
                  value={form.institution}
                  onChange={update("institution")}
                  placeholder="MIT"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.institution ? "border-red-400" : "border-slate-200"}`}
                />
                {errors.institution && <p className="mt-1 text-xs text-red-500">{errors.institution}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone</label>
                <input
                  value={form.phone}
                  onChange={update("phone")}
                  placeholder="+1 555 000 0000"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.phone ? "border-red-400" : "border-slate-200"}`}
                />
                {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={update("password")}
                  placeholder="••••••••••"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? "border-red-400" : "border-slate-200"}`}
                />
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••••••••"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.confirm ? "border-red-400" : "border-slate-200"}`}
                />
                {errors.confirm && <p className="mt-1 text-xs text-red-500">{errors.confirm}</p>}
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm mt-2"
            >
              Submit Application
            </button>
          </div>

          <p className="mt-5 text-center text-sm text-slate-600">
            Already have an account?{" "}
            <button onClick={() => goTo("login")} className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
