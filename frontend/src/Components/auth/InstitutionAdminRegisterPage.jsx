import { useRef, useState } from "react";
import { ArrowLeft, Landmark } from "lucide-react";
import { Logo } from "../common/Logo";
import { SectionLabel } from "../common/SectionLabel";
import { Field } from "../common/Field";

export function InstitutionAdminRegisterPage({ goTo, toast, addPendingAccount }) {
  const fileInputRef = useRef(null);
  const [logoName, setLogoName] = useState("");
  const [form, setForm] = useState({
    institutionName: "",
    institutionEmail: "",
    address: "",
    contactPhone: "",
    city: "",
    state: "",
    country: "India",
    firstName: "",
    lastName: "",
    workEmail: "",
    phoneNumber: "",
    password: "",
    confirm: "",
    authorized: false,
  });
  const [errors, setErrors] = useState({});

  const set = (field) => (e) =>
    setForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const inputClass = (err) =>
    `w-full rounded-lg border px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      err ? "border-red-400" : "border-slate-200"
    }`;

  const handleLogoClick = () => fileInputRef.current?.click();
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoName(file.name);
      toast(`Logo "${file.name}" selected.`, "success");
    }
  };

  const validate = () => {
    const e = {};
    if (!form.institutionName.trim()) e.institutionName = "Institution name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.institutionEmail)) e.institutionEmail = "Enter a valid contact email.";
    if (!form.address.trim()) e.address = "Address is required.";
    if (!form.city.trim()) e.city = "City is required.";
    if (!form.state.trim()) e.state = "State is required.";
    if (!form.country.trim()) e.country = "Country is required.";
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.workEmail)) e.workEmail = "Enter a valid work email.";
    if (form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    if (!form.authorized) e.authorized = "You must confirm you are authorized to register this institution.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (validate()) {
      addPendingAccount(form.workEmail, "Institution Administrator");
      goTo("pending");
    } else {
      toast("Please fix the highlighted fields.", "error");
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

      <main className="flex-1 flex items-start justify-center px-5 py-12">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="text-center mb-8">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-3">
              <Landmark size={20} />
            </span>
            <h1 className="text-xl font-extrabold text-slate-900">Institution Administrator Registration</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Create an administrator account for your institution. Your application will be reviewed by a
              System Administrator.
            </p>
          </div>

          <SectionLabel>Institution Details</SectionLabel>
          <div className="space-y-4 mb-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Institution Name" required error={errors.institutionName}>
                <input
                  value={form.institutionName}
                  onChange={set("institutionName")}
                  placeholder="Institution name"
                  className={inputClass(errors.institutionName)}
                />
              </Field>
              <Field label="Institution Contact Email" required error={errors.institutionEmail}>
                <input
                  value={form.institutionEmail}
                  onChange={set("institutionEmail")}
                  placeholder="admin@institution.edu"
                  className={inputClass(errors.institutionEmail)}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <Field label="Address" required error={errors.address}>
                  <input
                    value={form.address}
                    onChange={set("address")}
                    placeholder="Institution address"
                    className={inputClass(errors.address)}
                  />
                </Field>
              </div>
              <Field label="Contact Phone" error={errors.contactPhone}>
                <input
                  value={form.contactPhone}
                  onChange={set("contactPhone")}
                  placeholder="+91 XXXXX XXXXX"
                  className={inputClass(errors.contactPhone)}
                />
              </Field>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="City" required error={errors.city}>
                <input value={form.city} onChange={set("city")} placeholder="City" className={inputClass(errors.city)} />
              </Field>
              <Field label="State" required error={errors.state}>
                <input value={form.state} onChange={set("state")} placeholder="State" className={inputClass(errors.state)} />
              </Field>
              <Field label="Country" required error={errors.country}>
                <input value={form.country} onChange={set("country")} placeholder="Country" className={inputClass(errors.country)} />
              </Field>
            </div>

            <Field label="Institution Logo">
              <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.webp" onChange={handleLogoChange} className="hidden" />
              <button
                type="button"
                onClick={handleLogoClick}
                className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors py-6 flex flex-col items-center justify-center gap-1 text-slate-500"
              >
                <span className="text-blue-600 font-semibold text-sm">⬆ Upload institution logo</span>
                <span className="text-xs">{logoName || "PNG / JPG / WEBP"}</span>
              </button>
            </Field>
          </div>

          <SectionLabel>Administrator Details</SectionLabel>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="First Name" required error={errors.firstName}>
                <input value={form.firstName} onChange={set("firstName")} placeholder="First name" className={inputClass(errors.firstName)} />
              </Field>
              <Field label="Last Name" error={errors.lastName}>
                <input value={form.lastName} onChange={set("lastName")} placeholder="Last name" className={inputClass(errors.lastName)} />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Work Email" required error={errors.workEmail}>
                <input value={form.workEmail} onChange={set("workEmail")} placeholder="name@institution.edu" className={inputClass(errors.workEmail)} />
              </Field>
              <Field label="Phone Number" error={errors.phoneNumber}>
                <input value={form.phoneNumber} onChange={set("phoneNumber")} placeholder="+91 XXXXX XXXXX" className={inputClass(errors.phoneNumber)} />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Password" required error={errors.password}>
                <input type="password" value={form.password} onChange={set("password")} placeholder="•••••••••••••" className={inputClass(errors.password)} />
              </Field>
              <Field label="Confirm Password" required error={errors.confirm}>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={set("confirm")}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="•••••••••••••"
                  className={inputClass(errors.confirm)}
                />
              </Field>
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.authorized}
                  onChange={set("authorized")}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                I confirm that I am authorized to register this institution.
              </label>
              {errors.authorized && <p className="mt-1 text-xs text-red-500">{errors.authorized}</p>}
            </div>

            <button
              type="button"
              onClick={submit}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm mt-2"
            >
              Submit for Approval
            </button>

            <p className="text-center text-sm text-slate-600">
              Already registered?{" "}
              <button onClick={() => goTo("login")} className="font-semibold text-blue-600 hover:text-blue-700">
                Sign in
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
