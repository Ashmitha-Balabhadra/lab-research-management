import React, { useState, useRef } from "react";
import {
  Microscope, Wrench, BarChart3, Building2, Landmark, Settings,
  ArrowRight, ArrowLeft, CheckCircle2, Mail, Lock, Eye, EyeOff,
  LogOut, Menu, X, TrendingUp, CalendarClock, Share2, LineChart,
  ShieldCheck, Clock, HelpCircle, FileText
} from "lucide-react";
import {
  useToasts, ToastStack, Logo, Modal, SectionLabel, Field, inputClass,
} from "./shared/ui.jsx";
import ResearcherDashboard from "./dashboards/ResearcherDashboard.jsx";
import TechnicianDashboard from "./dashboards/TechnicianDashboard.jsx";
import ManagerDashboard from "./dashboards/ManagerDashboard.jsx";
import DepartmentHeadDashboard from "./dashboards/DepartmentHeadDashboard.jsx";
import InstitutionAdminDashboard from "./dashboards/InstitutionAdminDashboard.jsx";

/*
 * NOTE — this is a frontend-only demo build.
 * There is no fetch/axios/API call anywhere in this project: every
 * "backend" interaction (login, registration, bookings, approvals,
 * maintenance, calibration...) is simulated with in-memory React
 * state and mock data from `src/data/mockData.js`, purely so the UI
 * can be reviewed end-to-end before real backend integration exists.
 */

/* ------------------------------------------------------------------ */
/*  Role definitions                                                   */
/* ------------------------------------------------------------------ */
const ROLES = [
  {
    id: "researcher",
    label: "Researcher / Student",
    desc: "Search equipment and manage bookings.",
    icon: Microscope,
    flow: "register",
  },
  {
    id: "technician",
    label: "Lab Technician",
    desc: "Manage work orders and maintenance.",
    icon: Wrench,
    flow: "login",
  },
  {
    id: "manager",
    label: "Lab Manager",
    desc: "Manage equipment and utilization.",
    icon: BarChart3,
    flow: "login",
  },
  {
    id: "department-head",
    label: "Department Head",
    desc: "Analyze department data.",
    icon: Building2,
    flow: "login",
  },
  {
    id: "institution-admin",
    label: "Institution Administrator",
    desc: "Manage resources and users.",
    icon: Landmark,
    flow: "register-admin",
  },
  {
    id: "system-admin",
    label: "System Administrator",
    desc: "Manage roles, permissions and audit logs.",
    icon: Settings,
    flow: "login",
  },
];

/* ------------------------------------------------------------------ */
/*  Landing Page                                                       */
/* ------------------------------------------------------------------ */
function LandingPage({ goTo, toast }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const featuresRef = useRef(null);
  const aboutRef = useRef(null);
  const contactRef = useRef(null);

  const scrollTo = (ref) => {
    setMenuOpen(false);
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const modules = [
    { icon: CalendarClock, title: "Equipment Booking", desc: "Reserve instruments in real time and avoid scheduling conflicts." },
    { icon: Wrench, title: "Maintenance & Calibration", desc: "Track service history and stay ahead of calibration deadlines." },
    { icon: Share2, title: "Resource Sharing", desc: "Share equipment securely across departments and institutions." },
    { icon: LineChart, title: "Analytics & Intelligence", desc: "Surface utilization, cost, and performance insights instantly." },
  ];

  const steps = ["Discover", "Book", "Use", "Monitor", "Analyze"];

  const stakeholders = [
    { icon: Microscope, label: "Researcher" },
    { icon: Wrench, label: "Technician" },
    { icon: BarChart3, label: "Lab Manager" },
    { icon: Building2, label: "Department Head" },
    { icon: Landmark, label: "Institution Admin" },
    { icon: Settings, label: "System Admin" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <button onClick={() => scrollTo(featuresRef)} className="hover:text-blue-600 transition-colors">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="hover:text-blue-600 transition-colors">About</button>
            <button onClick={() => scrollTo(contactRef)} className="hover:text-blue-600 transition-colors">Contact</button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => goTo("login")}
              className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              Login
            </button>
            <button
              onClick={() => goTo("roles")}
              className="text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Get Started
            </button>
          </div>

          <button className="md:hidden text-slate-700" onClick={() => setMenuOpen((v) => !v)} aria-label="Toggle menu">
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-5 py-4 flex flex-col gap-3 text-sm font-medium text-slate-700">
            <button onClick={() => scrollTo(featuresRef)} className="text-left py-1">Features</button>
            <button onClick={() => scrollTo(aboutRef)} className="text-left py-1">About</button>
            <button onClick={() => scrollTo(contactRef)} className="text-left py-1">Contact</button>
            <button onClick={() => { setMenuOpen(false); goTo("login"); }} className="text-left py-1">Login</button>
            <button
              onClick={() => { setMenuOpen(false); goTo("roles"); }}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 font-semibold"
            >
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 pt-16 pb-14 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600 mb-6">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          CORE OPS ACTIVE
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
          Maximize Your Lab's Potential
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          A centralized platform for managing laboratory equipment, optimizing utilization,
          coordinating maintenance, and enabling secure resource sharing across departments and institutions.
        </p>
        <div className="mt-8 flex items-center justify-center">
          <button
            onClick={() => goTo("roles")}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
          >
            Get Started <ArrowRight size={17} />
          </button>
        </div>

        {/* Utilization stat card */}
        <div className="mt-14 mx-auto max-w-xs rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Current Utilization</p>
          <p className="mt-2 text-4xl font-extrabold text-slate-900">87.4%</p>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm font-semibold text-emerald-500">
            <TrendingUp size={15} /> 12.5% this week
          </p>
        </div>
      </section>

      {/* Modules */}
      <section ref={featuresRef} className="max-w-6xl mx-auto px-5 sm:px-8 py-16 scroll-mt-16">
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">Core Modules</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Systematic Resource Management</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          {modules.map((m) => (
            <div
              key={m.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-md hover:border-blue-200 transition-all"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4">
                <m.icon size={20} />
              </span>
              <h3 className="text-base font-bold text-slate-900">{m.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Dashboard preview / Laboratory Intelligence */}
      <section ref={aboutRef} className="bg-slate-900 py-16 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs font-bold tracking-widest text-blue-400 uppercase">Laboratory Intelligence</p>
          <h2 className="mt-2 text-3xl font-extrabold text-white">Utilization / Equipment / Costs</h2>
          <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-slate-700 bg-slate-800 p-8">
            <div className="grid grid-cols-3 gap-4 text-left">
              {[
                { label: "Active Bookings", value: "142", tone: "text-blue-400" },
                { label: "Equipment Uptime", value: "98.2%", tone: "text-emerald-400" },
                { label: "Pending Maintenance", value: "6", tone: "text-amber-400" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-slate-900/60 p-4 border border-slate-700">
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wide">{s.label}</p>
                  <p className={`mt-2 text-2xl font-extrabold ${s.tone}`}>{s.value}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-xs text-slate-500">Dashboard Preview — full analytics available after sign in</p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-5 sm:px-8 py-16 text-center">
        <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">How It Works</p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                {s}
              </div>
              {i < steps.length - 1 && <ArrowRight size={16} className="text-slate-300" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Stakeholders */}
      <section className="bg-white border-y border-slate-200 py-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 text-center">
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">Designed For Every</p>
          <h2 className="mt-2 text-3xl font-extrabold text-slate-900">Stakeholder</h2>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            {stakeholders.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                <s.icon size={16} className="text-blue-600" /> {s.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-4xl mx-auto px-5 sm:px-8 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Ready to Optimize Your Lab?</h2>
        <button
          onClick={() => goTo("roles")}
          className="mt-7 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-sm transition-colors"
        >
          Get Started <ArrowRight size={17} />
        </button>
      </section>

      {/* Footer */}
      <footer ref={contactRef} className="bg-slate-900 text-slate-400 scroll-mt-16">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-14 grid sm:grid-cols-3 gap-10">
          <div>
            <Logo dark onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} />
            <p className="mt-3 text-sm leading-relaxed max-w-xs">
              Precision resource management for modern laboratories.
            </p>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-300 uppercase mb-3">Product</p>
            <ul className="space-y-2 text-sm">
              {["Features", "Analytics", "Cost & Billing"].map((l) => (
                <li key={l}>
                  <button onClick={() => toast(`${l} — coming soon`)} className="hover:text-white transition-colors text-left">
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-slate-300 uppercase mb-3">Company</p>
            <ul className="space-y-2 text-sm">
              <li><button onClick={() => toast("About Us — coming soon")} className="hover:text-white transition-colors text-left">About Us</button></li>
              <li><button onClick={() => toast("You can reach the LabFlow Pro team at support@labflow.pro")} className="hover:text-white transition-colors text-left">Contact</button></li>
              <li><button onClick={() => toast("Privacy Policy — coming soon")} className="hover:text-white transition-colors text-left">Privacy Policy</button></li>
              <li><button onClick={() => toast("Terms of Service — coming soon")} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
          © 2026 LabFlow Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Role Selection Page                                                */
/* ------------------------------------------------------------------ */
function RoleSelectPage({ goTo, selectRole, toast, openModal }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo onClick={() => goTo("landing")} />
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal("help")}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              <HelpCircle size={16} /> Help Center
            </button>
            <button
              onClick={() => openModal("terms")}
              className="hidden sm:flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2 transition-colors"
            >
              <FileText size={16} /> Terms of Service
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-5 sm:px-8 py-14 w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Select Your Role</h1>
          <p className="mt-3 text-slate-600 max-w-xl mx-auto">
            Choose the role that best describes your position to access the appropriate
            laboratory management tools and resources.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                selectRole(role);
                if (role.flow === "login") {
                  const msg =
                    role.id === "system-admin"
                      ? "System Administrator accounts are provisioned by IT. Redirecting to login."
                      : role.id === "department-head"
                      ? "Department Head accounts are created by your Institution Admin. Redirecting to login."
                      : `${role.label} accounts are created by your Institution Admin. Redirecting to login.`;
                  toast(msg, "info");
                  goTo("login");
                } else if (role.flow === "register-admin") {
                  goTo("register-admin");
                } else {
                  goTo("register");
                }
              }}
              className="text-left rounded-2xl border border-slate-200 bg-white p-6 hover:border-blue-400 hover:shadow-md transition-all group"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600 mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <role.icon size={20} />
              </span>
              <h3 className="text-base font-bold text-slate-900">{role.label}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{role.desc}</p>
            </button>
          ))}
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> SYSTEM STATUS: OPTIMAL
          </span>
          <span>© 2026 LabFlow Pro</span>
          <div className="flex gap-4">
            <button onClick={() => openModal("privacy")} className="hover:text-blue-600">Privacy Policy</button>
            <button onClick={() => openModal("help")} className="hover:text-blue-600">Contact Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Register Page                                                      */
/* ------------------------------------------------------------------ */
function RegisterPage({ goTo, role, toast, addPendingAccount }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", institution: "", department: "", phone: "", password: "", confirm: "",
  });
  const [errors, setErrors] = useState({});

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid institutional email.";
    if (!form.institution.trim()) e.institution = "Institution name is required.";
    if (!form.department.trim()) e.department = "Department name is required.";
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
            <div className="grid grid-cols-2 gap-4">
              <Field label="First Name" required error={errors.firstName}>
                <input value={form.firstName} onChange={update("firstName")} placeholder="Jane" className={inputClass(errors.firstName)} />
              </Field>
              <Field label="Last Name">
                <input value={form.lastName} onChange={update("lastName")} placeholder="Cooper" className={inputClass()} />
              </Field>
            </div>

            <Field label="Institutional Email" required error={errors.email}>
              <input value={form.email} onChange={update("email")} placeholder="name@institution.edu" className={inputClass(errors.email)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Institution" required error={errors.institution} hint="Type your institution's name">
                <input
                  value={form.institution}
                  onChange={update("institution")}
                  placeholder="e.g. Indian Institute of Technology"
                  className={inputClass(errors.institution)}
                />
              </Field>
              <Field label="Department" required error={errors.department} hint="Type your department's name">
                <input
                  value={form.department}
                  onChange={update("department")}
                  placeholder="e.g. Biotechnology"
                  className={inputClass(errors.department)}
                />
              </Field>
            </div>

            <Field label="Phone" required error={errors.phone}>
              <input value={form.phone} onChange={update("phone")} placeholder="+1 555 000 0000" className={inputClass(errors.phone)} />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Password" required error={errors.password}>
                <input type="password" value={form.password} onChange={update("password")} placeholder="••••••••••" className={inputClass(errors.password)} />
              </Field>
              <Field label="Confirm Password" required error={errors.confirm}>
                <input
                  type="password"
                  value={form.confirm}
                  onChange={update("confirm")}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="••••••••••"
                  className={inputClass(errors.confirm)}
                />
              </Field>
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

/* ------------------------------------------------------------------ */
/*  Institution Administrator Registration                             */
/* ------------------------------------------------------------------ */
function InstitutionAdminRegisterPage({ goTo, toast, addPendingAccount }) {
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

          {/* Institution details */}
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

          {/* Administrator details */}
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

/* ------------------------------------------------------------------ */
/*  Pending Approval Page                                              */
/* ------------------------------------------------------------------ */
function PendingPage({ goTo, role }) {
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

/* ------------------------------------------------------------------ */
/*  Login Page                                                         */
/* ------------------------------------------------------------------ */
const DEMO_PROFILES = {
  researcher: { firstName: "Priya", lastName: "Sharma", department: "Biology", institution: "Sunrise Institute of Technology" },
  technician: { firstName: "Rahul", lastName: "Deshmukh", department: "Instrumentation & Maintenance", institution: "Sunrise Institute of Technology" },
  manager: { firstName: "Ananya", lastName: "Rao", department: "Chemistry", institution: "Sunrise Institute of Technology" },
  "department-head": { firstName: "Vikram", lastName: "Nair", department: "Chemistry", institution: "Sunrise Institute of Technology" },
  "institution-admin": { firstName: "Sneha", lastName: "Kapoor", department: "Administration", institution: "Sunrise Institute of Technology" },
  "system-admin": { firstName: "System", lastName: "Administrator", department: "IT Services", institution: "Sunrise Institute of Technology" },
};

function buildDemoUser(email, role) {
  const profile = DEMO_PROFILES[role?.id] || { firstName: "Alex", lastName: "Morgan", department: "General", institution: "Sunrise Institute of Technology" };
  return {
    email,
    firstName: profile.firstName,
    lastName: profile.lastName,
    name: `${profile.firstName} ${profile.lastName}`,
    phone: "+91 98765 43210",
    department: profile.department,
    institution: profile.institution,
  };
}

function LoginPage({ goTo, toast, pendingAccounts = [], role, onLoginSuccess }) {
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const submit = () => {
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
    toast("Signed in successfully.", "success");
    onLoginSuccess(buildDemoUser(form.email.trim(), role), role);
  };

  const googleLogin = () => {
    toast("Signed in with Google.", "success");
    onLoginSuccess(buildDemoUser("you@institution.edu", role), role);
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
            >
              Sign In to LabFlow
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
              Contact your Institution Admin
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Post-login Dashboard placeholder (Department Head / Institution    */
/*  Admin / System Admin — out of scope for this design pass)          */
/* ------------------------------------------------------------------ */
function DashboardPage({ goTo, user, onLogout }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <Logo onClick={() => goTo("landing")} />
          <button
            onClick={onLogout}
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
        <h1 className="text-2xl font-extrabold text-slate-900">Welcome{user ? `, ${user.firstName}` : ""}</h1>
        <p className="mt-2 text-slate-600">This role's dashboard design is coming in the next pass. This is a placeholder home screen.</p>
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

/* ------------------------------------------------------------------ */
/*  Root App                                                           */
/* ------------------------------------------------------------------ */
const DASHBOARD_PAGE_BY_ROLE = {
  researcher: "dashboard-researcher",
  technician: "dashboard-technician",
  manager: "dashboard-manager",
  "department-head": "dashboard-department-head",
  "institution-admin": "dashboard-institution-admin",
};

export default function App() {
  const [page, setPage] = useState("landing");
  const [selectedRole, setSelectedRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [modal, setModal] = useState(null);
  const [pendingAccounts, setPendingAccounts] = useState([]);

  const addPendingAccount = (email, roleLabel) => {
    if (!email) return;
    setPendingAccounts((list) => [...list, { email: email.trim().toLowerCase(), roleLabel }]);
  };
  const { toasts, push } = useToasts();

  const goTo = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  };

  const handleLoginSuccess = (user, role) => {
    setCurrentUser(user);
    setSelectedRole(role);
    goTo(DASHBOARD_PAGE_BY_ROLE[role?.id] || "dashboard");
  };

  const handleLogout = () => {
    setCurrentUser(null);
    push("You've been signed out.", "success");
    goTo("landing");
  };

  const modalContent = {
    help: {
      title: "Help Center",
      body: "Need assistance? Email support@labflow.pro or reach out to your Institution Administrator for account-related questions.",
    },
    terms: {
      title: "Terms of Service",
      body: "By using LabFlow Pro you agree to use shared laboratory resources responsibly and in accordance with your institution's policies.",
    },
    privacy: {
      title: "Privacy Policy",
      body: "LabFlow Pro only collects the information required to manage bookings, maintenance, and institutional access.",
    },
  };

  return (
    <div className="font-sans">
      {page === "landing" && <LandingPage goTo={goTo} toast={push} />}
      {page === "roles" && (
        <RoleSelectPage
          goTo={goTo}
          selectRole={setSelectedRole}
          toast={push}
          openModal={setModal}
        />
      )}
      {page === "register" && <RegisterPage goTo={goTo} role={selectedRole} toast={push} addPendingAccount={addPendingAccount} />}
      {page === "register-admin" && <InstitutionAdminRegisterPage goTo={goTo} toast={push} addPendingAccount={addPendingAccount} />}
      {page === "pending" && <PendingPage goTo={goTo} role={selectedRole} />}
      {page === "login" && (
        <LoginPage goTo={goTo} toast={push} pendingAccounts={pendingAccounts} role={selectedRole} onLoginSuccess={handleLoginSuccess} />
      )}

      {page === "dashboard-researcher" && currentUser && (
        <ResearcherDashboard user={currentUser} onLogout={handleLogout} toast={push} />
      )}
      {page === "dashboard-technician" && currentUser && (
        <TechnicianDashboard user={currentUser} onLogout={handleLogout} toast={push} />
      )}
      {page === "dashboard-manager" && currentUser && (
        <ManagerDashboard user={currentUser} onLogout={handleLogout} toast={push} />
      )}
      {page === "dashboard-department-head" && currentUser && (
        <DepartmentHeadDashboard user={currentUser} onLogout={handleLogout} toast={push} />
      )}
      {page === "dashboard-institution-admin" && currentUser && (
        <InstitutionAdminDashboard user={currentUser} onLogout={handleLogout} toast={push} />
      )}
      {page === "dashboard" && <DashboardPage goTo={goTo} user={currentUser} onLogout={handleLogout} />}

      {modal && (
        <Modal title={modalContent[modal].title} onClose={() => setModal(null)}>
          {modalContent[modal].body}
        </Modal>
      )}

      <ToastStack toasts={toasts} />
    </div>
  );
}