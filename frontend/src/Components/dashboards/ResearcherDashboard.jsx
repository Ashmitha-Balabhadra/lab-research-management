import { useMemo, useState } from "react";
import {
  LayoutDashboard, Search, CalendarClock, AlertTriangle, Bell, UserRound,
  Microscope, MapPin, Tag, Repeat, Clock, CheckCircle2, Camera,
  ChevronRight, ClipboardList, Star, FlaskConical, BarChart2, FileText,
} from "lucide-react";
import {
  Modal, Field, inputClass, StatusBadge, StatCard, DashboardShell, ViewHeader, EmptyState,
} from "../shared/ui.jsx";
import {
  DEMO_EQUIPMENT, DEMO_BOOKINGS, DEMO_WAITLIST, DEMO_MAINTENANCE_REQUESTS,
  DEMO_NOTIFICATIONS, formatDateTime, formatDate,
} from "../../data/mockData.js";
import MaintenanceRequestView from "../maintenance/MaintenanceRequestView.jsx";
import { MyUsageCostSection } from "../cost/CostManagementView.jsx";
import ResearcherAnalyticsView from "../analytics/ResearcherAnalyticsView.jsx";
import ReportsDashboardView from "../reports/ReportsDashboardView.jsx";
import NotificationCenter from "../notifications/NotificationCenter.jsx";

const NAV_ITEMS = [
  { id: "home", label: "Dashboard", icon: LayoutDashboard },
  { id: "search", label: "Search Equipment", icon: Search },
  { id: "bookings", label: "My Bookings", icon: CalendarClock },
  { id: "analytics", label: "Personal Analytics", icon: BarChart2 },
  { id: "reports", label: "Usage Reports", icon: FileText },
  { id: "report", label: "Maintenance Requests", icon: AlertTriangle },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "profile", label: "Profile", icon: UserRound },
];

let mrCounter = DEMO_MAINTENANCE_REQUESTS.length + 45; // next generated maintenance-request number
let bkCounter = 2209; // next generated booking id number
let wlCounter = 502;

export default function ResearcherDashboard({ user, onLogout, toast }) {
  const [view, setView] = useState("home");
  const [equipment] = useState(DEMO_EQUIPMENT);
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);
  const [waitlist, setWaitlist] = useState(DEMO_WAITLIST);
  const [maintenance, setMaintenance] = useState(DEMO_MAINTENANCE_REQUESTS);
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS.researcher);

  const [selectedEquipmentId, setSelectedEquipmentId] = useState(null);
  const [bookingModalFor, setBookingModalFor] = useState(null); // equipmentId
  const [waitlistModalFor, setWaitlistModalFor] = useState(null); // equipmentId
  const [rescheduleTarget, setRescheduleTarget] = useState(null); // booking
  const [bookingsTab, setBookingsTab] = useState("upcoming");
  const [confirmModal, setConfirmModal] = useState(null); // { title, message }

  const myBookings = useMemo(() => bookings.filter((b) => b.researcher === "You"), [bookings]);
  const equipmentById = useMemo(() => Object.fromEntries(equipment.map((e) => [e.id, e])), [equipment]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const goToDetails = (id) => { setSelectedEquipmentId(id); setView("search"); };

  const cancelBooking = (id) => {
    setBookings((list) => list.map((b) => (b.id === id ? { ...b, status: "CANCELLED" } : b)));
    toast("Booking cancelled.", "success");
  };

  const submitReschedule = (newStart, newEnd) => {
    setBookings((list) =>
      list.map((b) => (b.id === rescheduleTarget.id ? { ...b, start: newStart, end: newEnd, status: "PENDING_APPROVAL" } : b))
    );
    toast("Reschedule request sent — awaiting Lab Manager approval.", "success");
    setRescheduleTarget(null);
  };

  const confirmBooking = ({ equipmentId, start, end, purpose, recurring, frequency, recurrenceEnd }) => {
    const id = `BK-${bkCounter++}`;
    setBookings((list) => [
      {
        id,
        equipmentId,
        researcher: "You",
        department: user.department,
        start,
        end,
        purpose,
        status: "PENDING_APPROVAL",
        recurring,
        frequency: recurring ? frequency : undefined,
        recurrenceEnd: recurring ? recurrenceEnd : undefined,
      },
      ...list,
    ]);
    setBookingModalFor(null);
    toast(`Booking ${id} submitted — pending Lab Manager approval.`, "success");
    setBookingsTab("upcoming");
    setView("bookings");
  };

  const confirmWaitlist = ({ equipmentId, start, end }) => {
    const id = `WL-${wlCounter++}`;
    const position = waitlist.filter((w) => w.equipmentId === equipmentId).length + 1;
    setWaitlist((list) => [...list, { id, equipmentId, researcher: "You", requestedStart: start, requestedEnd: end, position, status: "WAITING" }]);
    setWaitlistModalFor(null);
    toast(`Added to waitlist — position #${position}.`, "success");
    setBookingsTab("waitlist");
    setView("bookings");
  };

  const submitIssue = ({ equipmentId, issueType, description, priority }) => {
    const code = `MR-2026-${String(mrCounter++).padStart(5, "0")}`;
    setMaintenance((list) => [
      { id: code, equipmentId, reportedBy: "You", issueType, description, priority, status: "OPEN", assignedTechnicianId: null, dueDate: "", notes: "" },
      ...list,
    ]);
    toast(`Issue reported — Lab Manager notified.`, "success");
    setConfirmModal({
      title: "Issue Submitted",
      message: `Your report has been logged as ${code} and the Lab Manager has been notified. You can track progress from Report Issue history.`,
    });
  };

  const markNotifRead = (id) => setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));

  return (
    <DashboardShell
      navItems={NAV_ITEMS}
      activeView={view}
      setActiveView={(v) => { setSelectedEquipmentId(null); setView(v); }}
      onLogout={onLogout}
      roleLabel="Researcher / Student"
      roleTag="Signed in as"
      userName={user.name}
      notifCount={unreadCount}
    >
      {view === "home" && (
        <HomeView
          user={user}
          equipment={equipment}
          myBookings={myBookings}
          waitlist={waitlist}
          notifications={notifications}
          onOpenSearch={() => setView("search")}
          onOpenBookings={(tab) => { setBookingsTab(tab || "upcoming"); setView("bookings"); }}
          onOpenReport={() => setView("report")}
          onViewEquipment={goToDetails}
        />
      )}

      {view === "search" && (
        <SearchView
          equipment={equipment}
          selectedEquipmentId={selectedEquipmentId}
          setSelectedEquipmentId={setSelectedEquipmentId}
          onBookNow={(id) => setBookingModalFor(id)}
          onJoinWaitlist={(id) => setWaitlistModalFor(id)}
          onReportIssue={(id) => { setSelectedEquipmentId(id); setView("report"); }}
        />
      )}

      {view === "bookings" && (
        <BookingsView
          myBookings={myBookings}
          waitlist={waitlist.filter((w) => w.researcher === "You")}
          equipmentById={equipmentById}
          activeTab={bookingsTab}
          setActiveTab={setBookingsTab}
          onCancel={cancelBooking}
          onReschedule={(b) => setRescheduleTarget(b)}
          onBookNew={() => setView("search")}
        />
      )}

      {view === "analytics" && (
        <ResearcherAnalyticsView
          user={user}
          bookings={bookings}
          equipment={equipment}
          waitlist={waitlist}
          maintenance={maintenance}
        />
      )}

      {view === "reports" && (
        <ReportsDashboardView role="researcher" user={user} toast={toast} />
      )}

      {view === "report" && (
        <MaintenanceRequestView toast={toast} />
      )}

      {view === "notifications" && (
        <NotificationCenter
          role="researcher"
          user={user}
          notifications={notifications}
          setNotifications={setNotifications}
          onNavigate={(targetView) => { setSelectedEquipmentId(null); setView(targetView); }}
          toast={toast}
        />
      )}

      {view === "profile" && <ProfileView user={user} bookings={myBookings} toast={toast} />}

      {bookingModalFor && (
        <BookEquipmentModal
          equipment={equipmentById[bookingModalFor]}
          onClose={() => setBookingModalFor(null)}
          onConfirm={confirmBooking}
        />
      )}

      {waitlistModalFor && (
        <JoinWaitlistModal
          equipment={equipmentById[waitlistModalFor]}
          onClose={() => setWaitlistModalFor(null)}
          onConfirm={confirmWaitlist}
        />
      )}

      {rescheduleTarget && (
        <RescheduleModal
          booking={rescheduleTarget}
          equipment={equipmentById[rescheduleTarget.equipmentId]}
          onClose={() => setRescheduleTarget(null)}
          onConfirm={submitReschedule}
        />
      )}

      {confirmModal && (
        <Modal title={confirmModal.title} onClose={() => setConfirmModal(null)}>
          {confirmModal.message}
        </Modal>
      )}
    </DashboardShell>
  );
}

/* ================================================================== */
/*  1.6  Dashboard Home                                                 */
/* ================================================================== */
function HomeView({ user, equipment, myBookings, waitlist, notifications, onOpenSearch, onOpenBookings, onOpenReport, onViewEquipment }) {
  const available = equipment.filter((e) => e.status === "AVAILABLE").length;
  const active = myBookings.filter((b) => b.status === "IN_USE").length;
  const upcoming = myBookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING_APPROVAL").length;
  const pending = myBookings.filter((b) => b.status === "PENDING_APPROVAL").length;
  const myWaitlist = waitlist.filter((w) => w.researcher === "You");
  const waitlistPos = myWaitlist.length ? Math.min(...myWaitlist.map((w) => w.position)) : "—";

  const recent = [...myBookings].sort((a, b) => new Date(b.start) - new Date(a.start)).slice(0, 4);
  const recommended = equipment.filter((e) => e.status === "AVAILABLE").slice(0, 3);

  return (
    <div>
      <ViewHeader title={`Welcome back, ${user.firstName}`} subtitle="Here's what's happening with your lab resources today." />

      <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Microscope} label="Available Equipment" value={available} tone="text-blue-600" bg="bg-blue-50" onClick={onOpenSearch} />
        <StatCard icon={CheckCircle2} label="My Active Bookings" value={active} tone="text-emerald-600" bg="bg-emerald-50" onClick={() => onOpenBookings("active")} />
        <StatCard icon={CalendarClock} label="Upcoming Bookings" value={upcoming} tone="text-blue-600" bg="bg-blue-50" onClick={() => onOpenBookings("upcoming")} />
        <StatCard icon={Clock} label="Pending Requests" value={pending} tone="text-amber-600" bg="bg-amber-50" onClick={() => onOpenBookings("upcoming")} />
        <StatCard icon={ClipboardList} label="Waitlist Position" value={waitlistPos} tone="text-purple-600" bg="bg-purple-50" onClick={() => onOpenBookings("waitlist")} />
      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Recent Bookings</h2>
            <button onClick={() => onOpenBookings("upcoming")} className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
              View all <ChevronRight size={14} />
            </button>
          </div>
          {recent.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No bookings yet" subtitle="Search equipment to make your first booking." />
          ) : (
            <div className="divide-y divide-slate-100">
              {recent.map((b) => (
                <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{equipment.find((e) => e.id === b.equipmentId)?.name}</p>
                    <p className="text-xs text-slate-500">{formatDateTime(b.start)}</p>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={onOpenSearch} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
                Book Equipment
              </button>
              <button onClick={onOpenReport} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors">
                Report Issue
              </button>
              <button onClick={() => onOpenBookings("upcoming")} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors">
                View My Bookings
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Notifications</h2>
          </div>
          <div className="space-y-3">
            {notifications.slice(0, 3).map((n) => (
              <div key={n.id} className={`rounded-lg border p-3 text-xs ${n.read ? "border-slate-100 bg-slate-50" : "border-blue-100 bg-blue-50"}`}>
                <p className="font-semibold text-slate-800">{n.title}</p>
                <p className="text-slate-500 mt-0.5">{n.time}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 mb-4">
          <Star size={16} className="text-amber-400" />
          <h2 className="text-base font-bold text-slate-900">Recommended Equipment</h2>
          <span className="text-xs text-slate-400">based on your booking history</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {recommended.map((e) => (
            <button key={e.id} onClick={() => onViewEquipment(e.id)} className="text-left rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-sm transition-all p-4">
              <span className="text-2xl">{e.image}</span>
              <p className="mt-2 text-sm font-bold text-slate-800">{e.name}</p>
              <p className="text-xs text-slate-500">{e.category} · {e.location}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  1.7 / 1.8  Search Equipment + Equipment Details                     */
/* ================================================================== */
function SearchView({ equipment, selectedEquipmentId, setSelectedEquipmentId, onBookNow, onJoinWaitlist, onReportIssue }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("All");
  const [department, setDepartment] = useState("All");
  const [availability, setAvailability] = useState("All");

  const categories = ["All", ...new Set(equipment.map((e) => e.category))];
  const departments = ["All", ...new Set(equipment.map((e) => e.department))];

  const filtered = equipment.filter((e) => {
    if (q && !`${e.name} ${e.category}`.toLowerCase().includes(q.toLowerCase())) return false;
    if (category !== "All" && e.category !== category) return false;
    if (department !== "All" && e.department !== department) return false;
    if (availability !== "All" && e.status !== availability) return false;
    return true;
  });

  const selected = equipment.find((e) => e.id === selectedEquipmentId);

  if (selected) {
    return (
      <EquipmentDetails
        equipment={selected}
        onBack={() => setSelectedEquipmentId(null)}
        onBookNow={() => onBookNow(selected.id)}
        onJoinWaitlist={() => onJoinWaitlist(selected.id)}
        onReportIssue={() => onReportIssue(selected.id)}
      />
    );
  }

  return (
    <div>
      <ViewHeader title="Search Equipment" subtitle="Find and reserve laboratory instruments across departments." />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by equipment name or category…"
            className="w-full rounded-lg border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded-lg border border-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {categories.map((c) => <option key={c}>{c}</option>)}
          </select>
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="rounded-lg border border-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {departments.map((d) => <option key={d}>{d}</option>)}
          </select>
          <select value={availability} onChange={(e) => setAvailability(e.target.value)} className="rounded-lg border border-slate-200 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
            {["All", "AVAILABLE", "BOOKED", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"].map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Availability" : s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Search} title="No equipment matches your filters" subtitle="Try adjusting your search or filters." />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((e) => (
            <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-all flex flex-col">
              <div className="flex items-start justify-between">
                <span className="text-3xl">{e.image}</span>
                <StatusBadge status={e.status} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{e.name}</h3>
              <p className="mt-1 text-xs text-slate-500 flex items-center gap-1"><Tag size={11} /> {e.category}</p>
              <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1"><MapPin size={11} /> {e.location}</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setSelectedEquipmentId(e.id)} className="flex-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold py-2 transition-colors">
                  View Details
                </button>
                {e.status === "AVAILABLE" ? (
                  <button onClick={() => onBookNow(e.id)} className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold py-2 transition-colors">
                    Book Now
                  </button>
                ) : e.status === "BOOKED" ? (
                  <button onClick={() => onJoinWaitlist(e.id)} className="flex-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold py-2 transition-colors">
                    Join Waitlist
                  </button>
                ) : (
                  <button disabled className="flex-1 rounded-lg bg-slate-100 text-slate-400 text-xs font-semibold py-2 cursor-not-allowed">
                    Unavailable
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EquipmentDetails({ equipment, onBack, onBookNow, onJoinWaitlist, onReportIssue }) {
  return (
    <div>
      <button onClick={onBack} className="mb-5 text-sm font-semibold text-slate-500 hover:text-blue-600 flex items-center gap-1">
        ← Back to Search
      </button>
      <div className="rounded-2xl border border-slate-200 bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-4xl">{equipment.image}</span>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900">{equipment.name}</h1>
              <p className="text-sm text-slate-500">{equipment.category} · {equipment.department}</p>
            </div>
          </div>
          <StatusBadge status={equipment.status} className="text-sm px-3 py-1.5" />
        </div>

        <p className="mt-6 text-sm text-slate-600 leading-relaxed">{equipment.description}</p>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Technical Specifications</p>
            <p className="mt-1.5 text-sm text-slate-700">{equipment.specs}</p>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Location</p>
            <p className="mt-1.5 text-sm text-slate-700 flex items-center gap-1"><MapPin size={13} /> {equipment.location}</p>
          </div>
          <div className={`rounded-xl border p-4 ${
            equipment.calibrationStatus === "Overdue"
              ? "bg-red-50 border-red-200"
              : equipment.calibrationStatus === "Due soon"
              ? "bg-amber-50 border-amber-200"
              : "bg-slate-50 border-slate-100"
          }`}>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Calibration Status</p>
            <div className="mt-1.5">
              <StatusBadge status={equipment.calibrationStatus} />
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Next Calibration Date</p>
            <p className="mt-1.5 text-sm text-slate-700 font-semibold">{formatDate(equipment.nextCalibration)}</p>
            {(() => {
              if (!equipment.nextCalibration) return null;
              const today = new Date(); today.setHours(0,0,0,0);
              const due = new Date(equipment.nextCalibration); due.setHours(0,0,0,0);
              const days = Math.round((due - today) / 86400000);
              if (days < 0)
                return <p className="mt-0.5 text-xs font-bold text-red-600">{Math.abs(days)} days overdue</p>;
              if (days === 0)
                return <p className="mt-0.5 text-xs font-bold text-red-500">Due today</p>;
              if (days <= 30)
                return <p className="mt-0.5 text-xs font-bold text-amber-600">Due in {days} days</p>;
              return <p className="mt-0.5 text-xs text-emerald-600">Due in {days} days</p>;
            })()}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          {equipment.status === "AVAILABLE" && (
            <button onClick={onBookNow} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              Book Now
            </button>
          )}
          {equipment.status === "BOOKED" && (
            <button onClick={onJoinWaitlist} className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 transition-colors">
              Join Waitlist
            </button>
          )}
          <button onClick={onReportIssue} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-5 py-2.5 transition-colors">
            Report Issue
          </button>
          <button onClick={onBack} className="rounded-lg text-slate-500 hover:text-slate-700 text-sm font-semibold px-5 py-2.5 transition-colors">
            Back
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  1.9  Book Equipment Form (modal)                                    */
/* ================================================================== */
function BookEquipmentModal({ equipment, onClose, onConfirm }) {
  const [startDate, setStartDate] = useState("2026-08-18");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-08-18");
  const [endTime, setEndTime] = useState("11:00");
  const [purpose, setPurpose] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState("Weekly");
  const [recurrenceEnd, setRecurrenceEnd] = useState("2026-09-18");
  const [errors, setErrors] = useState({});

  const submit = () => {
    const e = {};
    if (!purpose.trim()) e.purpose = "Purpose is required.";
    const start = `${startDate}T${startTime}`;
    const end = `${endDate}T${endTime}`;
    if (new Date(end) <= new Date(start)) e.end = "End time must be after start time.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onConfirm({ equipmentId: equipment.id, start, end, purpose, recurring, frequency, recurrenceEnd });
  };

  return (
    <Modal title="Book Equipment" subtitle={equipment.name} onClose={onClose} wide>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Start Date" required>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass()} />
          </Field>
          <Field label="Start Time" required>
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass()} />
          </Field>
          <Field label="End Date" required>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass()} />
          </Field>
          <Field label="End Time" required error={errors.end}>
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass(errors.end)} />
          </Field>
        </div>

        <Field label="Purpose" required error={errors.purpose}>
          <textarea
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            rows={3}
            placeholder="Briefly describe the purpose of this booking…"
            className={inputClass(errors.purpose)}
          />
        </Field>

        <div className="rounded-lg border border-slate-200 p-3.5">
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={recurring} onChange={(e) => setRecurring(e.target.checked)} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            <Repeat size={14} /> Recurring Booking
          </label>
          {recurring && (
            <div className="mt-3 grid sm:grid-cols-2 gap-3">
              <Field label="Frequency">
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass()}>
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </Field>
              <Field label="Repeat Until">
                <input type="date" value={recurrenceEnd} onChange={(e) => setRecurrenceEnd(e.target.value)} className={inputClass()} />
              </Field>
            </div>
          )}
        </div>

        <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Confirm Booking
        </button>
      </div>
    </Modal>
  );
}

function JoinWaitlistModal({ equipment, onClose, onConfirm }) {
  const [startDate, setStartDate] = useState("2026-08-19");
  const [startTime, setStartTime] = useState("09:00");
  const [endDate, setEndDate] = useState("2026-08-19");
  const [endTime, setEndTime] = useState("11:00");

  return (
    <Modal title="Join Waitlist" subtitle={equipment.name} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Requested Start Date"><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass()} /></Field>
          <Field label="Start Time"><input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass()} /></Field>
          <Field label="Requested End Date"><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass()} /></Field>
          <Field label="End Time"><input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass()} /></Field>
        </div>
        <button
          onClick={() => onConfirm({ equipmentId: equipment.id, start: `${startDate}T${startTime}`, end: `${endDate}T${endTime}` })}
          className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Confirm Waitlist
        </button>
      </div>
    </Modal>
  );
}

function RescheduleModal({ booking, equipment, onClose, onConfirm }) {
  const [start, setStart] = useState(booking.start);
  const [end, setEnd] = useState(booking.end);
  return (
    <Modal title="Reschedule Booking" subtitle={equipment?.name} onClose={onClose}>
      <div className="space-y-4">
        <Field label="New Start"><input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} className={inputClass()} /></Field>
        <Field label="New End"><input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} className={inputClass()} /></Field>
        <button onClick={() => onConfirm(start, end)} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
          Submit Reschedule Request
        </button>
      </div>
    </Modal>
  );
}

/* ================================================================== */
/*  1.11  My Bookings (4 tabs)                                          */
/* ================================================================== */
function BookingsView({ myBookings, waitlist, equipmentById, activeTab, setActiveTab, onCancel, onReschedule, onBookNew }) {
  const tabs = [
    { id: "upcoming", label: "Upcoming" },
    { id: "active", label: "Active" },
    { id: "history", label: "History" },
    { id: "waitlist", label: "Waitlist" },
  ];

  const upcoming = myBookings.filter((b) => b.status === "PENDING_APPROVAL" || b.status === "CONFIRMED");
  const active = myBookings.filter((b) => b.status === "IN_USE");
  const history = myBookings.filter((b) => ["COMPLETED", "CANCELLED", "NO_SHOW", "REJECTED"].includes(b.status));

  return (
    <div>
      <ViewHeader
        title="My Bookings"
        subtitle="Track upcoming, active, past, and waitlisted equipment reservations."
        action={
          <button onClick={onBookNew} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">
            + New Booking
          </button>
        }
      />

      <div className="flex gap-1 rounded-xl bg-slate-100 p-1 w-fit mb-6">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
              activeTab === t.id ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "upcoming" && (
        upcoming.length === 0 ? <EmptyState icon={CalendarClock} title="No upcoming bookings" /> :
        <BookingTable rows={upcoming} equipmentById={equipmentById} onCancel={onCancel} onReschedule={onReschedule} showActions />
      )}
      {activeTab === "active" && (
        active.length === 0 ? <EmptyState icon={FlaskConical} title="No equipment currently in use" /> :
        <BookingTable rows={active} equipmentById={equipmentById} />
      )}
      {activeTab === "history" && (
        history.length === 0 ? <EmptyState icon={ClipboardList} title="No booking history yet" /> :
        <BookingTable rows={history} equipmentById={equipmentById} showReason />
      )}
      {activeTab === "waitlist" && (
        waitlist.length === 0 ? <EmptyState icon={Clock} title="You're not on any waitlists" /> : (
          <div className="space-y-3">
            {waitlist.map((w) => (
              <div key={w.id} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-slate-800">{equipmentById[w.equipmentId]?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Requested {formatDateTime(w.requestedStart)} – {formatDateTime(w.requestedEnd)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Position</p>
                    <p className="text-lg font-extrabold text-purple-600">#{w.position}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Est. wait</p>
                    <p className="text-sm font-semibold text-slate-700">~{w.position * 2} days</p>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

function BookingTable({ rows, equipmentById, onCancel, onReschedule, showActions, showReason }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wide">
          <tr>
            <th className="text-left font-semibold px-5 py-3">Equipment</th>
            <th className="text-left font-semibold px-5 py-3">Schedule</th>
            <th className="text-left font-semibold px-5 py-3">Status</th>
            {showActions && <th className="text-right font-semibold px-5 py-3">Actions</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((b) => (
            <tr key={b.id}>
              <td className="px-5 py-3.5">
                <p className="font-semibold text-slate-800">{equipmentById[b.equipmentId]?.name}</p>
                <p className="text-xs text-slate-400">{b.id}</p>
                {showReason && b.status === "REJECTED" && b.rejectionReason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {b.rejectionReason}</p>
                )}
              </td>
              <td className="px-5 py-3.5 text-slate-600">{formatDateTime(b.start)} – {formatDateTime(b.end)}</td>
              <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
              {showActions && (
                <td className="px-5 py-3.5 text-right space-x-2">
                  <button onClick={() => onReschedule(b)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Reschedule</button>
                  <button onClick={() => onCancel(b.id)} className="text-xs font-semibold text-red-500 hover:text-red-600">Cancel</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ================================================================== */
/*  1.12  Report Issue                                                  */
/* ================================================================== */
function ReportIssueView({ equipment, myReports, equipmentById, prefillEquipmentId, onSubmit }) {
  const [equipmentId, setEquipmentId] = useState(prefillEquipmentId || "");
  const [issueType, setIssueType] = useState("Mechanical Fault");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState({});
  const locked = Boolean(prefillEquipmentId);

  const submit = () => {
    const e = {};
    if (!equipmentId) e.equipmentId = "Select the equipment with an issue.";
    if (!description.trim()) e.description = "Please describe the problem.";
    setErrors(e);
    if (Object.keys(e).length) return;
    onSubmit({ equipmentId, issueType, description, priority });
    setDescription("");
    setFileName("");
  };

  return (
    <div>
      <ViewHeader title="Report Issue" subtitle="Flag a problem with laboratory equipment for the Lab Manager to triage." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="space-y-4">
            <Field label="Equipment" required error={errors.equipmentId}>
              {locked ? (
                <input readOnly value={equipmentById[equipmentId]?.name || ""} className={`${inputClass()} bg-slate-50 text-slate-500`} />
              ) : (
                <select value={equipmentId} onChange={(e) => setEquipmentId(e.target.value)} className={inputClass(errors.equipmentId)}>
                  <option value="">Select equipment…</option>
                  {equipment.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              )}
            </Field>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Issue Type">
                <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={inputClass()}>
                  {["Mechanical Fault", "Electrical Fault", "Software Issue", "Calibration Issue", "Other"].map((t) => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass()}>
                  {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </Field>
            </div>

            <Field label="Problem Description" required error={errors.description}>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Describe what happened…" className={inputClass(errors.description)} />
            </Field>

            <Field label="Attachment">
              <label className="w-full rounded-lg border-2 border-dashed border-slate-300 hover:border-blue-400 hover:bg-blue-50/40 transition-colors py-5 flex flex-col items-center justify-center gap-1 text-slate-500 cursor-pointer">
                <input type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || "")} />
                <Camera size={18} className="text-blue-600" />
                <span className="text-xs">{fileName || "Attach a photo or document"}</span>
              </label>
            </Field>

            <button onClick={submit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors">
              Submit Issue
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Your Reported Issues</h3>
          {myReports.length === 0 ? (
            <p className="text-xs text-slate-400">You haven't reported any issues yet.</p>
          ) : (
            <div className="space-y-3">
              {myReports.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-700">{m.id}</p>
                    <StatusBadge status={m.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{equipmentById[m.equipmentId]?.name}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  1.13  Notifications Center                                          */
/* ================================================================== */
function NotificationsView({ notifications, onRead }) {
  return (
    <div>
      <ViewHeader title="Notifications" subtitle="Booking updates, waitlist movement, and maintenance alerts." />
      {notifications.length === 0 ? (
        <EmptyState icon={Bell} title="You're all caught up" />
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => onRead(n.id)}
              className={`w-full text-left rounded-xl border p-4 flex items-start gap-3 transition-colors ${
                n.read ? "border-slate-200 bg-white" : "border-blue-200 bg-blue-50/60"
              }`}
            >
              <span className={`mt-0.5 flex h-2.5 w-2.5 shrink-0 rounded-full ${n.read ? "bg-slate-300" : "bg-blue-500"}`} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800">{n.title}</p>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-[11px] text-slate-400 mt-1.5">{n.type} · {n.time}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  1.14  Profile                                                       */
/* ================================================================== */
function ProfileView({ user, bookings, toast }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ firstName: user.firstName, lastName: user.lastName, phone: user.phone });
  const [pwModal, setPwModal] = useState(false);

  const stats = {
    total: bookings.length,
    completed: bookings.filter((b) => b.status === "COMPLETED").length,
    cancelled: bookings.filter((b) => b.status === "CANCELLED").length,
    noShow: bookings.filter((b) => b.status === "NO_SHOW").length,
  };

  const save = () => {
    setEditing(false);
    toast("Profile updated.", "success");
  };

  return (
    <div>
      <ViewHeader title="Profile" subtitle="Manage your account details and view your usage summary." />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-4 mb-6">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white text-xl font-bold">
              {user.firstName[0]}{user.lastName?.[0] || ""}
            </span>
            <div>
              <p className="text-lg font-bold text-slate-900">{user.firstName} {user.lastName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="First Name">
              <input disabled={!editing} value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} />
            </Field>
            <Field label="Last Name">
              <input disabled={!editing} value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} />
            </Field>
            <Field label="Email"><input disabled value={user.email} className={`${inputClass()} bg-slate-50 text-slate-500`} /></Field>
            <Field label="Phone">
              <input disabled={!editing} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={`${inputClass()} ${!editing ? "bg-slate-50 text-slate-500" : ""}`} />
            </Field>
            <Field label="Institution"><input disabled value={user.institution} className={`${inputClass()} bg-slate-50 text-slate-500`} /></Field>
            <Field label="Department"><input disabled value={user.department} className={`${inputClass()} bg-slate-50 text-slate-500`} /></Field>
          </div>

          <div className="mt-6 flex gap-3">
            {editing ? (
              <>
                <button onClick={save} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">Save Changes</button>
                <button onClick={() => setEditing(false)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(true)} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 transition-colors">Edit Profile</button>
                <button onClick={() => setPwModal(true)} className="rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold px-4 py-2.5 transition-colors">Change Password</button>
              </>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-sm font-bold text-slate-900 mb-4">Usage Stats</h3>
          <div className="space-y-3">
            {[
              { label: "Total Bookings", value: stats.total, tone: "text-blue-600" },
              { label: "Completed", value: stats.completed, tone: "text-emerald-600" },
              { label: "Cancelled", value: stats.cancelled, tone: "text-slate-500" },
              { label: "No Show", value: stats.noShow, tone: "text-red-500" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between rounded-lg bg-slate-50 px-3.5 py-2.5">
                <span className="text-xs font-semibold text-slate-500">{s.label}</span>
                <span className={`text-sm font-extrabold ${s.tone}`}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {pwModal && (
        <Modal title="Change Password" onClose={() => setPwModal(false)}>
          <div className="space-y-3">
            <Field label="Current Password"><input type="password" className={inputClass()} placeholder="••••••••" /></Field>
            <Field label="New Password"><input type="password" className={inputClass()} placeholder="••••••••" /></Field>
            <button
              onClick={() => { setPwModal(false); toast("Password updated.", "success"); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors"
            >
              Update Password
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
