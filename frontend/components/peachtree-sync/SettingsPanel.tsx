'use client';

import {
  Settings,
  Database,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';

type Hook = ReturnType<typeof usePeachtreeSync>;

export function SettingsPanel({ h }: { h: Hook }) {
  return (
    <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 max-w-3xl">
      <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
        <Settings className="w-5 h-5 text-sky-400" />
        إعدادات الاتصال
      </h2>
      <div className="flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 w-full">
          <label className="text-[#6b8378] text-sm">
            DSN / مسار قاعدة البيانات
          </label>
          <input
            type="text"
            value={h.dsn}
            onChange={(e) => h.setDsn(e.target.value)}
            placeholder="D:\OneDrive\Mostafaapp"
            className="w-full mt-1 px-4 py-3 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white font-mono text-sm"
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={h.saveConfig}
            className="px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition whitespace-nowrap"
          >
            حفظ
          </button>
          <button
            onClick={h.testConnection}
            disabled={h.testing}
            title="يختبر الاتصال بقاعدة Peachtree دون تغيير أي بيانات"
            className="px-6 py-3 bg-[#121a16] text-white rounded-lg font-semibold hover:bg-white/20 transition whitespace-nowrap flex items-center gap-2 disabled:opacity-50"
          >
            {h.testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            <span>{h.testing ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
          </button>
        </div>
      </div>
      {h.connected === true && (
        <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          الاتصال ناجح — DSN: {h.dsn}
        </p>
      )}
      {h.connected === false && (
        <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
          <XCircle className="w-4 h-4" />
          فشل الاتصال — {h.connectionError || 'تأكد من تثبيت Pervasive PSQL ODBC driver'}
        </p>
      )}
    </div>
  );
}
