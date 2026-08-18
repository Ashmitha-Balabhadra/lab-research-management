import { useEffect, useState } from "react";
import { Search as SearchIcon, MapPin, Beaker } from "lucide-react";
import { equipmentApi } from "../../api/equipmentApi";
import { useAuth } from "../../context/AuthContext";

const STATUS_OPTIONS = ["", "AVAILABLE", "BOOKED", "UNDER_MAINTENANCE", "OUT_OF_SERVICE"];

export function SearchEquipment({ onSelectEquipment, toast }) {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  const runSearch = () => {
    setLoading(true);
    equipmentApi
      .search({ query, status, category, institutionId: user?.institutionId })
      .then(setResults)
      .catch((e) => toast(e.message || "Search failed.", "error"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = Array.from(new Set(results.map((r) => r.category).filter(Boolean)));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-slate-900">Search Equipment</h1>
        <p className="mt-1 text-sm text-slate-600">Find available instruments and reserve a time slot.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <SearchIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runSearch()}
            placeholder="Search by equipment name or category…"
            className="w-full rounded-lg border border-slate-200 pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.replace(/_/g, " ") : "Any Status"}</option>
          ))}
        </select>
        <button
          onClick={runSearch}
          className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 transition-colors"
        >
          Search
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading equipment…</p>
      ) : results.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
          No equipment matched your search. Try a different keyword or filter.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((eq) => (
            <button
              key={eq.equipmentId}
              onClick={() => onSelectEquipment(eq.equipmentId)}
              className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Beaker size={18} />
                </span>
                <StatusBadge status={eq.status} />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">{eq.name}</h3>
              <p className="text-xs text-slate-500">{eq.category}</p>
              {eq.location && (
                <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                  <MapPin size={12} /> {eq.location}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    BOOKED: "bg-amber-50 text-amber-700 border-amber-200",
    UNDER_MAINTENANCE: "bg-red-50 text-red-700 border-red-200",
    OUT_OF_SERVICE: "bg-slate-100 text-slate-500 border-slate-200",
    RETIRED: "bg-slate-100 text-slate-500 border-slate-200",
  };
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${map[status] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
      {status?.replace(/_/g, " ")}
    </span>
  );
}
