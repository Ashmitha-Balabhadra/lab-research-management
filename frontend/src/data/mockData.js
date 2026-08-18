/**
 * Frontend-only demo data.
 * ------------------------------------------------------------------
 * Everything in this file lives in memory for the current browser
 * session only. There is NO fetch / axios / API call anywhere in this
 * project — it exists purely so the UI has realistic content to show
 * (including Pending / Approved / Rejected examples) while the
 * frontend design is being reviewed.
 * ------------------------------------------------------------------
 */

export const DEMO_EQUIPMENT = [
  {
    id: "EQ-101",
    name: "Zeiss Axio Confocal Microscope",
    category: "Microscopy",
    department: "Biology",
    location: "Lab 2, Room 214",
    status: "AVAILABLE",
    description: "High-resolution confocal microscope for live-cell and fixed-sample fluorescence imaging.",
    specs: "63x oil immersion, 4-channel laser, Zen Blue software",
    calibrationStatus: "Up to date",
    nextCalibration: "2026-11-02",
    image: "🔬",
  },
  {
    id: "EQ-102",
    name: "Agilent 1260 HPLC System",
    category: "Chromatography",
    department: "Chemistry",
    location: "Lab 4, Room 108",
    status: "BOOKED",
    description: "Quaternary HPLC system with UV-Vis detector for compound separation and analysis.",
    specs: "Flow rate 0.1–5 mL/min, PDA detector, autosampler (100 vials)",
    calibrationStatus: "Up to date",
    nextCalibration: "2026-09-18",
    image: "⚗️",
  },
  {
    id: "EQ-103",
    name: "Thermo QuantStudio qPCR",
    category: "Molecular Biology",
    department: "Biology",
    location: "Lab 2, Room 210",
    status: "AVAILABLE",
    description: "Real-time PCR system for gene expression and genotyping assays.",
    specs: "96-well block, 6-channel optical detection",
    calibrationStatus: "Due soon",
    nextCalibration: "2026-08-22",
    image: "🧬",
  },
  {
    id: "EQ-104",
    name: "Instron 5967 Universal Testing Machine",
    category: "Materials Testing",
    department: "Mechanical Engineering",
    location: "Structures Lab, Bay 3",
    status: "UNDER_MAINTENANCE",
    description: "Tensile / compression testing machine for materials characterization.",
    specs: "30 kN load cell, Bluehill software",
    calibrationStatus: "Overdue",
    nextCalibration: "2026-07-30",
    image: "🛠️",
  },
  {
    id: "EQ-105",
    name: "Malvern Zetasizer Nano",
    category: "Particle Analysis",
    department: "Chemistry",
    location: "Lab 4, Room 112",
    status: "AVAILABLE",
    description: "Dynamic light scattering instrument for particle size and zeta potential.",
    specs: "0.3nm–10μm range, 173° backscatter detection",
    calibrationStatus: "Up to date",
    nextCalibration: "2026-12-05",
    image: "🧪",
  },
  {
    id: "EQ-106",
    name: "FEI Quanta SEM",
    category: "Microscopy",
    department: "Materials Science",
    location: "Imaging Core, Room 3",
    status: "OUT_OF_SERVICE",
    description: "Scanning electron microscope for high-magnification surface imaging.",
    specs: "Up to 1,000,000x magnification, EDS detector",
    calibrationStatus: "Overdue",
    nextCalibration: "2026-06-15",
    image: "🖥️",
  },
  {
    id: "EQ-107",
    name: "Beckman Coulter Ultracentrifuge",
    category: "Sample Prep",
    department: "Biology",
    location: "Lab 1, Room 118",
    status: "AVAILABLE",
    description: "Ultracentrifuge for high-speed separation of macromolecules and organelles.",
    specs: "Max 100,000 rpm, multiple rotor options",
    calibrationStatus: "Up to date",
    nextCalibration: "2026-10-11",
    image: "🌀",
  },
  {
    id: "EQ-108",
    name: "Bruker 400MHz NMR Spectrometer",
    category: "Spectroscopy",
    department: "Chemistry",
    location: "Lab 5, Room 220",
    status: "BOOKED",
    description: "Nuclear magnetic resonance spectrometer for structural analysis.",
    specs: "400 MHz, auto-sampler, 5mm broadband probe",
    calibrationStatus: "Up to date",
    nextCalibration: "2026-09-29",
    image: "📡",
  },
];

// Technicians available for maintenance assignment (Lab Manager -> Maintenance Oversight)
export const DEMO_TECHNICIANS = [
  { id: "T-1", name: "Rahul Deshmukh", specialty: "Microscopy & Imaging", load: 2 },
  { id: "T-2", name: "Ayesha Khan", specialty: "Analytical Instruments", load: 1 },
  { id: "T-3", name: "Vikram Nair", specialty: "Mechanical / Materials", load: 3 },
];

// Bookings deliberately include Pending / Confirmed / Rejected / other statuses
// so the Researcher "My Bookings" tabs and the Lab Manager "Booking Approvals"
// queue both have realistic demo content to present.
export const DEMO_BOOKINGS = [
  {
    id: "BK-2201",
    equipmentId: "EQ-101",
    researcher: "Priya Sharma",
    department: "Biology",
    start: "2026-08-14T09:00",
    end: "2026-08-14T12:00",
    purpose: "Live-cell imaging for cytoskeleton dynamics study.",
    status: "PENDING_APPROVAL",
    recurring: false,
  },
  {
    id: "BK-2202",
    equipmentId: "EQ-102",
    researcher: "Arjun Mehta",
    department: "Chemistry",
    start: "2026-08-15T13:00",
    end: "2026-08-15T16:00",
    purpose: "Purity analysis of synthesized compound batch 4B.",
    status: "CONFIRMED",
    recurring: false,
  },
  {
    id: "BK-2203",
    equipmentId: "EQ-108",
    researcher: "Sara Iyer",
    department: "Chemistry",
    start: "2026-08-12T10:00",
    end: "2026-08-12T11:30",
    purpose: "Structure confirmation for novel ligand.",
    status: "REJECTED",
    rejectionReason: "Instrument reserved for scheduled maintenance in that window.",
    recurring: false,
  },
  {
    id: "BK-2204",
    equipmentId: "EQ-103",
    researcher: "You",
    department: "Biology",
    start: "2026-08-11T08:30",
    end: "2026-08-11T10:00",
    purpose: "Gene expression assay — pilot run.",
    status: "IN_USE",
    recurring: false,
  },
  {
    id: "BK-2205",
    equipmentId: "EQ-107",
    researcher: "You",
    department: "Biology",
    start: "2026-08-01T09:00",
    end: "2026-08-01T10:00",
    purpose: "Organelle separation for protein extraction.",
    status: "COMPLETED",
    recurring: false,
  },
  {
    id: "BK-2206",
    equipmentId: "EQ-105",
    researcher: "You",
    department: "Chemistry",
    start: "2026-07-22T14:00",
    end: "2026-07-22T15:00",
    purpose: "Nanoparticle sizing for formulation study.",
    status: "CANCELLED",
    recurring: false,
  },
  {
    id: "BK-2207",
    equipmentId: "EQ-102",
    researcher: "You",
    department: "Chemistry",
    start: "2026-07-10T09:00",
    end: "2026-07-10T10:00",
    purpose: "Routine calibration run.",
    status: "NO_SHOW",
    recurring: false,
  },
  {
    id: "BK-2208",
    equipmentId: "EQ-101",
    researcher: "You",
    department: "Biology",
    start: "2026-08-20T09:00",
    end: "2026-08-20T11:00",
    purpose: "Follow-up imaging session for the cytoskeleton study.",
    status: "PENDING_APPROVAL",
    recurring: false,
  },
];

export const DEMO_WAITLIST = [
  {
    id: "WL-501",
    equipmentId: "EQ-102",
    researcher: "You",
    requestedStart: "2026-08-16T09:00",
    requestedEnd: "2026-08-16T11:00",
    position: 2,
    status: "WAITING",
  },
];

export const DEMO_MAINTENANCE_REQUESTS = [
  {
    id: "MR-2026-00041",
    equipmentId: "EQ-104",
    reportedBy: "Karan Bose",
    issueType: "Mechanical Fault",
    description: "Load cell reading inconsistent above 15kN; grinding noise during test cycle.",
    priority: "HIGH",
    status: "IN_PROGRESS",
    assignedTechnicianId: "T-3",
    dueDate: "2026-08-13",
    notes: "Ordered replacement load cell coupling; awaiting delivery.",
  },
  {
    id: "MR-2026-00042",
    equipmentId: "EQ-106",
    reportedBy: "Lab Manager",
    issueType: "Electrical Fault",
    description: "SEM chamber fails to reach vacuum threshold — suspect turbo pump seal.",
    priority: "CRITICAL",
    status: "WAITING_FOR_PARTS",
    assignedTechnicianId: "T-1",
    dueDate: "2026-08-10",
    notes: "Vendor quote requested for turbo pump seal kit.",
  },
  {
    id: "MR-2026-00043",
    equipmentId: "EQ-103",
    reportedBy: "You",
    issueType: "Calibration Issue",
    description: "Fluorescence readout drifting between wells on the last two runs.",
    priority: "MEDIUM",
    status: "OPEN",
    assignedTechnicianId: null,
    dueDate: "2026-08-17",
    notes: "",
  },
  {
    id: "MR-2026-00044",
    equipmentId: "EQ-108",
    reportedBy: "Sara Iyer",
    issueType: "Software Issue",
    description: "Auto-sampler queue occasionally skips a vial position.",
    priority: "LOW",
    status: "OPEN",
    assignedTechnicianId: null,
    dueDate: "2026-08-19",
    notes: "",
  },
  {
    id: "MR-2026-00040",
    equipmentId: "EQ-107",
    reportedBy: "Priya Sharma",
    issueType: "Mechanical Fault",
    description: "Rotor lid latch was sticking.",
    priority: "LOW",
    status: "COMPLETED",
    assignedTechnicianId: "T-2",
    dueDate: "2026-08-04",
    notes: "Latch mechanism cleaned and re-lubricated. Verified 10 open/close cycles.",
  },
];

export const DEMO_CALIBRATIONS = [
  { equipmentId: "EQ-101", lastCalibration: "2026-05-02", nextDue: "2026-11-02", certificateNumber: "CAL-2026-0091", compliance: "Up to date" },
  { equipmentId: "EQ-102", lastCalibration: "2026-03-18", nextDue: "2026-09-18", certificateNumber: "CAL-2026-0064", compliance: "Up to date" },
  { equipmentId: "EQ-103", lastCalibration: "2026-02-22", nextDue: "2026-08-22", certificateNumber: "CAL-2026-0038", compliance: "Due soon" },
  { equipmentId: "EQ-104", lastCalibration: "2026-01-30", nextDue: "2026-07-30", certificateNumber: "CAL-2026-0011", compliance: "Overdue" },
  { equipmentId: "EQ-105", lastCalibration: "2026-06-05", nextDue: "2026-12-05", certificateNumber: "CAL-2026-0102", compliance: "Up to date" },
  { equipmentId: "EQ-106", lastCalibration: "2025-12-15", nextDue: "2026-06-15", certificateNumber: "CAL-2025-0187", compliance: "Overdue" },
  { equipmentId: "EQ-107", lastCalibration: "2026-04-11", nextDue: "2026-10-11", certificateNumber: "CAL-2026-0077", compliance: "Up to date" },
  { equipmentId: "EQ-108", lastCalibration: "2026-03-29", nextDue: "2026-09-29", certificateNumber: "CAL-2026-0059", compliance: "Up to date" },
];

export const DEMO_NOTIFICATIONS = {
  researcher: [
    { id: "N-1", type: "Booking Rejected", title: "Booking BK-2203 was rejected", message: "Bruker 400MHz NMR — reserved for scheduled maintenance in that window.", time: "2 hours ago", read: false },
    { id: "N-2", type: "Waitlist", title: "You moved up the waitlist", message: "You are now #2 for Agilent 1260 HPLC System.", time: "5 hours ago", read: false },
    { id: "N-3", type: "Booking Approved", title: "Booking BK-2202 confirmed", message: "Your HPLC session on Aug 15, 1:00 PM is confirmed.", time: "1 day ago", read: true },
    { id: "N-4", type: "Maintenance", title: "Issue MR-2026-00043 acknowledged", message: "Your calibration issue report has been logged and is awaiting technician assignment.", time: "2 days ago", read: true },
  ],
  technician: [
    { id: "N-1", type: "Task Assigned", title: "New task MR-2026-00043 assigned", message: "QuantStudio qPCR — calibration drift, priority Medium.", time: "1 hour ago", read: false },
    { id: "N-2", type: "Parts Update", title: "Vendor quote received", message: "Turbo pump seal kit for MR-2026-00042 — awaiting your approval.", time: "6 hours ago", read: false },
    { id: "N-3", type: "Task Resolved", title: "MR-2026-00040 marked resolved", message: "Ultracentrifuge is back to Available status.", time: "3 days ago", read: true },
  ],
  manager: [
    { id: "N-1", type: "Booking Request", title: "New booking pending approval", message: "Priya Sharma requested the Zeiss Axio Confocal Microscope.", time: "20 min ago", read: false },
    { id: "N-2", type: "Maintenance", title: "Critical issue on SEM", message: "MR-2026-00042 is waiting on parts — flagged Critical.", time: "3 hours ago", read: false },
    { id: "N-3", type: "Utilization", title: "Weekly utilization report ready", message: "Department utilization sits at 71.4% for this week.", time: "1 day ago", read: true },
  ],
};

export function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
