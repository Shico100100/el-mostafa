'use client';

import { X, AlertTriangle } from 'lucide-react';
import type { Product } from '@/components/purchases/types';

interface LowStockAlertProps {
  products: Product[];
  visible: boolean;
  onDismiss: () => void;
}

export default function LowStockAlert({ products, visible, onDismiss }: LowStockAlertProps) {
  if (!visible || products.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 mb-6 relative">
      <button
        onClick={onDismiss}
        className="absolute top-4 left-4 text-gray-400 hover:text-white transition"
      >
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-start gap-4">
        <div className="text-4xl"><AlertTriangle className="w-10 h-10 text-amber-500" /></div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-400 mb-2">تنبيه: نقص في المخزون!</h3>
          <p className="text-gray-300 mb-3">الخامات التالية وصلت للحد الأدنى وتحتاج إعادة طلب:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map((product) => (
              <div key={product.id} className="bg-white/5 p-3 rounded-lg border border-red-500/20">
                <div className="font-bold text-white">{product.name}</div>
                <div className="text-sm text-red-300">
                  المتوفر: {product.stock_quantity} {product.unit || 'قطعة'}
                  {product.min_stock && ` (الحد الأدنى: ${product.min_stock})`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
