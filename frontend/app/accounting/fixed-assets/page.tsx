'use client';
import { useState } from 'react';
import { useFixedAssets } from '@/hooks/accounting/useFixedAssets';
import { Landmark, Plus } from 'lucide-react';

export default function FixedAssetsPage() {
  const h = useFixedAssets();
  const [period] = useState(new Date().toISOString().substring(0, 7));
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const totalCost = h.assets.reduce((s: number, a: any) => s + Number(a.purchase_cost), 0);
  const totalAccumDepr = h.assets.reduce((s: number, a: any) => s + Number(a.accumulated_depreciation), 0);
  const totalBookValue = h.assets.reduce((s: number, a: any) => s + Number(a.book_value), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Landmark className="w-8 h-8 text-indigo-400" />الأصول الثابتة</h1>
            <p className="text-gray-400 mt-1">إدارة الأصول الثابتة والحسابات الإهلاك</p>
          </div>
          <button onClick={() => h.setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة أصل
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"><p className="text-gray-400 text-sm">إجمالي التكلفة</p><p className="text-2xl font-bold text-white mt-1">{totalCost.toLocaleString()} ج.م</p></div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"><p className="text-gray-400 text-sm">إجمالي الإهلاك المتراكم</p><p className="text-2xl font-bold text-orange-400 mt-1">{totalAccumDepr.toLocaleString()} ج.م</p></div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6"><p className="text-gray-400 text-sm">صافي القيمة الدفترية</p><p className="text-2xl font-bold text-green-400 mt-1">{totalBookValue.toLocaleString()} ج.م</p></div>
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 text-right">الكود</th><th className="py-3 px-4 text-right">الاسم</th><th className="py-3 px-4 text-right">الفئة</th><th className="py-3 px-4 text-right">التكلفة</th><th className="py-3 px-4 text-right">الإهلاك</th><th className="py-3 px-4 text-right">القيمة الدفترية</th><th className="py-3 px-4 text-right">الحالة</th><th className="py-3 px-4 text-right">إجراء</th>
              </tr></thead>
              <tbody>
                {h.assets.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-gray-500">لا توجد أصول ثابتة</td></tr>
                ) : h.assets.map((a: any) => (
                  <tr key={a.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="py-3 px-4 text-white font-mono">{a.asset_code}</td>
                    <td className="py-3 px-4 text-white">{a.name}</td>
                    <td className="py-3 px-4 text-gray-300">{a.category || '-'}</td>
                    <td className="py-3 px-4 text-white">{Number(a.purchase_cost).toLocaleString()} ج.م</td>
                    <td className="py-3 px-4 text-orange-400">{Number(a.accumulated_depreciation).toLocaleString()} ج.م</td>
                    <td className="py-3 px-4 text-green-400 font-semibold">{Number(a.book_value).toLocaleString()} ج.م</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${a.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{a.status === 'ACTIVE' ? 'نشط' : 'تم التصفية'}</span></td>
                    <td className="py-3 px-4">
                      {a.status === 'ACTIVE' && <button onClick={() => h.depreciate(a.id, period)} className="text-indigo-400 hover:text-indigo-300 text-xs">إهلاك</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {h.showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => h.setShowModal(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">إضافة أصل ثابت</h2>
            <form onSubmit={h.handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-gray-400 text-sm">الاسم</label><input type="text" value={h.form.name} onChange={e => h.setForm({ ...h.form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">الكود</label><input type="text" value={h.form.asset_code} onChange={e => h.setForm({ ...h.form, asset_code: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">الفئة</label><input type="text" value={h.form.category} onChange={e => h.setForm({ ...h.form, category: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="مبنى، مركبة، معدات..." /></div>
                <div><label className="text-gray-400 text-sm">تاريخ الشراء</label><input type="date" value={h.form.purchase_date} onChange={e => h.setForm({ ...h.form, purchase_date: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">التكلفة</label><input type="number" value={h.form.purchase_cost || ''} onChange={e => h.setForm({ ...h.form, purchase_cost: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">القيمة التخليضية</label><input type="number" value={h.form.salvage_value || ''} onChange={e => h.setForm({ ...h.form, salvage_value: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
                <div><label className="text-gray-400 text-sm">العمر الإنتاجي (سنوات)</label><input type="number" value={h.form.useful_life_years} onChange={e => h.setForm({ ...h.form, useful_life_years: parseInt(e.target.value) || 5 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
                <div><label className="text-gray-400 text-sm">طريقة الإهلاك</label><select value={h.form.depreciation_method} onChange={e => h.setForm({ ...h.form, depreciation_method: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"><option value="STRAIGHT_LINE">القسط الثابت</option><option value="DECLINING_BALANCE">القيمة الدفترية</option></select></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">حفظ</button>
                <button type="button" onClick={() => h.setShowModal(false)} className="flex-1 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
