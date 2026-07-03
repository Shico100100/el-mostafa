'use client';

import { useDashboard } from '@/lib/dashboard/dashboard-context';

export function CustomizeDialog() {
  const { config, togglePanel, movePanel, movePanelToColumn, resetDefaults, setIsCustomizing } = useDashboard();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl border border-white/10 w-full max-w-lg mx-4 max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-white font-bold text-lg">تخصيص لوحة المعلومات</h2>
          <button
            onClick={() => setIsCustomizing(false)}
            className="text-slate-400 hover:text-white transition p-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <p className="text-xs text-slate-400 mb-2">اختر المربعات الظاهرة ورتبها حسب الأولوية:</p>

          {config.panels.sort((a, b) => a.order - b.order).map((panel, idx) => (
            <div
              key={panel.id}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${panel.visible ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5 opacity-50'}`}
            >
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => movePanel(panel.id, 'up')}
                  disabled={idx === 0}
                  className="text-slate-500 hover:text-white disabled:opacity-30 transition p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => movePanel(panel.id, 'down')}
                  disabled={idx === config.panels.length - 1}
                  className="text-slate-500 hover:text-white disabled:opacity-30 transition p-0.5"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-200 font-medium">{panel.title}</p>
                <div className="flex gap-1 mt-1.5">
                  {([1, 2, 3] as const).map((col) => (
                    <button
                      key={col}
                      onClick={() => movePanelToColumn(panel.id, col)}
                      className={`text-[10px] px-2 py-0.5 rounded-md transition ${panel.column === col ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' : 'bg-white/5 text-slate-500 border border-white/5 hover:text-slate-300'}`}
                    >
                      عمود {col}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => togglePanel(panel.id)}
                className={`relative w-10 h-5 rounded-full transition-all ${panel.visible ? 'bg-blue-500' : 'bg-white/10'}`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${panel.visible ? 'right-0.5' : 'left-0.5'}`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
          <button
            onClick={resetDefaults}
            className="text-xs text-slate-400 hover:text-slate-200 transition px-3 py-1.5 bg-white/5 rounded-lg"
          >
            إعادة الضبط الافتراضي
          </button>
          <button
            onClick={() => setIsCustomizing(false)}
            className="px-5 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-xl text-sm font-medium transition border border-blue-500/20"
          >
            تم
          </button>
        </div>
      </div>
    </div>
  );
}
