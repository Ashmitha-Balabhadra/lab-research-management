export function ToastStack({ toasts }) {
  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 w-80 max-w-[90vw]">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg border px-4 py-3 shadow-lg text-sm font-medium bg-white animate-[fadeIn_0.2s_ease-out] ${
            t.tone === "success"
              ? "border-emerald-200 text-emerald-700"
              : t.tone === "error"
              ? "border-red-200 text-red-700"
              : "border-slate-200 text-slate-700"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
