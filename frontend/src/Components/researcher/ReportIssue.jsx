import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { equipmentApi } from "../../api/equipmentApi";
import { maintenanceApi } from "../../api/maintenanceApi";
import { ApiError } from "../../api/client";

const ISSUE_TYPES = ["Mechanical Fault", "Electrical Fault", "Software / Calibration", "Physical Damage", "Other"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function ReportIssue({ prefillEquipment, onDone, toast }) {
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [form, setForm] = useState({
    equipmentId: prefillEquipment?.equipmentId || "",
    issueType: ISSUE_TYPES[0],
    priority: "MEDIUM",
    issueDescription: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    if (!prefillEquipment) {
      equipmentApi.search({}).then(setEquipmentOptions).catch(() => {});
    }
  }, [prefillEquipment]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async () => {
    setError("");
    if (!form.equipmentId) {
      setError("Please select the affected equipment.");
      return;
    }
    if (!form.issueDescription.trim()) {
      setError("Please describe the issue.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await maintenanceApi.report({
        equipmentId: Number(form.equipmentId),
        issueType: form.issueType,
        priority: form.priority,
        issueDescription: form.issueDescription,
      });
      setConfirmation(result);
      toast(`Issue reported (${result.maintenanceCode}).`, "success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not submit the issue report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmation) {
    return (
      <div className="max-w-lg mx-auto text-center rounded-2xl border border-slate-200 bg-white p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
          <CheckCircle2 size={28} className="text-emerald-500" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-900">Issue Reported</h2>
        <p className="mt-2 text-sm text-slate-600">
          Ticket <span className="font-semibold text-slate-900">{confirmation.maintenanceCode}</span> has been created
          and the Lab Manager has been notified.
        </p>
        <button
          onClick={() => onDone?.()}
          className="mt-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Report Equipment Issue</h1>
        <p className="mt-1 text-sm text-slate-600">Let the Lab Manager know about a problem with a piece of equipment.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Equipment</label>
          {prefillEquipment ? (
            <input value={prefillEquipment.name} disabled className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600" />
          ) : (
            <select value={form.equipmentId} onChange={set("equipmentId")} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select equipment</option>
              {equipmentOptions.map((eq) => (
                <option key={eq.equipmentId} value={eq.equipmentId}>{eq.name}</option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Issue Type</label>
          <select value={form.issueType} onChange={set("issueType")} className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            {ISSUE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Priority</label>
          <div className="grid grid-cols-4 gap-2">
            {PRIORITIES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm((f) => ({ ...f, priority: p }))}
                className={`rounded-lg border px-2 py-2 text-xs font-bold transition-colors ${
                  form.priority === p ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 text-slate-500 hover:bg-slate-50"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Problem Description</label>
          <textarea
            value={form.issueDescription}
            onChange={set("issueDescription")}
            rows={4}
            placeholder="Describe what's wrong, when it started, and any error messages…"
            className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && <p className="text-xs font-medium text-red-500">{error}</p>}

        <button
          onClick={submit}
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg transition-colors shadow-sm"
        >
          {submitting ? "Submitting…" : "Submit Issue"}
        </button>
      </div>
    </div>
  );
}
