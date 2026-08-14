'use client';
import { useState } from 'react';
import { usePeriodClose } from '@/hooks/accounting/usePeriodClose';
import { Lock, Unlock } from 'lucide-react';

export default function PeriodClosePage() {
  const h = usePeriodClose();
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().substring(0, 7));
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2"><Lock className="w-8 h-8 text-red-400" />إغلاق الفترات المحاسبية</h1>
        <p className="text-gray-400 mb-8">إدارة إغلاق وفتح الفترات المحاسبية الشهرية</p>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <h3 className="text-white font-semibold mb-4">إغلاق فترة جديدة</h3>
          <div className="flex gap-4 items-end">
            <div><label className="text-gray-400 text-sm">الفترة</label><input type="month" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
            <button onClick={() => h.closePeriod(selectedPeriod)} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"><Lock className="w-4 h-4" /> إغلاق</button>
          </div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 text-right">الفترة</th><th className="py-3 px-4 text-right">الحالة</th><th className="py-3 px-4 text-right">أغلقها</th><th className="py-3 px-4 text-right">تاريخ الإغلاق</th><th className="py-3 px-4 text-right">إجراء</th>
              </tr></thead>
              <tbody>
                {h.periods.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">لا توجد فترات مسجلة</td></tr>
                ) : h.periods.map((p) => (
                  <tr key={p.id} className="border-b border-white/5">
                    <td className="py-3 px-4 text-white font-semibold">{p.period}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${p.status === 'CLOSED' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>{p.status === 'CLOSED' ? 'مغلقة' : 'مفتوحة'}</span></td>
                    <td className="py-3 px-4 text-gray-300">{p.closed_by || '-'}</td>
                    <td className="py-3 px-4 text-gray-400">{p.closed_at ? new Date(p.closed_at).toLocaleString('ar') : '-'}</td>
                    <td className="py-3 px-4">
                      {p.status === 'CLOSED' ? (
                        <button onClick={() => h.reopenPeriod(p.period)} className="text-green-400 hover:text-green-300 flex items-center gap-1 text-xs"><Unlock className="w-4 h-4" /> فتح</button>
                      ) : (
                        <button onClick={() => h.closePeriod(p.period)} className="text-red-400 hover:text-red-300 flex items-center gap-1 text-xs"><Lock className="w-4 h-4" /> إغلاق</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
