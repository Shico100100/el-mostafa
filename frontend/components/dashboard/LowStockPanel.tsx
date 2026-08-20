'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

interface LowStockProduct {
  id: number;
  name: string;
  sku?: string;
  unit: string;
  stock_quantity: number;
  min_stock: number;
}

export function LowStockPanel() {
  const router = useRouter();
  const [products, setProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchWithAuth<{ items: LowStockProduct[] }>('/inventory/products?lowStock=true&limit=10')
      .then((data) => setProducts(data?.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-[#ecfdf5]0 text-sm text-center py-4">جاري التحميل...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-bold text-white">نقص المخزون</h4>
          {products.length > 0 && (
            <span className="text-[10px] bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">{products.length}</span>
          )}
        </div>
        <button onClick={() => router.push('/inventory/stock')} className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
          عرض الكل <ExternalLink className="w-3 h-3" />
        </button>
      </div>
      {products.length === 0 ? (
        <p className="text-[#ecfdf5]0 text-xs text-center py-3">لا يوجد نقص في المخزون</p>
      ) : (
        <div className="space-y-2">
          {products.slice(0, 5).map((p) => (
            <div key={p.id} className="flex justify-between items-center py-1.5 px-3 bg-red-500/5 border border-red-500/10 rounded-lg">
              <div>
                <span className="text-xs text-white font-medium">{p.name}</span>
                {p.sku && <span className="text-[10px] text-[#ecfdf5]0 mr-2">#{p.sku}</span>}
              </div>
              <div className="text-[11px]">
                <span className="text-red-400 font-bold">{p.stock_quantity}</span>
                <span className="text-gray-600 mx-1">/</span>
                <span className="text-[#ecfdf5]0">{p.min_stock}</span>
                <span className="text-gray-600 text-[10px] mr-1">{p.unit}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
