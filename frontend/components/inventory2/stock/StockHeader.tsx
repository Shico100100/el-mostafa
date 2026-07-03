'use client';

export function StockHeader({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="px-8 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">تقرير المخزون</h1>
          <p className="text-sm text-slate-400 mt-1"><span id="stock-count">0</span> سجل</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => onNavigate('/inventory2/stock/transfer')}
            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/20 transition flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> تحويل
          </button>
          <button onClick={() => onNavigate('/inventory2/stock/adjust')}
            className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-4 py-2.5 rounded-xl border border-purple-500/20 transition flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg> تسوية
          </button>
          <button onClick={() => onNavigate('/inventory2/semi-finished')}
            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/20 transition flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> بلاستيك
          </button>
          <button onClick={() => onNavigate('/inventory2/stock/movements')}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-2.5 rounded-xl border border-white/10 transition flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> الحركات
          </button>
        </div>
      </div>
    </header>
  );
}
