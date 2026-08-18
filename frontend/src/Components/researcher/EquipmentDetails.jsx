import { useEffect, useState } from "react";
import { ArrowLeft, MapPin, ShieldCheck, AlertTriangle, Calendar } from "lucide-react";
import { equipmentApi } from "../../api/equipmentApi";

const CALIBRATION_LABEL = {
  VALID: { text: "Calibration valid", tone: "text-emerald-600" },
  DUE_SOON: { text: "Calibration due soon", tone: "text-amber-600" },
  OVERDUE: { text: "Calibration overdue", tone: "text-red-600" },
  NOT_RECORDED: { text: "No calibration on record", tone: "text-slate-500" },
};

export function EquipmentDetails({ equipmentId, onBack, onBook, onJoinWaitlist, onReportIssue, toast }) {
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    equipmentApi
      .getById(equipmentId)
      .then(setEquipment)
      .catch((e) => toast(e.message || "Could not load equipment details.", "error"))
      .finally(() => setLoading(false));
  }, [equipmentId, toast]);

  if (loading) return <p className="text-sm text-slate-500">Loading equipment details…</p>;
  if (!equipment) return null;

  const calibration = CALIBRATION_LABEL[equipment.calibrationStatus] || CALIBRATION_LABEL.NOT_RECORDED;

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="mb-5 flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600">
        <ArrowLeft size={16} /> Back to search
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">{equipment.category}</p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">{equipment.name}</h1>
            <p className="mt-1 text-sm text-slate-500">{equipment.manufacturer} {equipment.model}</p>
          </div>
          <StatusBadge status={equipment.status} />
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4 text-sm">
          <Detail icon={MapPin} label="Location" value={equipment.location || "Not specified"} />
          <Detail icon={ShieldCheck} label="Calibration Status" value={calibration.text} valueClass={calibration.tone} />
          {equipment.nextCalibrationDue && (
            <Detail icon={Calendar} label="Next Calibration Due" value={new Date(equipment.nextCalibrationDue).toLocaleDateString()} />
          )}
          <Detail icon={ShieldCheck} label="Serial Number" value={equipment.serialNumber} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {equipment.status === "AVAILABLE" && (
            <button
              onClick={() => onBook(equipment)}
              className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Book Now
            </button>
          )}
          {equipment.status === "BOOKED" && (
            <button
              onClick={() => onJoinWaitlist(equipment)}
              className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
            >
              Join Waitlist
            </button>
          )}
          <button
            onClick={() => onReportIssue(equipment)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-sm font-semibold px-5 py-2.5 transition-colors"
          >
            <AlertTriangle size={15} /> Report Issue
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon: Icon, label, value, valueClass = "text-slate-900" }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white border border-slate-200 text-slate-500 shrink-0">
        <Icon size={15} />
      </span>
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-semibold ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BOOKED: "bg-amber-50 text-amber-700 border-amber-200",
    UNDER_MAINTENANCE: "bg-red-50 text-red-700 border-red-200",
    OUT_OF_SERVICE: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${map[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
