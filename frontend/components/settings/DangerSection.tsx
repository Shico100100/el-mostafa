'use client';

import { AlertTriangle } from 'lucide-react';

interface Props {
  resetLoading: boolean;
  onFactoryReset: () => void;
}

export function DangerSection({ resetLoading, onFactoryReset }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-red-500/30">
      <h3 className="text-xl font-bold text-red-400 mb-4">منطقة الخطر</h3>
      <div className="space-y-4">
        <button onClick={onFactoryReset} disabled={resetLoading}
          className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-lg transition border border-red-500/50 text-right hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50">
          {resetLoading ? 'جاري الحذف...' : <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> حذف جميع البيانات (ضبط المصنع)</span>}
        </button>
        <p className="text-xs text-red-400/60 mt-2 px-2">
          * هذا الإجراء سيقوم بحذف كافة السجلات وإعادة النظام للبدء من الصفر.
        </p>
      </div>
    </div>
  );
}
