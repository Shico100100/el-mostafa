'use client';

import SearchableSelect from '@/components/ui/SearchableSelect';
import GlassPanel from '@/components/ui/GlassPanel';
import type { ProductionItem } from '@/components/manufacturing/feasibility/types';
import { X, Search, Save, Trash2 } from 'lucide-react';

interface FeasibilityInputFormProps {
  productOptions: { value: number; label: string }[];
  productionItems: ProductionItem[];
  onAddItem: () => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, field: 'productId' | 'quantity', value: string | number) => void;
  onAnalyze: () => void;
  onClear: () => void;
  onSave: () => void;
  loading: boolean;
  saving: boolean;
  hasReport: boolean;
}

export function FeasibilityInputForm({
  productOptions, productionItems, onAddItem, onRemoveItem, onUpdateItem,
  onAnalyze, onClear, onSave, loading, saving, hasReport,
}: FeasibilityInputFormProps) {
  return (
    <GlassPanel title="إدخال المنتجات المطلوب إنتاجها">
      <div className="p-6 space-y-4">
        {productionItems.map((item, idx) => (
          <div key={idx} className="flex gap-4 items-end bg-white/5 p-4 rounded-xl">
            <div className="flex-1">
              <label className="text-gray-400 text-sm block mb-1">المنتج</label>
              <SearchableSelect
                options={productOptions}
                value={item.productId}
                onChange={(val) => onUpdateItem(idx, 'productId', val)}
                placeholder="ابحث عن منتج..."
              />
            </div>
            <div className="w-48">
              <label className="text-gray-400 text-sm block mb-1">الكمية</label>
              <input
                type="number" min="1" value={item.quantity}
                onChange={(e) => onUpdateItem(idx, 'quantity', e.target.value)}
                className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                placeholder="مثال: 100000"
              />
            </div>
            <button onClick={() => onRemoveItem(idx)} className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-xl transition"><X /></button>
          </div>
        ))}

        <div className="flex gap-4">
          <button onClick={onAddItem} className="px-6 py-2.5 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-500/30 hover:bg-blue-500/30 transition">
            + إضافة منتج
          </button>
          <button
            onClick={onAnalyze}
            disabled={loading || productionItems.filter((i) => i.productId && i.quantity).length === 0}
            className="px-8 py-2.5 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-500/30 hover:bg-emerald-500/30 transition disabled:opacity-50"
          >
            {loading ? 'جاري التحليل...' : <span className="flex items-center gap-2"><Search /> تحليل الجدوى</span>}
          </button>
          {hasReport && (
            <>
              <button onClick={onSave} disabled={saving}
                className="px-6 py-2.5 bg-indigo-500/20 text-indigo-300 rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition disabled:opacity-50">
                {saving ? 'جاري الحفظ...' : <span className="flex items-center gap-2"><Save /> حفظ التقرير</span>}
              </button>
              <button onClick={onClear}
                className="px-6 py-2.5 bg-red-500/20 text-red-300 rounded-xl border border-red-500/30 hover:bg-red-500/30 transition">
                <Trash2 /> مسح الكل
              </button>
            </>
          )}
        </div>
      </div>
    </GlassPanel>
  );
}
