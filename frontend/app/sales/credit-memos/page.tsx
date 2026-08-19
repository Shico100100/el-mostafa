'use client';
import { useSalesCreditMemos } from '@/hooks/sales/useSalesCreditMemos';
import { Receipt } from 'lucide-react';

export default function SalesCreditMemosPage() {
  const h = useSalesCreditMemos();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2"><Receipt className="w-8 h-8 text-orange-400" />الإشعارات الدائنة - المبيعات</h1>
        <p className="text-[#6b8378] mb-8">إدارة إشعارات الدائنة للعملاء</p>

        <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                <th className="py-3 px-4 text-right">رقم</th><th className="py-3 px-4 text-right">التاريخ</th><th className="py-3 px-4 text-right">العميل</th><th className="py-3 px-4 text-right">المبلغ</th><th className="py-3 px-4 text-right">السبب</th><th className="py-3 px-4 text-right">الحالة</th>
              </tr></thead>
              <tbody>
                {h.memos.length === 0 ? (
                  <tr><td colSpan={6} className="py-12 text-center text-[#6b8378]">لا توجد إشعارات دائنة</td></tr>
                ) : h.memos.map((m) => (
                  <tr key={m.id} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                    <td className="py-3 px-4 text-white font-mono">#{m.id}</td>
                    <td className="py-3 px-4 text-[#ecfdf5]">{new Date(m.date).toLocaleDateString('ar')}</td>
                    <td className="py-3 px-4 text-white">{m.customer?.name || '-'}</td>
                    <td className="py-3 px-4 text-orange-400 font-semibold">{Number(m.total_amount).toLocaleString()} ج.م</td>
                    <td className="py-3 px-4 text-[#6b8378]">{m.reason || '-'}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${m.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{m.status === 'APPROVED' ? 'معتمد' : 'قيد المراجعة'}</span></td>
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
