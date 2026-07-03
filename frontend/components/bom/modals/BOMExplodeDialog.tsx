'use client';

import Image from 'next/image';
import { X, Hammer, FileText } from 'lucide-react';
import GlassPanel from '@/components/ui/GlassPanel';
import type { BOM, ExplosionResult, CostResult } from '../types';

interface BOMExplodeDialogProps {
  bom: BOM;
  getProductName: (id: number) => string;
  explodeQuantity: string;
  onExplodeQuantityChange: (v: string) => void;
  exploding: boolean;
  explosionResult: ExplosionResult | null;
  costResult: CostResult | null;
  onExplode: () => void;
  onGeneratePDF: (result: ExplosionResult) => void;
  onClose: () => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function BOMExplodeDialog({
  bom, getProductName, explodeQuantity, onExplodeQuantityChange,
  exploding, explosionResult, costResult, onExplode, onGeneratePDF, onClose,
}: BOMExplodeDialogProps) {
  const ppc = explosionResult?.pcs_per_carton || bom.pcs_per_carton || 1;
  const ppb = explosionResult?.pcs_per_box || bom.pcs_per_box || 1;
  const totalPieces = explosionResult ? explosionResult.requested_quantity * ppc : 0;
  const totalBoxes = totalPieces > 0 ? Math.ceil(totalPieces / ppb) : 0;
  const revenue = explosionResult ? (explosionResult.product_selling_price || 0) * totalPieces : 0;
  const totalCost = costResult?.total_cost ?? 0;
  const profit = revenue - totalCost;
  const profitPerPiece = totalPieces > 0 ? profit / totalPieces : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">تفجير BOM: {bom.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className={labelClass}>المنتج: {bom.product?.name || getProductName(bom.product_id)}</label>
            </div>
            <div className="w-36">
              <label className={labelClass}>عدد الكراتين</label>
              <input className={inputClass} type="number" value={explodeQuantity} onChange={e => onExplodeQuantityChange(e.target.value)} min="1" />
            </div>
            <button onClick={onExplode} disabled={exploding} className="px-6 py-3 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition disabled:opacity-50">
              {exploding ? 'جاري التفجير...' : <span className="flex items-center gap-1"><Hammer className="w-4 h-4" /> تفجير</span>}
            </button>
          </div>

          {explosionResult && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-xl p-4 text-center border border-emerald-500/20">
                  <div className="text-2xl font-bold text-emerald-400">{explosionResult.requested_quantity}</div>
                  <div className="text-sm text-gray-400">عدد الكراتين</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400">{totalPieces.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">إجمالي القطع</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-purple-400">{totalBoxes.toLocaleString()}</div>
                  <div className="text-sm text-gray-400">عدد العلب</div>
                </div>
                <div className="bg-white/5 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-amber-400">{explosionResult.total_components}</div>
                  <div className="text-sm text-gray-400">عدد المكونات</div>
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {ppc} قطع/كرتونة &nbsp;|&nbsp; {ppb} قطع/علبة &nbsp;|&nbsp; إجمالي الوزن: {(explosionResult.total_weight_kg ?? 0).toFixed(3)} كجم
              </div>

              {costResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">{(costResult.total_cost ?? 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">التكلفة الإجمالية</div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">{(costResult.material_cost ?? 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">تكلفة الخامات</div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">{(costResult.overhead_cost ?? 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">التكاليف غير المباشرة</div>
                  </div>
                  <div className="bg-green-500/10 rounded-xl p-4 text-center border border-green-500/20">
                    <div className="text-2xl font-bold text-green-400">{(costResult.cost_per_unit ?? 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">تكلفة القطعة</div>
                  </div>
                </div>
              )}

              <GlassPanel className="overflow-hidden" title="تفاصيل المواد المطلوبة">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                      <th className="text-right px-4 py-3">#</th>
                      <th className="text-right px-4 py-3">الصنف</th>
                      <th className="text-center px-4 py-3">النوع</th>
                      <th className="text-center px-4 py-3">الكمية المطلوبة</th>
                      <th className="text-center px-4 py-3">المخزون</th>
                      <th className="text-center px-4 py-3">الوزن (كجم)</th>
                      <th className="text-center px-4 py-3">تكلفة الوحدة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...explosionResult.components.map((comp) => ({
                        name: comp.product_name,
                        type: 'مكون',
                        qty: comp.total_quantity,
                        unit: comp.unit,
                        weight_kg: comp.total_weight_kg,
                        image: comp.image_path,
                        stock: comp.stock_quantity,
                        cost_price: comp.cost_price,
                      })),
                      ...(explosionResult.carton_product ? [{
                        name: explosionResult.carton_product.name,
                        type: 'كرتونة',
                        qty: explosionResult.requested_quantity,
                        unit: 'كرتونة',
                        weight_kg: (explosionResult.carton_product.weight_grams || 0) * explosionResult.requested_quantity / 1000,
                        image: explosionResult.carton_product.image_path || '',
                        stock: undefined as number | undefined,
                        cost_price: undefined as number | undefined,
                      }] : []),
                      ...(explosionResult.box_product ? [{
                        name: explosionResult.box_product.name,
                        type: 'علبة',
                        qty: totalBoxes,
                        unit: 'علبة',
                        weight_kg: (explosionResult.box_product.weight_grams || 0) * totalBoxes / 1000,
                        image: explosionResult.box_product.image_path || '',
                        stock: undefined as number | undefined,
                        cost_price: undefined as number | undefined,
                      }] : []),
                    ].map((item, idx) => (
                      <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition">
                        <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {item.image && (
                              <Image src={item.image} alt={item.name} width={40} height={40} className="rounded-lg object-cover" />
                            )}
                            <div className="text-white font-medium">{item.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs ${item.type === 'كرتونة' ? 'bg-amber-500/20 text-amber-300' : item.type === 'علبة' ? 'bg-sky-500/20 text-sky-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{item.qty.toLocaleString()} {item.unit}</td>
                        <td className="px-4 py-3 text-center">
                          {item.stock != null ? (
                            <span className={item.stock >= item.qty ? 'text-emerald-400' : 'text-red-400'}>
                              {(item.stock ?? 0).toLocaleString()}
                            </span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-300">{(item.weight_kg ?? 0).toFixed(3)}</td>
                        <td className="px-4 py-3 text-center">
                          {item.cost_price != null ? (
                            <span className="text-gray-300">{(item.cost_price ?? 0).toFixed(2)}</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </GlassPanel>

              {costResult && (explosionResult.product_selling_price || 0) > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-500/10 rounded-xl p-4 text-center border border-blue-500/20">
                    <div className="text-2xl font-bold text-blue-400">{(revenue ?? 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">إجمالي الإيراد</div>
                  </div>
                  <div className="bg-emerald-500/10 rounded-xl p-4 text-center border border-emerald-500/20">
                    <div className="text-2xl font-bold text-emerald-400">{(totalCost ?? 0).toFixed(2)}</div>
                    <div className="text-sm text-gray-400">إجمالي التكلفة</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center border ${profit >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(profit ?? 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">صافي الربح</div>
                  </div>
                  <div className={`rounded-xl p-4 text-center border ${profitPerPiece >= 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                    <div className={`text-2xl font-bold ${profitPerPiece >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(profitPerPiece ?? 0).toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-400">الربح لكل قطعة</div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-white/10 flex justify-between items-center">
          <div>
            {explosionResult && (
              <button onClick={() => onGeneratePDF(explosionResult)} className="px-4 py-2 bg-red-500/20 text-red-300 rounded-lg border border-red-500/30 hover:bg-red-500/30 transition flex items-center gap-2">
                <FileText className="w-4 h-4" /> تحميل PDF للمورد
              </button>
            )}
          </div>
          <button onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إغلاق</button>
        </div>
      </div>
    </div>
  );
}
