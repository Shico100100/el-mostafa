'use client';

import { useState, useEffect } from 'react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { Package, FileDown } from 'lucide-react';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface InventoryValueItem {
  name: string;
  value: number;
}

export default function InventoryValuePage() {
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<InventoryValueItem[]>([]);

  useEffect(() => {
    if (!ready) return;
    api.getInventoryValueReport().then((res) => {
      setData(Array.isArray(res) ? res : []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [ready]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const totalValue = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const maxVal = Math.max(...data.map(d => d.value || 0), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><Package className="w-8 h-8 text-amber-400" />قيمة المخزون بالتصنيف</h1>
          {data.length > 0 && <button onClick={() => exportElementToPdf('inventory-value-content', 'inventory-value')} className="bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 px-4 py-2 rounded-lg border border-amber-500/30 transition flex items-center gap-2"><FileDown className="w-4 h-4" />تصدير PDF</button>}
        </div>

        <div id="inventory-value-content" className="space-y-6">
          {data.length === 0 ? (
            <p className="text-[#6b8378] text-center py-12">لا توجد بيانات متاحة</p>
          ) : (
            <>
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 text-center">
                <p className="text-[#6b8378] text-sm">إجمالي قيمة المخزون</p>
                <p className="text-3xl font-bold text-amber-400 mt-1">{totalValue.toLocaleString()} ج.م</p>
              </div>

              {/* Bar Chart */}
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
                <div className="flex items-end gap-3 h-48">
                  {data.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                      <span className="text-xs text-amber-400 font-semibold">{d.value?.toLocaleString()}</span>
                      <div className="w-full rounded-t bg-amber-500/80 transition-all hover:bg-amber-400" style={{ height: `${(d.value / maxVal) * 100}%` }} />
                      <span className="text-xs text-[#6b8378] text-center leading-tight max-w-[60px] truncate" title={d.name}>{d.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="text-[#6b8378] border-b border-[#1f2d26]">
                    <th className="py-3 px-4 text-right">التصنيف</th>
                    <th className="py-3 px-4 text-right">القيمة</th>
                    <th className="py-3 px-4 text-right">النسبة</th>
                  </tr></thead>
                  <tbody>
                    {data.map((d, i) => (
                      <tr key={i} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                        <td className="py-3 px-4 text-white font-semibold">{d.name}</td>
                        <td className="py-3 px-4 text-amber-400">{(d.value || 0).toLocaleString()} ج.م</td>
                        <td className="py-3 px-4 text-[#6b8378]">{totalValue > 0 ? ((d.value / totalValue) * 100).toFixed(1) : 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t-2 border-amber-500/30">
                    <td className="py-3 px-4 text-white font-bold">الإجمالي</td>
                    <td className="py-3 px-4 text-amber-400 font-bold">{totalValue.toLocaleString()} ج.م</td>
                    <td className="py-3 px-4 text-white font-bold">100%</td>
                  </tr></tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
