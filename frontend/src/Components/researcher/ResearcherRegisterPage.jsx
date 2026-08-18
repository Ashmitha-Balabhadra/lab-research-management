import { useEffect, useState } from "react";
import { ArrowLeft, Microscope } from "lucide-react";
import { Logo } from "../common/Logo";
import { Field } from "../common/Field";
import { authApi } from "../../api/authApi";
import { ApiError } from "../../api/client";

export function ResearcherRegisterPage({ goTo, toast }) {
  const [institutions, setInstitutions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingInstitutions, setLoadingInstitutions] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    institutionId: "",
    departmentId: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    authApi
      .listInstitutions()
      .then(setInstitutions)
      .catch((e) => toast(e.message || "Could not load institutions.", "error"))
      .finally(() => setLoadingInstitutions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!form.institutionId) {
      setDepartments([]);
      return;
    }
    authApi
      .listDepartments(form.institutionId)
      .then(setDepartments)
      .catch((e) => toast(e.message || "Could not load departments.", "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.institutionId]);

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value, ...(field === "institutionId" ? { departmentId: "" } : {}) }));
  };

  const inputClass = (err) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      err ? "border-red-400" : "border-slate-200"
    }`;

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email address.";
    if (!form.institutionId) e.institutionId = "Select your institution.";
    if (!form.departmentId) e.departmentId = "Select your department.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.confirmPassword !== form.password) e.confirmPassword = "Passwords do not match.";
    if (!form.agreeTerms) e.agreeTerms = "You must accept the Terms of Service.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast("Please fix the highlighted fields.", "error");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        institutionId: Number(form.institutionId),
        departmentId: Number(form.departmentId),
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      toast("Account created! You can sign in now.", "success");
      goTo("login", { prefillEmail: form.email });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Registration failed. Please try again.";
      toast(message, "error");
      if (err instanceof ApiError && err.status === 409) {
        setErrors((prev) => ({ ...prev, email: "An account with this email already exists." }));
      }
    } finally {
      setSubmitting(false);
    }
  };

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
              <Microscope size={20} />
            </span>
            <div>
              <p className="text-xs font-semibold tracking-wide text-blue-600 uppercase">Registration</p>
              <h1 className="text-lg font-extrabold text-slate-900">Researcher / Student</h1>
            </div>
          </div>
          <p className="text-sm text-slate-600 mt-3 mb-6">
            Create your account to search shared equipment, book time slots, and report issues.
          </p>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required error={errors.firstName}>
                <input value={form.firstName} onChange={set("firstName")} placeholder="Jane" className={inputClass(errors.firstName)} />
              </Field>
              <Field label="Last Name" error={errors.lastName}>
                <input value={form.lastName} onChange={set("lastName")} placeholder="Cooper" className={inputClass(errors.lastName)} />
              </Field>
            </div>

            <Field label="Email" required error={errors.email}>
              <input value={form.email} onChange={set("email")} placeholder="name@institution.edu" className={inputClass(errors.email)} />
            </Field>

            <Field label="Phone" error={errors.phone}>
              <input value={form.phone} onChange={set("phone")} placeholder="+91 XXXXX XXXXX" className={inputClass(errors.phone)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Institution" required error={errors.institutionId}>
                <select
                  value={form.institutionId}
                  onChange={set("institutionId")}
                  disabled={loadingInstitutions}
                  className={inputClass(errors.institutionId)}
                >
                  <option value="">{loadingInstitutions ? "Loading…" : "Select institution"}</option>
                  {institutions.map((i) => (
                    <option key={i.institutionId} value={i.institutionId}>{i.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Department" required error={errors.departmentId}>
                <select
                  value={form.departmentId}
                  onChange={set("departmentId")}
                  disabled={!form.institutionId}
                  className={inputClass(errors.departmentId)}
                >
                  <option value="">{form.institutionId ? "Select department" : "Select institution first"}</option>
                  {departments.map((d) => (
                    <option key={d.departmentId} value={d.departmentId}>{d.name}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" required error={errors.password}>
                <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••••" className={inputClass(errors.password)} />
              </Field>
              <Field label="Confirm Password" required error={errors.confirmPassword}>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={set("confirmPassword")}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••••••••"
                  className={inputClass(errors.confirmPassword)}
                />
              </Field>
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={set("agreeTerms")}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                I agree to the Terms of Service and Privacy Policy.
              </label>
              {errors.agreeTerms && <p className="mt-1 text-xs text-red-500">{errors.agreeTerms}</p>}
            </div>

            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm mt-2"
            >
              {submitting ? "Creating account…" : "Register"}
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
