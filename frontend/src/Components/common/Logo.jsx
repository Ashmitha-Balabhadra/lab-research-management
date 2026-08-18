import { Beaker } from "lucide-react";

export function Logo({ onClick, dark = false }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 group" aria-label="Go to homepage">
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white">
        <Beaker size={17} strokeWidth={2.4} />
      </span>
      <span className={`text-[15px] font-bold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
        LABFLOW <span className="text-blue-600">PRO</span>
      </span>
    </button>
  );
}
