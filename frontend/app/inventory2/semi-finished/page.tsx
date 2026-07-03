'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Factory, Recycle, Calculator, RotateCw } from 'lucide-react';
import { TypeBadge } from '@/components/inventory2/Badge';
import StatCards from '@/components/inventory2/StatCards';

interface SemiProduct {
  id: number; name: string; unit: string;
  cost_price: string; selling_price: string; stock_quantity: string; type: string;
}

export default function SemiFinishedPage() {
  const router = useRouter();
  const [products, setProducts] = useState<SemiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchWithAuth<SemiProduct[]>('/inventory/products?type=SEMI_FINISHED');
      setProducts(Array.isArray(data) ? data : (data as any)?.data ?? []);
    } catch {
      toast.error('فشل تحميل المخزون');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalValue = products.reduce((acc, p) => acc + Number(p.cost_price) * Number(p.stock_quantity), 0);
  const totalQty = products.reduce((acc, p) => acc + Number(p.stock_quantity), 0);

  const statsCards = [
    { label: 'إجمالي المنتجات', value: products.length, icon: <Factory className="w-6 h-6 text-amber-400" />, color: 'bg-amber-500/20' },
    { label: 'إجمالي القطع', value: totalQty.toLocaleString(), icon: <Recycle className="w-6 h-6 text-blue-400" />, color: 'bg-blue-500/20' },
    { label: 'قيمة المخزون', value: `${totalValue.toLocaleString()} ج.م`, icon: <Calculator className="w-6 h-6 text-emerald-400" />, color: 'bg-emerald-500/20' },
  ];

  const handleRecalculate = async () => {
    try {
      const res = await api.fetchWithAuth<{ processed_products: number }>('/v1/manufacturing/recalculate-semi-finished-costs', { method: 'POST' });
      toast.success(`تم إعادة الحساب: ${res.processed_products} منتج`);
      fetchProducts();
    } catch {
      toast.error('فشل إعادة الحساب');
    }
  };

  const handleRecalculateOne = async (id: number) => {
    try {
      const data = await api.fetchWithAuth<{ calculated_stock: number }>(`/v1/inventory/products/${id}/recalculate`, { method: 'POST' });
      toast.success(`تم التحديث: ${data.calculated_stock}`);
      fetchProducts();
    } catch {
      toast.error('فشل التصحيح');
    }
  };

  if (loading) return <div className="text-center text-slate-400 py-20">جاري تحميل المخزون...</div>;

  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Factory className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-black text-white">مخزن البلاستيك (نصف مصنع)</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={handleRecalculate}
              className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/20 transition flex items-center gap-2">
              <RotateCw className="w-4 h-4" />إعادة حساب التكاليف
            </button>
            <button onClick={() => router.push('/inventory2/products')}
              className="bg-slate-600/10 hover:bg-slate-600/20 text-slate-300 px-4 py-2.5 rounded-xl border border-white/10 transition">
              العودة
            </button>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <StatCards cards={statsCards} />

        <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-white font-semibold text-sm">اسم المنتج</th>
                <th className="px-6 py-4 text-white font-semibold text-sm">النوع</th>
                <th className="px-6 py-4 text-white font-semibold text-sm">الكمية</th>
                <th className="px-6 py-4 text-white font-semibold text-sm">متوسط التكلفة</th>
                <th className="px-6 py-4 text-white font-semibold text-sm">إجمالي القيمة</th>
                <th className="px-6 py-4 text-center text-white font-semibold text-sm">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <Factory className="w-12 h-12 mx-auto mb-3 text-slate-600" />
                    <p>لا يوجد منتجات بلاستيكية مسجلة بعد</p>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const cost = Number(product.cost_price);
                  const qty = Number(product.stock_quantity);
                  return (
                    <tr key={product.id} className="hover:bg-white/5 transition">
                      <td className="px-6 py-4">
                        <button onClick={() => router.push(`/inventory2/semi-finished/${product.id}`)}
                          className="font-bold text-amber-300 hover:text-amber-200 transition text-right">
                          {product.name}
                        </button>
                      </td>
                      <td className="px-6 py-4"><TypeBadge type={product.type} /></td>
                      <td className="px-6 py-4 font-mono text-lg text-white">{qty.toLocaleString()} <span className="text-xs text-slate-500">{product.unit || 'قطعة'}</span></td>
                      <td className="px-6 py-4 text-slate-300">{cost.toFixed(2)} ج.م</td>
                      <td className="px-6 py-4 text-emerald-400 font-bold">{(cost * qty).toFixed(2)} ج.م</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => handleRecalculateOne(product.id)}
                          className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition" title="تصحيح الرصيد">
                          <RotateCw className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>
        </div>
      </main>
    </>
  );
}
