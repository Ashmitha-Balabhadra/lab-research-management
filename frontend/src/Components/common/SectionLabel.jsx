export function SectionLabel({ children }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">{children}</p>
      <div className="mt-2 h-px bg-slate-200" />
    </div>
  );
}
