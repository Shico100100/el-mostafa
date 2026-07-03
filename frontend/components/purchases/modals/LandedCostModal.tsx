'use client';

import { BarChart3, X } from 'lucide-react';
import type { LandedCostData } from '@/components/purchases/types';

interface LandedCostModalProps {
  show: boolean;
  form: { freight_cost: number; customs_percent: number; commission_percent: number; total_weight_kg: number };
  data: LandedCostData | null;
  calculating: boolean;
  onClose: () => void;
  onFormChange: (form: LandedCostModalProps['form']) => void;
  onCalculate: () => void;
}

export default function LandedCostModal({
  show, form, data, calculating, onClose, onFormChange, onCalculate,
}: LandedCostModalProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><BarChart3 className="w-5 h-5" /> حساب التكلفة الكلية (Landed Cost)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">تكلفة الشحن (EGP)</label>
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="number"
                value={form.freight_cost}
                onChange={e => onFormChange({ ...form, freight_cost: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">نسبة الجمارك (%)</label>
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="number"
                step="0.01"
                value={form.customs_percent}
                onChange={e => onFormChange({ ...form, customs_percent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">نسبة العمولة (%)</label>
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="number"
                step="0.01"
                value={form.commission_percent}
                onChange={e => onFormChange({ ...form, commission_percent: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">الوزن الإجمالي (كجم)</label>
              <input
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                type="number"
                step="0.001"
                value={form.total_weight_kg}
                onChange={e => onFormChange({ ...form, total_weight_kg: Number(e.target.value) })}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onCalculate}
              disabled={calculating}
              className="px-6 py-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition disabled:opacity-50"
            >
              {calculating ? 'جاري الحساب...' : 'حساب التكلفة الكلية'}
            </button>
          </div>

          {data && data.breakdown && (
            <div className="bg-white/5 rounded-xl p-4 space-y-2">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{Number(data.total_landed_cost).toLocaleString()}</div>
                  <div className="text-sm text-gray-400">إجمالي التكلفة الكلية (EGP)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{data.fx_rate}</div>
                  <div className="text-sm text-gray-400">سعر الصرف</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{data.freight_cost?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-400">تكلفة الشحن</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{data.total_weight_kg}</div>
                  <div className="text-sm text-gray-400">الوزن (كجم)</div>
                </div>
              </div>

              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="text-right px-4 py-3">المنتج</th>
                    <th className="text-center px-4 py-3">الكمية</th>
                    <th className="text-center px-4 py-3">السعر الأساسي (EGP)</th>
                    <th className="text-center px-4 py-3">العمولة</th>
                    <th className="text-center px-4 py-3">الجمارك</th>
                    <th className="text-center px-4 py-3">الشحن</th>
                    <th className="text-center px-4 py-3">تكلفة الوحدة الكلية</th>
                    <th className="text-center px-4 py-3">الإجمالي</th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map((b, idx) => (
                    <tr key={b.item_id || idx} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="px-4 py-3 text-gray-300">{b.product_name}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{b.quantity}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{b.base_cost_egp.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{b.commission.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{b.customs.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{b.shipping.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-white font-bold">{b.unit_landed_cost.toFixed(2)}</td>
                      <td className="px-4 py-3 text-center text-amber-400 font-bold">{b.total_landed_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/20">
                    <td colSpan={7} className="px-4 py-3 text-left text-white font-bold">الإجمالي النهائي</td>
                    <td className="px-4 py-3 text-center text-amber-400 font-bold text-lg">
                      {Number(data.total_landed_cost).toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
