'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp, FileDown } from 'lucide-react';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { api } from '@/lib/api';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface PriceRecord {
  date: string;
  price: number;
  quantity: number;
  invoice: string;
}

interface ProductHistory {
  product_id: number;
  product_name: string;
  prices: PriceRecord[];
}

interface Product {
  id: number;
  name: string;
}

export default function PriceHistoryPage() {
  const ready = useAuthCheck();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductHistory[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);

  const loadHistory = async (pid?: number) => {
    setLoading(true);
    try {
      const params = pid ? `?productId=${pid}` : '';
      const result = await api.fetchWithAuth<ProductHistory[]>(`/purchases/price-history${params}`);
      setProducts(result);
    } catch { /* empty */ }
    setLoading(false);
  };

  const loadProducts = async () => {
    try {
      const result = await api.fetchWithAuth<Product[]>('/inventory/products');
      setAllProducts(result);
    } catch { /* empty */ }
  };

  useEffect(() => {
    if (!ready) return;
    loadProducts();
    loadHistory();
  }, [ready]);

  const handleFilter = () => {
    loadHistory(selectedProductId ? Number(selectedProductId) : undefined);
  };

  const getStats = (prices: PriceRecord[]) => {
    if (!prices.length) return { min: 0, max: 0, avg: 0, latest: 0 };
    const vals = prices.map(p => p.price);
    return {
      min: Math.min(...vals),
      max: Math.max(...vals),
      avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      latest: vals[0],
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <TrendingUp className="w-7 h-7 text-amber-400" />سجل أسعار الشراء
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-end">
          <div className="flex-1">
            <label className="block text-gray-300 text-sm mb-1">المنتج</label>
            <select value={selectedProductId} onChange={(e) => setSelectedProductId(e.target.value ? +e.target.value : '')}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option value="" className="bg-slate-800">جميع المنتجات</option>
              {allProducts.map((p) => (
                <option key={p.id} value={p.id} className="bg-slate-800">{p.name}</option>
              ))}
            </select>
          </div>
          <button onClick={handleFilter}
            className="px-6 py-2 h-[42px] bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition font-semibold">
            عرض
          </button>
          <button onClick={() => exportElementToPdf('price-history-content', 'price-history')}
            className="px-4 py-2 h-[42px] bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg border border-blue-500/30 transition flex items-center gap-2">
            <FileDown className="w-4 h-4" />تصدير PDF
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12"><span className="text-white text-xl">جاري التحميل...</span></div>
        ) : (
          <div id="price-history-content" className="space-y-6">
            {products.length === 0 ? (
              <div className="text-center py-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl">
                <p className="text-gray-500">لا توجد بيانات أسعار</p>
              </div>
            ) : products.map((product) => {
              const stats = getStats(product.prices);
              return (
                <div key={product.product_id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
                  <div className="px-6 py-4 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <h2 className="text-lg font-bold text-white">{product.product_name}</h2>
                    <div className="flex gap-4 text-sm">
                      <span className="text-green-400">الأدنى: {stats.min.toLocaleString()} ج.م</span>
                      <span className="text-red-400">الأعلى: {stats.max.toLocaleString()} ج.م</span>
                      <span className="text-blue-400">المتوسط: {stats.avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ج.م</span>
                      <span className="text-amber-400">الأحدث: {stats.latest.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-400 border-b border-white/10">
                          <th className="py-3 px-4 text-right">التاريخ</th>
                          <th className="py-3 px-4 text-right">السعر</th>
                          <th className="py-3 px-4 text-right">الكمية</th>
                          <th className="py-3 px-4 text-right">رقم الفاتورة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.prices.map((p, i) => (
                          <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition">
                            <td className="py-3 px-4 text-gray-300">{p.date ? new Date(p.date).toLocaleDateString('ar-EG') : '-'}</td>
                            <td className="py-3 px-4 text-white font-semibold">{p.price.toLocaleString()} ج.م</td>
                            <td className="py-3 px-4 text-blue-400">{p.quantity}</td>
                            <td className="py-3 px-4 text-gray-300">{p.invoice || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
