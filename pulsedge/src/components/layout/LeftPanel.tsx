export function LeftPanel() {
  return (
    <aside className="hidden lg:flex flex-col w-[180px] shrink-0 pt-6 px-4">
      <div className="sticky top-24">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3">
          Announcements
        </p>
        <div className="rounded-xl border border-dashed border-slate-800 px-4 py-6 text-center">
          <p className="text-xs text-slate-600 leading-relaxed">
            Announcements<br />coming soon
          </p>
        </div>
      </div>
    </aside>
  );
}
