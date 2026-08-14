'use client';

import { useSerialNumbers } from '@/hooks/inventory2/useSerialNumbers';
import { Hash, Plus, Trash2 } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  AVAILABLE: { label: 'متاح', color: 'bg-green-500/20 text-green-400' },
  SOLD: { label: 'مباع', color: 'bg-blue-500/20 text-blue-400' },
  RESERVED: { label: 'محجوز', color: 'bg-yellow-500/20 text-yellow-400' },
  DEFECTIVE: { label: 'معيب', color: 'bg-red-500/20 text-red-400' },
};

export default function SerialNumbersPage() {
  const h = useSerialNumbers();
  if (h.loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-xl">جاري التحميل...</div></div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Hash className="w-8 h-8 text-indigo-400" />الأرقام التسلسلية</h1>
            <p className="text-gray-400 mt-1">تتبع الأرقام التسلسلية للمنتجات</p>
          </div>
          <button onClick={() => h.setShowModal(true)} className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition flex items-center gap-2">
            <Plus className="w-5 h-5" />رقم جديد
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-6">
          {['', 'AVAILABLE', 'SOLD', 'RESERVED', 'DEFECTIVE'].map(s => (
            <button key={s} onClick={() => h.setFilterStatus(s)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${h.filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
              {s ? STATUS_MAP[s]?.label : 'الكل'}
            </button>
          ))}
        </div>

        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-400 border-b border-white/10">
                <th className="py-3 px-4 text-right">الرقم التسلسلي</th>
                <th className="py-3 px-4 text-right">رقم المنتج</th>
                <th className="py-3 px-4 text-right">رقم التشغيلة</th>
                <th className="py-3 px-4 text-right">الحالة</th>
                <th className="py-3 px-4 text-right">إجراءات</th>
              </tr></thead>
              <tbody>
                {h.items.length === 0 ? (
                  <tr><td colSpan={5} className="py-12 text-center text-gray-500">لا توجد أرقام تسلسلية</td></tr>
                ) : h.items.map((item) => {
                  const st = STATUS_MAP[item.status] || { label: item.status, color: 'bg-gray-500/20 text-gray-400' };
                  return (
                    <tr key={item.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-indigo-400 font-mono font-bold">{item.serial_number}</td>
                      <td className="py-3 px-4 text-white">{item.product_id}</td>
                      <td className="py-3 px-4 text-gray-400">{item.batch_number || '-'}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs ${st.color}`}>{st.label}</span></td>
                      <td className="py-3 px-4">
                        <button onClick={() => h.remove(item.id)} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {h.showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => h.setShowModal(false)}>
          <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-6">رقم تسلسلي جديد</h2>
            <form onSubmit={h.create}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-gray-400 text-sm">رقم المنتج</label><input type="number" value={h.form.product_id || ''} onChange={e => h.setForm({ ...h.form, product_id: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">الرقم التسلسلي</label><input type="text" value={h.form.serial_number} onChange={e => h.setForm({ ...h.form, serial_number: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" required /></div>
                <div><label className="text-gray-400 text-sm">رقم التشغيلة</label><input type="text" value={h.form.batch_number} onChange={e => h.setForm({ ...h.form, batch_number: e.target.value })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
                <div><label className="text-gray-400 text-sm">رقم المخزن</label><input type="number" value={h.form.warehouse_id || ''} onChange={e => h.setForm({ ...h.form, warehouse_id: parseInt(e.target.value) || 0 })} className="w-full mt-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" /></div>
              </div>
              <div className="flex gap-3 mt-6">
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition">إنشاء</button>
                <button type="button" onClick={() => h.setShowModal(false)} className="flex-1 py-3 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
