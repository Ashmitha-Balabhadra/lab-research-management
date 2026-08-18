import React, { useRef, useState } from "react";
import {
  Microscope, Wrench, BarChart3, Building2, Landmark, Settings,
  ArrowRight, Menu, X, TrendingUp, CalendarClock, Share2, LineChart,
} from "lucide-react";
import { Logo } from "../common/Logo";

export function LandingPage({ goTo, toast }) {
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
