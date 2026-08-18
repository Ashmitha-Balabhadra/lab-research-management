import { useState } from "react";
import { X } from "lucide-react";
import { waitlistApi } from "../../api/waitlistApi";
import { ApiError } from "../../api/client";

export function WaitlistModal({ equipment, onClose, onJoined, toast }) {
  const [form, setForm] = useState({ startDate: "", startTime: "09:00", endDate: "", endTime: "10:00" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.startDate || !form.endDate) {
      setError("Please choose a preferred start and end date.");
      return;
    }
    const requestedStartTime = `${form.startDate}T${form.startTime}:00`;
    const requestedEndTime = `${form.endDate}T${form.endTime}:00`;

    if (new Date(requestedEndTime) <= new Date(requestedStartTime)) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const entry = await waitlistApi.join({
        equipmentId: equipment.equipmentId,
        requestedStartTime,
        requestedEndTime,
      });
      toast(`You're #${entry.position} on the waitlist for ${equipment.name}.`, "success");
      onJoined(entry);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not join waitlist.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Join Waitlist</p>
            <h3 className="text-lg font-bold text-slate-900">{equipment.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="mt-2 text-sm text-slate-600">
          This equipment is fully booked. Tell us your preferred window and we'll notify you when a slot opens up.
        </p>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred Start Date</label>
              <input type="date" value={form.startDate} onChange={set("startDate")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
              <input type="time" value={form.startTime} onChange={set("startTime")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Preferred End Date</label>
              <input type="date" value={form.endDate} onChange={set("endDate")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Time</label>
              <input type="time" value={form.endTime} onChange={set("endTime")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
          >
            {submitting ? "Joining…" : "Confirm Waitlist"}
          </button>
        </div>
      </div>
    </div>
  );
}
