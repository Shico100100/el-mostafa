'use client';

export function AdjustHeader({ onBack }: { onBack: () => void }) {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="px-8 py-5 flex items-center gap-4">
        <button onClick={onBack}
          className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-black text-white">تسوية المخزون</h1>
          <p className="text-sm text-slate-400 mt-1">تعديل الكمية الفعلية للمنتج في المخزن</p>
        </div>
      </div>
    </header>
  );
}
