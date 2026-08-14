'use client';

import { useJobs } from '@/hooks/accounting/useJobs';
import { Briefcase, Plus, TrendingUp, TrendingDown } from 'lucide-react';

export default function JobsPage() {
  const h = useJobs();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Briefcase className="w-8 h-8 text-cyan-400" />تكاليف المشاريع</h1>
            <p className="text-gray-400 mt-1">تتبع تكاليف المشاريع وربحية كل مشروع</p>
          </div>
          <button onClick={() => h.setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:from-cyan-700 hover:to-blue-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" /> مشروع جديد
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {h.jobs.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-12">لا توجد مشاريع</div>
          ) : h.jobs.map((j) => {
            const profit = Number(j.estimated_revenue) - Number(j.actual_cost);
            return (
              <div key={j.id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 hover:border-cyan-500/30 transition">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400 font-mono">{j.code}</span>
                  <span className={`px-2 py-1 rounded-full text-xs ${j.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : j.status === 'COMPLETED' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'}`}>
                    {j.status === 'ACTIVE' ? 'نشط' : j.status === 'COMPLETED' ? 'مكتمل' : 'ملغي'}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-lg mb-4">{j.name}</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-gray-400 text-xs">التكلفة الفعلية</p><p className="text-orange-400 font-bold">{Number(j.actual_cost).toLocaleString()} ج.م</p></div>
                  <div><p className="text-gray-400 text-xs">الإيراد المقدر</p><p className="text-blue-400 font-bold">{Number(j.estimated_revenue).toLocaleString()} ج.م</p></div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-gray-400 text-xs">صافي الربح</span>
                  <span className={`font-bold flex items-center gap-1 ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {profit.toLocaleString()} ج.م
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {h.showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => h.setShowModal(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">إنشاء مشروع جديد</h2>
            <form onSubmit={h.handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-gray-400 text-sm">اسم المشروع</label><input type="text" value={h.form.name} onChange={e => h.setForm({ ...h.form, name: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">الكود</label><input type="text" value={h.form.code} onChange={e => h.setForm({ ...h.form, code: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">التكلفة المقدرة</label><input type="number" value={h.form.estimated_cost || ''} onChange={e => h.setForm({ ...h.form, estimated_cost: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
                <div><label className="text-gray-400 text-sm">الإيراد المقدر</label><input type="number" value={h.form.estimated_revenue || ''} onChange={e => h.setForm({ ...h.form, estimated_revenue: parseFloat(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
              </div>
              <div className="mt-4"><label className="text-gray-400 text-sm">الوصف</label><textarea value={h.form.description} onChange={e => h.setForm({ ...h.form, description: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white h-20" /></div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 py-3 bg-cyan-600 text-white rounded-lg font-semibold hover:bg-cyan-700 transition">إنشاء</button>
                <button type="button" onClick={() => h.setShowModal(false)} className="flex-1 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
