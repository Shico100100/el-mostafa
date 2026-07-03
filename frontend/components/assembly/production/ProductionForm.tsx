'use client';

import { Package } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { H1 } from '@/components/ui/Typography';
import type { Product } from '@/components/assembly/production/types';

interface ProductionFormProps {
  products: Product[];
  selectedProduct: number | null;
  quantity: number;
  date: string;
  notes: string;
  submitting: boolean;
  isReady: boolean;
  onProductChange: (id: number) => void;
  onQuantityChange: (qty: number) => void;
  onDateChange: (d: string) => void;
  onNotesChange: (n: string) => void;
  onSubmit: () => void;
}

export function ProductionForm({
  products, selectedProduct, quantity, date, notes, submitting, isReady,
  onProductChange, onQuantityChange, onDateChange, onNotesChange, onSubmit,
}: ProductionFormProps) {
  return (
    <GlassPanel className="p-6 border-blue-500/30">
      <H1 className="flex items-center gap-3 text-2xl mb-6">
        <Package className="text-blue-400" />
        تسجيل إنتاج جديد
      </H1>
      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 mb-1">المنتج النهائي</label>
          <select value={selectedProduct || ''} onChange={e => onProductChange(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition">
            <option value="">-- اختر المنتج --</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-gray-400 mb-1">الكمية المنتجة</label>
          <input type="number" min="1" value={quantity} onChange={e => onQuantityChange(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition text-xl font-bold text-center" />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">تاريخ الإنتاج</label>
          <input type="date" value={date} onChange={e => onDateChange(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition" />
        </div>
        <div>
          <label className="block text-gray-400 mb-1">ملاحظات</label>
          <textarea value={notes} onChange={e => onNotesChange(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 focus:outline-none focus:border-blue-500 transition h-24"
            placeholder="أي ملاحظات إضافية..." />
        </div>
        <button onClick={onSubmit} disabled={submitting || !selectedProduct}
          className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition shadow-lg ${
            isReady
              ? 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white shadow-green-900/20'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}>
          {submitting ? 'جاري التسجيل...' : <><Package /> تأكيد الإنتاج</>}
        </button>
      </div>
    </GlassPanel>
  );
}
