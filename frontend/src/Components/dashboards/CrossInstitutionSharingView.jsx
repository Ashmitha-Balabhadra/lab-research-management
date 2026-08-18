import { useState } from "react";
import {
  Search, Building2, ArrowLeft, MapPin, CalendarClock, ChevronRight,
  CheckCircle2, XCircle, Send, History as HistoryIcon, Handshake, Users,
} from "lucide-react";
import { Modal, Field, inputClass, StatusBadge, EmptyState } from "../shared/ui.jsx";

/* ================================================================== *
 *  Cross-Institution Sharing                                          *
 *                                                                      *
 *  Flow: Discover a partner institution → explore its shareable        *
 *  equipment → Request Access → request sits PENDING on both sides →   *
 *  the owning institution reviews it under Incoming Requests →         *
 *  Approve & Create Agreement (with an explicit terms step) or         *
 *  Decline → an approved request becomes an Active Agreement and the   *
 *  requested slot is confirmed as a booking automatically.             *
 *                                                                      *
 *  All data below is frontend-only demo state, following the same      *
 *  pattern as the rest of this build.                                  *
 * ================================================================== */

const PARTNER_INSTITUTIONS = [
  {
    id: "INST-1", name: "Ramakrishna College of Engineering", location: "Coimbatore, Tamil Nadu", departmentCount: 6,
    equipment: [
      { id: "EX-201", name: "Zeiss Axio Confocal Microscope", department: "Biotechnology", location: "Lab 2, Room 214", category: "Microscopy", status: "AVAILABLE", image: "🔬" },
      { id: "EX-202", name: "Agilent 1260 HPLC System", department: "Chemistry", location: "Analytical Lab, Room 105", category: "Chromatography", status: "AVAILABLE", image: "🧬" },
      { id: "EX-203", name: "Instron 5969 Universal Tester", department: "Mechanical Engineering", location: "Materials Lab, Room 3", category: "Materials Testing", status: "BOOKED", image: "⚙️" },
    ],
  },
  {
    id: "INST-2", name: "PSG College of Technology", location: "Coimbatore, Tamil Nadu", departmentCount: 8,
    equipment: [
      { id: "EX-211", name: "Malvern Zetasizer Nano", department: "Materials Science", location: "Nano Lab, Room 12", category: "Particle Analysis", status: "AVAILABLE", image: "🧫" },
      { id: "EX-212", name: "Bruker Tensor FTIR", department: "Chemistry", location: "Spectroscopy Wing, Room 4", category: "Spectroscopy", status: "AVAILABLE", image: "📈" },
    ],
  },
  {
    id: "INST-3", name: "Northbridge University", location: "Boston, MA", departmentCount: 5,
    equipment: [
      { id: "EX-221", name: "Thermo Q Exactive Mass Spectrometer", department: "Chemistry", location: "Core Facility, Room 8", category: "Spectroscopy", status: "AVAILABLE", image: "🧪" },
      { id: "EX-222", name: "Leica DM6 B Microscope", department: "Biology", location: "Imaging Suite, Room 1", category: "Microscopy", status: "UNDER_MAINTENANCE", image: "🔬" },
    ],
  },
];

const SEED_OUTGOING = [
  {
    id: "OUT-501", institutionId: "INST-1", institutionName: "Ramakrishna College of Engineering",
    equipmentName: "Zeiss Axio Confocal Microscope", equipmentDept: "Biotechnology",
    requestingDepartment: "Chemistry", startDate: "2026-08-25", startTime: "09:00", endDate: "2026-08-25", endTime: "13:00",
    purpose: "Cross-validation imaging for a joint materials study.", expectedUsers: 2, status: "PENDING",
  },
];
const SEED_INCOMING = [
  {
    id: "CR-2026-00124", institutionName: "Karpagam College of Engineering", institutionLocation: "Coimbatore, Tamil Nadu",
    requestingDepartment: "Electrical & Electronics Engineering", equipmentName: "Agilent 1260 HPLC System", equipmentDept: "Chemistry",
    startDate: "2026-08-18", startTime: "09:00", endDate: "2026-08-18", endTime: "11:00",
    purpose: "We need to perform material composition analysis for our ongoing research project.", status: "PENDING",
  },
  {
    id: "CR-2026-00125", institutionName: "Coastal Research Institute", institutionLocation: "San Diego, CA",
    requestingDepartment: "Marine Biology", equipmentName: "Malvern Zetasizer Nano", equipmentDept: "Materials Science",
    startDate: "2026-09-03", startTime: "10:00", endDate: "2026-09-05", endTime: "16:00",
    purpose: "Particle size analysis for coastal sediment samples.", status: "PENDING",
  },
];
const SEED_AGREEMENTS = [
  {
    id: "AG-12", direction: "outgoing", partner: "Northbridge University", equipmentName: "Agilent 1260 HPLC System",
    schedule: "12 Jul 2026 · 09:00 AM – 11:00 AM", purpose: "Reciprocal HPLC access, cost-shared consumables.", status: "ACTIVE",
  },
];
const SEED_HISTORY = [
  {
    id: "AG-09", direction: "incoming", partner: "Vellore Institute of Science", equipmentName: "Malvern Zetasizer Nano",
    schedule: "02 Jun 2026 · 02:00 PM – 04:00 PM", purpose: "Nanoparticle characterization for a grant proposal.", status: "COMPLETED",
  },
  {
    id: "CR-2026-00098", direction: "incoming", partner: "Metro Applied Sciences", equipmentName: "Bruker Tensor FTIR",
    schedule: "20 May 2026 · 09:00 AM – 10:00 AM", purpose: "Infrared spectroscopy of a polymer sample.", status: "DECLINED",
  },
];

const AGREEMENT_TERMS = [
  "Equipment must be used only for the approved purpose.",
  "Access is valid only during the approved schedule.",
  "Any damage or misuse must be reported immediately.",
  "The requesting institution agrees to follow laboratory rules.",
];

function formatDateLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}
function formatTimeLabel(t) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr}:${String(m).padStart(2, "0")} ${period}`;
}
function scheduleLabel(r) {
  const sameDay = r.startDate === r.endDate;
  return sameDay
    ? `${formatDateLabel(r.startDate)} · ${formatTimeLabel(r.startTime)} – ${formatTimeLabel(r.endTime)}`
    : `${formatDateLabel(r.startDate)} ${formatTimeLabel(r.startTime)} → ${formatDateLabel(r.endDate)} ${formatTimeLabel(r.endTime)}`;
}

const TABS = [
  { id: "discover", label: "Discover Institutions", icon: Search },
  { id: "incoming", label: "Incoming Requests", icon: Handshake },
  { id: "outgoing", label: "Outgoing Requests", icon: Send },
  { id: "agreements", label: "Active Agreements", icon: CheckCircle2 },
  { id: "history", label: "Agreement History", icon: HistoryIcon },
];

export default function CrossInstitutionSharingView({ user, toast }) {
  const [tab, setTab] = useState("discover");
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [outgoing, setOutgoing] = useState(SEED_OUTGOING);
  const [incoming, setIncoming] = useState(SEED_INCOMING);
  const [agreements, setAgreements] = useState(SEED_AGREEMENTS);
  const [history, setHistory] = useState(SEED_HISTORY);

  const [requestTarget, setRequestTarget] = useState(null); // { institution, equipment }
  const [reviewTarget, setReviewTarget] = useState(null); // incoming request
  const [reviewStep, setReviewStep] = useState("review"); // "review" | "agreement"

  const pendingIncomingCount = incoming.filter((r) => r.status === "PENDING").length;

  /* ---- Submit a new outgoing access request ---- */
  const submitRequest = (form) => {
    const id = `OUT-${500 + outgoing.length + 1}`;
    setOutgoing((list) => [{ id, ...form, status: "PENDING" }, ...list]);
    toast(`Access request sent to ${form.institutionName}.`, "success");
    setRequestTarget(null);
    setTab("outgoing");
  };
  const cancelOutgoing = (id) => {
    setOutgoing((list) => list.map((r) => (r.id === id ? { ...r, status: "CANCELLED" } : r)));
    toast("Request cancelled.", "info");
  };

  /* ---- Review / approve / decline an incoming request ---- */
  const declineIncoming = (id) => {
    const req = incoming.find((r) => r.id === id);
    setIncoming((list) => list.map((r) => (r.id === id ? { ...r, status: "DECLINED" } : r)));
    if (req) setHistory((h) => [{ id, direction: "incoming", partner: req.institutionName, equipmentName: req.equipmentName, schedule: scheduleLabel(req), purpose: req.purpose, status: "DECLINED" }, ...h]);
    toast(`Request ${id} declined.`, "error");
    setReviewTarget(null);
    setReviewStep("review");
  };
  const confirmAgreement = () => {
    const req = reviewTarget;
    setIncoming((list) => list.map((r) => (r.id === req.id ? { ...r, status: "APPROVED" } : r)));
    setAgreements((list) => [{ id: req.id, direction: "incoming", partner: req.institutionName, equipmentName: req.equipmentName, schedule: scheduleLabel(req), purpose: req.purpose, status: "ACTIVE" }, ...list]);
    toast(`Agreement activated — booking confirmed for ${req.equipmentName}.`, "success");
    setReviewTarget(null);
    setReviewStep("review");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-extrabold text-slate-900">Cross-Institution Sharing</h1>
        <p className="text-sm text-slate-500 mt-1">Discover partner institutions, request equipment access, and manage sharing agreements.</p>
      </div>

      {/* ---- Tabs ---- */}
      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit mb-6 flex-wrap">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setSelectedInstitution(null); }}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${tab === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
          >
            <t.icon size={14} />
            {t.label}
            {t.id === "incoming" && pendingIncomingCount > 0 && (
              <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">{pendingIncomingCount}</span>
            )}
          </button>
        ))}
      </div>

      {tab === "discover" && (
        <DiscoverTab
          selectedInstitution={selectedInstitution}
          onSelectInstitution={setSelectedInstitution}
          onBack={() => setSelectedInstitution(null)}
          onRequestAccess={(institution, equipment) => setRequestTarget({ institution, equipment })}
        />
      )}
      {tab === "incoming" && (
        <IncomingTab requests={incoming} onReview={(r) => { setReviewTarget(r); setReviewStep("review"); }} />
      )}
      {tab === "outgoing" && <OutgoingTab requests={outgoing} onCancel={cancelOutgoing} />}
      {tab === "agreements" && <AgreementsTab agreements={agreements} />}
      {tab === "history" && <HistoryTab items={history} />}

      {requestTarget && (
        <RequestAccessModal
          user={user}
          institution={requestTarget.institution}
          equipment={requestTarget.equipment}
          onClose={() => setRequestTarget(null)}
          onSubmit={submitRequest}
        />
      )}

      {reviewTarget && reviewStep === "review" && (
        <ReviewRequestModal
          request={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onDecline={() => declineIncoming(reviewTarget.id)}
          onApprove={() => setReviewStep("agreement")}
        />
      )}
      {reviewTarget && reviewStep === "agreement" && (
        <AgreementModal
          request={reviewTarget}
          ourInstitution={user.institution}
          onBack={() => setReviewStep("review")}
          onDecline={() => declineIncoming(reviewTarget.id)}
          onConfirm={confirmAgreement}
        />
      )}
    </div>
  );
}

/* ================================================================== */
/*  Discover Institutions                                               */
/* ================================================================== */
function DiscoverTab({ selectedInstitution, onSelectInstitution, onBack, onRequestAccess }) {
  const [search, setSearch] = useState("");
  const filtered = PARTNER_INSTITUTIONS.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));

  if (selectedInstitution) {
    return <InstitutionDetail institution={selectedInstitution} onBack={onBack} onRequestAccess={onRequestAccess} />;
  }

  return (
    <div>
      <div className="relative max-w-md mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search institution by name…" className={`${inputClass()} pl-9`} />
      </div>

      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Partner Institutions ({filtered.length})</p>
      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No institutions match your search" />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((inst) => (
            <div key={inst.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={20} /></span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900">{inst.name}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {inst.location}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">{inst.departmentCount} Departments · {inst.equipment.length} Shared Equipment</p>
              <button
                onClick={() => onSelectInstitution(inst)}
                className="mt-4 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2.5 flex items-center justify-center gap-1.5 transition-colors"
              >
                Explore <ChevronRight size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InstitutionDetail({ institution, onBack, onRequestAccess }) {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [availability, setAvailability] = useState("ALL");

  const departments = [...new Set(institution.equipment.map((e) => e.department))].sort();
  const categories = [...new Set(institution.equipment.map((e) => e.category))].sort();

  const rows = institution.equipment.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()) &&
    (dept === "ALL" || e.department === dept) &&
    (category === "ALL" || e.category === category) &&
    (availability === "ALL" || e.status === availability)
  );

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 mb-4">
        <ArrowLeft size={13} /> Back to Partner Institutions
      </button>

      <div className="flex items-start gap-3 mb-1">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600"><Building2 size={22} /></span>
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">{institution.name}</h2>
          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin size={11} /> {institution.location}</p>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-5">{institution.departmentCount} Departments &nbsp;·&nbsp; {institution.equipment.length} Shareable Equipment</p>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-5">
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search equipment…" className={`${inputClass()} pl-9`} />
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <select value={dept} onChange={(e) => setDept(e.target.value)} className={inputClass()}>
            <option value="ALL">All Departments</option>
            {departments.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass()}>
            <option value="ALL">All Categories</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className={inputClass()}>
            <option value="ALL">All Availability</option>
            <option value="AVAILABLE">Available</option>
            <option value="BOOKED">Booked</option>
            <option value="UNDER_MAINTENANCE">Under Maintenance</option>
          </select>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon={Search} title="No equipment matches your filters" />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {rows.map((e) => (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{e.image}</span>
                <StatusBadge status={e.status} />
              </div>
              <p className="text-sm font-bold text-slate-900 leading-snug">{e.name}</p>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5"><Building2 size={11} /> Department: {e.department}</p>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5"><MapPin size={11} /> {e.location}</p>
              <p className="text-xs text-slate-400 mt-1">Category: {e.category}</p>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 transition-colors">View Details</button>
                <button
                  disabled={e.status !== "AVAILABLE"}
                  onClick={() => onRequestAccess(institution, e)}
                  className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 transition-colors"
                >
                  Request Access
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Request Access modal                                                */
/* ================================================================== */
function RequestAccessModal({ user, institution, equipment, onClose, onSubmit }) {
  const [form, setForm] = useState({
    startDate: "", startTime: "", endDate: "", endTime: "", purpose: "", requestingDepartment: user.department || "", expectedUsers: 1,
  });
  const [errors, setErrors] = useState({});
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = () => {
    const e = {};
    if (!form.startDate) e.startDate = "Required.";
    if (!form.startTime) e.startTime = "Required.";
    if (!form.endDate) e.endDate = "Required.";
    if (!form.endTime) e.endTime = "Required.";
    if (!form.purpose.trim()) e.purpose = "Please describe why you need access.";
    if (!form.requestingDepartment.trim()) e.requestingDepartment = "Required.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({
      institutionId: institution.id, institutionName: institution.name,
      equipmentName: equipment.name, equipmentDept: equipment.department,
      startDate: form.startDate, startTime: form.startTime, endDate: form.endDate, endTime: form.endTime,
      purpose: form.purpose, requestingDepartment: form.requestingDepartment, expectedUsers: Number(form.expectedUsers) || 1,
    });
  };

  return (
    <Modal title="Request Equipment Access" subtitle={equipment.name} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-lg bg-slate-50 px-3.5 py-2.5"><p className="text-slate-400 mb-0.5">Owner Institution</p><p className="font-semibold text-slate-800">{institution.name}</p></div>
          <div className="rounded-lg bg-slate-50 px-3.5 py-2.5"><p className="text-slate-400 mb-0.5">Department</p><p className="font-semibold text-slate-800">{equipment.department}</p></div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start Date" required error={errors.startDate}>
            <input type="date" value={form.startDate} onChange={set("startDate")} className={inputClass(errors.startDate)} />
          </Field>
          <Field label="Start Time" required error={errors.startTime}>
            <input type="time" value={form.startTime} onChange={set("startTime")} className={inputClass(errors.startTime)} />
          </Field>
          <Field label="End Date" required error={errors.endDate}>
            <input type="date" value={form.endDate} onChange={set("endDate")} className={inputClass(errors.endDate)} />
          </Field>
          <Field label="End Time" required error={errors.endTime}>
            <input type="time" value={form.endTime} onChange={set("endTime")} className={inputClass(errors.endTime)} />
          </Field>
        </div>

        <Field label="Purpose of Access" required error={errors.purpose}>
          <textarea
            value={form.purpose}
            onChange={set("purpose")}
            rows={3}
            placeholder="Describe why you need access to this equipment. Example: Material composition analysis for our ongoing research project…"
            className={inputClass(errors.purpose)}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Requesting Institution">
            <input value={user.institution} disabled className={`${inputClass()} bg-slate-50 text-slate-500`} />
          </Field>
          <Field label="Requesting Department" required error={errors.requestingDepartment}>
            <input value={form.requestingDepartment} onChange={set("requestingDepartment")} placeholder="e.g. Chemistry" className={inputClass(errors.requestingDepartment)} />
          </Field>
        </div>
        <Field label="Expected Number of Users">
          <input type="number" min={1} value={form.expectedUsers} onChange={set("expectedUsers")} className={inputClass()} />
        </Field>

        <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Submit Access Request
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  Incoming Requests                                                   */
/* ================================================================== */
function IncomingTab({ requests, onReview }) {
  const pending = requests.filter((r) => r.status === "PENDING");
  const decided = requests.filter((r) => r.status !== "PENDING");
  return (
    <div>
      {pending.length === 0 ? (
        <EmptyState icon={Handshake} title="No incoming access requests" />
      ) : (
        <div className="space-y-3 mb-8">
          {pending.map((r) => (
            <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-bold text-slate-900">{r.institutionName}</p>
                  <span className="text-xs text-slate-400">{r.id}</span>
                  <StatusBadge status="PENDING" />
                </div>
                <p className="text-xs text-slate-500 mt-1">Requesting <span className="font-semibold">{r.equipmentName}</span> ({r.equipmentDept})</p>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CalendarClock size={11} /> {scheduleLabel(r)}</p>
              </div>
              <button onClick={() => onReview(r)} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2.5 shrink-0 transition-colors">
                Review Request
              </button>
            </div>
          ))}
        </div>
      )}
      {decided.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-slate-900 mb-3">Recently Decided</h2>
          <div className="space-y-2">
            {decided.map((r) => (
              <div key={r.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
                <div className="min-w-0"><p className="text-sm font-semibold text-slate-800">{r.institutionName} — {r.equipmentName}</p><p className="text-xs text-slate-500">{r.id}</p></div>
                <StatusBadge status={r.status} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ReviewRequestModal({ request, onClose, onDecline, onApprove }) {
  return (
    <Modal title="Incoming Access Request" subtitle={`${request.id} · Pending Review`} onClose={onClose} wide>
      <div className="space-y-4 text-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBlock label="Requesting Institution" value={request.institutionName} />
          <InfoBlock label="Requesting Department" value={request.requestingDepartment} />
          <InfoBlock label="Requested Equipment" value={request.equipmentName} />
          <InfoBlock label="Equipment Department" value={request.equipmentDept} />
        </div>
        <InfoBlock label="Requested Schedule" value={scheduleLabel(request)} />
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-1">Purpose</p>
          <p className="rounded-lg bg-slate-50 px-3.5 py-2.5 text-slate-700 text-sm">"{request.purpose}"</p>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onDecline} className="flex-1 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold py-3 flex items-center justify-center gap-1.5 transition-colors">
            <XCircle size={15} /> Decline Request
          </button>
          <button onClick={onApprove} className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 flex items-center justify-center gap-1.5 transition-colors">
            <CheckCircle2 size={15} /> Approve & Create Agreement
          </button>
        </div>
      </div>
    </Modal>
  );
}
function InfoBlock({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 mb-0.5">{label}</p>
      <p className="text-slate-800 font-medium">{value}</p>
    </div>
  );
}

function AgreementModal({ request, ourInstitution, onBack, onDecline, onConfirm }) {
  const [checked, setChecked] = useState(AGREEMENT_TERMS.map(() => false));
  const [agreed, setAgreed] = useState(false);
  const allTermsChecked = checked.every(Boolean);

  return (
    <Modal title="Cross-Institution Access Agreement" subtitle={request.id} onClose={onBack} wide>
      <div className="space-y-4 text-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <InfoBlock label="Owner Institution" value={ourInstitution} />
          <InfoBlock label="Requesting Institution" value={request.institutionName} />
          <InfoBlock label="Equipment" value={request.equipmentName} />
          <InfoBlock label="Access Period" value={scheduleLabel(request)} />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-0.5">Purpose</p>
          <p className="text-slate-800">{request.purpose}</p>
        </div>

        <div className="pt-2 border-t border-slate-100 space-y-2.5">
          {AGREEMENT_TERMS.map((term, i) => (
            <label key={i} className="flex items-start gap-2.5 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={checked[i]}
                onChange={() => setChecked((c) => c.map((v, idx) => (idx === i ? !v : v)))}
                className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              {term}
            </label>
          ))}
          <label className={`flex items-start gap-2.5 text-xs font-semibold cursor-pointer ${allTermsChecked ? "text-slate-800" : "text-slate-300"}`}>
            <input
              type="checkbox"
              checked={agreed}
              disabled={!allTermsChecked}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
            />
            I agree to the cross-institution access terms.
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onDecline} className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-3 transition-colors">Decline</button>
          <button
            disabled={!agreed}
            onClick={onConfirm}
            className="flex-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-semibold py-3 transition-colors"
          >
            Approve Agreement
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  Outgoing Requests                                                    */
/* ================================================================== */
function OutgoingTab({ requests, onCancel }) {
  if (requests.length === 0) return <EmptyState icon={Send} title="No outgoing access requests" />;
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">To: {r.institutionName}</p>
              <span className="text-xs text-slate-400">{r.id}</span>
              <StatusBadge status={r.status === "PENDING" ? "PENDING" : r.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Equipment: <span className="font-semibold">{r.equipmentName}</span></p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CalendarClock size={11} /> {scheduleLabel(r)}</p>
          </div>
          {r.status === "PENDING" && (
            <button onClick={() => onCancel(r.id)} className="rounded-lg border border-red-200 text-red-500 hover:bg-red-50 text-xs font-semibold px-4 py-2.5 shrink-0 transition-colors">
              Cancel Request
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Active Agreements                                                    */
/* ================================================================== */
function AgreementsTab({ agreements }) {
  const active = agreements.filter((a) => a.status === "ACTIVE");
  if (active.length === 0) return <EmptyState icon={CheckCircle2} title="No active agreements" />;
  return (
    <div className="space-y-3">
      {active.map((a) => (
        <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold text-slate-900">{a.partner}</p>
              <span className="text-xs text-slate-400 flex items-center gap-1"><Users size={11} /> {a.direction === "incoming" ? "They requested from us" : "We requested from them"}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{a.equipmentName}</p>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><CalendarClock size={11} /> {a.schedule}</p>
          </div>
          <StatusBadge status="ACTIVE" />
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Agreement History                                                    */
/* ================================================================== */
function HistoryTab({ items }) {
  if (items.length === 0) return <EmptyState icon={HistoryIcon} title="No past agreements yet" />;
  return (
    <div className="space-y-2">
      {items.map((a) => (
        <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">{a.partner} — {a.equipmentName}</p>
            <p className="text-xs text-slate-500">{a.schedule}</p>
          </div>
          <StatusBadge status={a.status} />
        </div>
      ))}
    </div>
  );
}
