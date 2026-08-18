import { useState } from "react";
import { X } from "lucide-react";
import { bookingApi } from "../../api/bookingApi";
import { ApiError } from "../../api/client";

export function BookEquipmentForm({ equipment, onClose, onBooked, toast }) {
  const [form, setForm] = useState({
    startDate: "", startTime: "09:00",
    endDate: "", endTime: "10:00",
    purpose: "",
    isRecurring: false,
    frequency: "WEEKLY",
    recurrenceEndDate: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const set = (field) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
  };

  const submit = async () => {
    setError("");
    if (!form.startDate || !form.endDate) {
      setError("Please choose a start and end date.");
      return;
    }

    const startTime = `${form.startDate}T${form.startTime}:00`;
    const endTime = `${form.endDate}T${form.endTime}:00`;

    if (new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    try {
      const booking = await bookingApi.create({
        equipmentId: equipment.equipmentId,
        startTime,
        endTime,
        purpose: form.purpose,
        isRecurring: form.isRecurring,
        recurrencePattern: form.isRecurring
          ? `${form.frequency}${form.recurrenceEndDate ? " until " + form.recurrenceEndDate : ""}`
          : null,
      });
      toast("Booking request submitted — awaiting Lab Manager approval.", "success");
      onBooked(booking);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not create booking.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Book Equipment</p>
            <h3 className="text-lg font-bold text-slate-900">{equipment.name}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700" aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Date</label>
              <input type="date" value={form.startDate} onChange={set("startDate")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Start Time</label>
              <input type="time" value={form.startTime} onChange={set("startTime")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Date</label>
              <input type="date" value={form.endDate} onChange={set("endDate")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">End Time</label>
              <input type="time" value={form.endTime} onChange={set("endTime")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose</label>
            <textarea
              value={form.purpose}
              onChange={set("purpose")}
              rows={3}
              placeholder="e.g. RNA extraction for thesis project"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
            <input type="checkbox" checked={form.isRecurring} onChange={set("isRecurring")} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
            Recurring booking
          </label>

          {form.isRecurring && (
            <div className="grid grid-cols-2 gap-3 pl-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Frequency</label>
                <select value={form.frequency} onChange={set("frequency")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Repeat Until</label>
                <input type="date" value={form.recurrenceEndDate} onChange={set("recurrenceEndDate")} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          )}

          {error && <p className="text-xs font-medium text-red-500">{error}</p>}

          <button
            onClick={submit}
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
          >
            {submitting ? "Submitting…" : "Confirm Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
