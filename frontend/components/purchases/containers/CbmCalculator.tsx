'use client';

import { Calculator, Check, X } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import type { CbmResult } from '@/components/purchases/containers/types';

interface CbmCalculatorProps {
  cbmLength: string;
  cbmWidth: string;
  cbmHeight: string;
  cbmCartons: string;
  cbmResult: CbmResult | null;
  cbmCalculating: boolean;
  onLengthChange: (v: string) => void;
  onWidthChange: (v: string) => void;
  onHeightChange: (v: string) => void;
  onCartonsChange: (v: string) => void;
  onCalculate: () => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function CbmCalculator({
  cbmLength, cbmWidth, cbmHeight, cbmCartons, cbmResult, cbmCalculating,
  onLengthChange, onWidthChange, onHeightChange, onCartonsChange, onCalculate,
}: CbmCalculatorProps) {
  return (
    <GlassPanel title="حساب حجم الشحنة (CBM)">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          <div>
            <label className={labelClass}>طول الكرتونة (سم)</label>
            <input className={inputClass} type="number" value={cbmLength} onChange={e => onLengthChange(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>عرض الكرتونة (سم)</label>
            <input className={inputClass} type="number" value={cbmWidth} onChange={e => onWidthChange(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>ارتفاع الكرتونة (سم)</label>
            <input className={inputClass} type="number" value={cbmHeight} onChange={e => onHeightChange(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>عدد الكراتين</label>
            <input className={inputClass} type="number" value={cbmCartons} onChange={e => onCartonsChange(e.target.value)} min="1" />
          </div>
          <div className="flex items-end">
            <button onClick={onCalculate} disabled={cbmCalculating}
              className="w-full px-4 py-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition disabled:opacity-50">
              {cbmCalculating ? '...' : 'احسب'}
            </button>
          </div>
        </div>

        {cbmResult && (
          <div className="bg-white/5 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-amber-400">{cbmResult.total_cbm.toFixed(3)}</div>
                <div className="text-sm text-gray-400">إجمالي CBM</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{cbmResult.cartons_count}</div>
                <div className="text-sm text-gray-400">عدد الكراتين</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">{cbmResult.carton_volume_cm3.toLocaleString()}</div>
                <div className="text-sm text-gray-400">حجم الكرتونة (سم³)</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">
                  {cbmResult.carton_dimensions.length_cm} × {cbmResult.carton_dimensions.width_cm} × {cbmResult.carton_dimensions.height_cm} سم
                </div>
                <div className="text-xs text-gray-500">أبعاد الكرتونة</div>
              </div>
            </div>

            {cbmResult.container_suggestions.length > 0 && (
              <div>
                <h3 className="text-white font-bold mb-3">مقارنة الحاويات</h3>
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                      <th className="text-right px-4 py-3">الحاوية</th>
                      <th className="text-center px-4 py-3">السعة القصوى (CBM)</th>
                      <th className="text-center px-4 py-3">الاستخدام %</th>
                      <th className="text-center px-4 py-3">المساحة المتبقية (CBM)</th>
                      <th className="text-center px-4 py-3">تناسب؟</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cbmResult.container_suggestions.map((s) => (
                      <tr key={s.id} className={`border-b border-white/5 ${s.fits ? 'bg-green-500/5' : ''}`}>
                        <td className="px-4 py-3 text-gray-300">{s.name}</td>
                        <td className="px-4 py-3 text-center text-gray-300">{s.max_cbm.toFixed(3)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${s.utilization_pct > 90 ? 'bg-red-500' : s.utilization_pct > 70 ? 'bg-amber-500' : 'bg-green-500'}`}
                                style={{ width: `${Math.min(s.utilization_pct, 100)}%` }} />
                            </div>
                            <span className="text-xs text-gray-400">{s.utilization_pct.toFixed(1)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{s.remaining_cbm.toFixed(3)}</td>
                        <td className="px-4 py-3 text-center">
                          {s.fits ? <span className="text-green-400 font-bold"><Check className="w-4 h-4 inline" /></span> : <span className="text-red-400"><X className="w-4 h-4 inline" /></span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
