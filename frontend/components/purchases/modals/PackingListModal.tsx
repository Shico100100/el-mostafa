'use client';

import { ClipboardList, X, Check, CircleAlert } from 'lucide-react';
import type { PackingListForm } from '@/components/purchases/types';

interface PackingListModalProps {
  show: boolean;
  form: PackingListForm;
  result: Record<string, unknown> | null;
  saving: boolean;
  onClose: () => void;
  onFormChange: (form: PackingListForm) => void;
  onSave: () => void;
}

export default function PackingListModal({
  show, form, result, saving, onClose, onFormChange, onSave,
}: PackingListModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardList className="w-5 h-5" /> قائمة التعبئة (Packing List)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">طول الكرتونة (سم)</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" value={form.carton_length_cm} onChange={e => onFormChange({ ...form, carton_length_cm: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">عرض الكرتونة (سم)</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" value={form.carton_width_cm} onChange={e => onFormChange({ ...form, carton_width_cm: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">ارتفاع الكرتونة (سم)</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" value={form.carton_height_cm} onChange={e => onFormChange({ ...form, carton_height_cm: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">عدد الكراتين</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" value={form.cartons_count} onChange={e => onFormChange({ ...form, cartons_count: e.target.value })} min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">حد الانحراف (%)</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" step="0.1" value={form.deviation_threshold_percent} onChange={e => onFormChange({ ...form, deviation_threshold_percent: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">الوزن الصافي الفعلي (كجم) — Net Weight</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" step="0.01" value={form.actual_net_weight_kg} onChange={e => onFormChange({ ...form, actual_net_weight_kg: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">الوزن الإجمالي الفعلي (كجم) — Gross Weight</label>
              <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" type="number" step="0.01" value={form.actual_gross_weight_kg} onChange={e => onFormChange({ ...form, actual_gross_weight_kg: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">ملاحظات</label>
            <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-teal-500" value={form.notes} onChange={e => onFormChange({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end">
            <button
              onClick={onSave}
              disabled={saving}
              className="px-6 py-3 bg-teal-500/20 text-purple-300 rounded-xl border border-teal-500/30 hover:bg-teal-500/30 transition disabled:opacity-50"
            >
              {saving ? 'جاري الحفظ...' : 'حساب وتحليل'}
            </button>
          </div>

          {result && (() => {
            const pl = result.packing_list as Record<string, unknown> | undefined;
            const cbm = result.cbm_analysis as Record<string, unknown> | undefined;
            const alert = result.deviation_alert as Record<string, unknown> | undefined;
            return (
              <div className="bg-white/5 rounded-xl p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">
                      {pl?.total_cbm ? Number(pl.total_cbm).toFixed(3) : '—'}
                    </div>
                    <div className="text-sm text-gray-400">إجمالي CBM</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">
                      {String(pl?.cartons_count || 0)}
                    </div>
                    <div className="text-sm text-gray-400">عدد الكراتين</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">
                      {pl?.actual_net_weight_kg ? `${Number(pl.actual_net_weight_kg).toFixed(2)}` : '—'}
                    </div>
                    <div className="text-sm text-gray-400">الوزن الصافي (كجم)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-amber-400">
                      {pl?.actual_gross_weight_kg ? `${Number(pl.actual_gross_weight_kg).toFixed(2)}` : '—'}
                    </div>
                    <div className="text-sm text-gray-400">الوزن الإجمالي (كجم)</div>
                  </div>
                </div>

                {(cbm?.container_suggestions as Array<Record<string, unknown>> | undefined) && (
                  <div>
                    <h3 className="text-white font-bold mb-3">مقارنة الحاويات</h3>
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-white/10 text-gray-400 text-sm">
                          <th className="text-right px-4 py-3">الحاوية</th>
                          <th className="text-center px-4 py-3">السعة (CBM)</th>
                          <th className="text-center px-4 py-3">الاستخدام %</th>
                          <th className="text-center px-4 py-3">المساحة المتبقية</th>
                          <th className="text-center px-4 py-3">تناسب؟</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(cbm?.container_suggestions as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => (
                          <tr key={String(s.id)} className={`border-b border-white/5 ${s.fits ? 'bg-green-500/5' : ''}`}>
                            <td className="px-4 py-3 text-gray-300">{String(s.name)}</td>
                            <td className="px-4 py-3 text-center text-gray-300">{Number(s.max_cbm).toFixed(3)}</td>
                            <td className="px-4 py-3 text-center">{Number(s.utilization_pct).toFixed(1)}%</td>
                            <td className="px-4 py-3 text-center text-gray-300">{Number(s.remaining_cbm).toFixed(3)}</td>
                            <td className="px-4 py-3 text-center">{s.fits ? <span className="text-green-400 font-bold"><Check className="w-4 h-4 inline" /></span> : <span className="text-red-400"><X className="w-4 h-4 inline" /></span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {alert && (
                  <div className={`rounded-xl p-4 ${String(alert.severity) === 'HIGH' ? 'bg-red-500/20 border border-red-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{String(alert.severity) === 'HIGH' ? <CircleAlert className="w-6 h-6 text-red-500" /> : <CircleAlert className="w-6 h-6 text-amber-500" />}</span>
                      <div>
                        <div className="text-white font-bold">
                          {String(alert.type) === 'WEIGHT_DEVIATION' ? 'تنبيه انحراف الوزن' : 'تنبيه'}
                        </div>
                        <div className="text-gray-300 text-sm">{String(alert.message)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-[#ecfdf5]0/20 text-gray-300 rounded-lg hover:bg-[#ecfdf5]0/30 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
