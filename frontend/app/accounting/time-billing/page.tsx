'use client';

import { useTimeBilling } from '@/hooks/accounting/useTimeBilling';
import { Clock, Timer } from 'lucide-react';

export default function TimeBillingPage() {
  const h = useTimeBilling();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const totalUnbilledHours = h.unbilled.reduce((s: number, e: any) => s + Number(e.hours), 0);
  const totalUnbilledValue = h.unbilled.reduce((s: number, e: any) => s + Number(e.hours) * Number(e.billing_rate), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2"><Clock className="w-8 h-8 text-teal-400" />الوقت والفواتير</h1>
        <p className="text-gray-400 mb-8">تتبع ساعات العمل والحساب عليها</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"><p className="text-gray-400 text-sm">إجمالي السجلات</p><p className="text-2xl font-bold text-white mt-1">{h.entries.length} سجل</p></div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"><p className="text-gray-400 text-sm">ساعات غير مفوترة</p><p className="text-2xl font-bold text-yellow-400 mt-1">{totalUnbilledHours} ساعة</p></div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"><p className="text-gray-400 text-sm">قيمة غير مفوترة</p><p className="text-2xl font-bold text-green-400 mt-1">{totalUnbilledValue.toLocaleString()} ج.م</p></div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 text-right">التاريخ</th><th className="py-3 px-4 text-right">المشروع</th><th className="py-3 px-4 text-right">الساعات</th><th className="py-3 px-4 text-right">الوصف</th><th className="py-3 px-4 text-right">قابل للفوترة</th><th className="py-3 px-4 text-right">تم الفوترة</th>
              </tr></thead>
              <tbody>
                {h.entries.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-gray-500">لا توجد سجلات وقت</td></tr>
                ) : h.entries.map((e: any) => (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 px-4 text-white">{new Date(e.date).toLocaleDateString('ar')}</td>
                    <td className="py-3 px-4 text-gray-300">{e.job?.name || '-'}</td>
                    <td className="py-3 px-4 text-teal-400 font-semibold">{e.hours} س</td>
                    <td className="py-3 px-4 text-gray-400 text-xs max-w-[200px] truncate">{e.description || '-'}</td>
                    <td className="py-3 px-4">{e.is_billable ? <Timer className="w-4 h-4 text-green-400" /> : <span className="text-gray-500">-</span>}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${e.is_billed ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{e.is_billed ? 'مفوترة' : 'غير مفوترة'}</span></td>
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
