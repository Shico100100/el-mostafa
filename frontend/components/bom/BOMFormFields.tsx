'use client';

import { Package, X } from 'lucide-react';
import SearchableSelect from '@/components/ui/SearchableSelect';
import type { Product, BOMFormItem } from '@/components/bom/types';

interface BOMFormFieldsProps {
  products: Product[];
  bomProducts: Product[];
  productOptions: { value: number; label: string }[];
  formName: string;
  formDescription: string;
  formProductId: string;
  formPcsPerCarton: string;
  formPcsPerBox: string;
  formCartonProductId: string;
  formBoxProductId: string;
  formItems: BOMFormItem[];
  onFormNameChange: (v: string) => void;
  onFormDescriptionChange: (v: string) => void;
  onFormProductIdChange: (v: string) => void;
  onFormPcsPerCartonChange: (v: string) => void;
  onFormPcsPerBoxChange: (v: string) => void;
  onFormCartonProductIdChange: (v: string) => void;
  onFormBoxProductIdChange: (v: string) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  onUpdateItem: (idx: number, field: 'product_id' | 'quantity', value: string) => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function BOMFormFields({
  products, bomProducts, productOptions,
  formName, formDescription, formProductId,
  formPcsPerCarton, formPcsPerBox,
  formCartonProductId, formBoxProductId, formItems,
  onFormNameChange, onFormDescriptionChange, onFormProductIdChange,
  onFormPcsPerCartonChange, onFormPcsPerBoxChange,
  onFormCartonProductIdChange, onFormBoxProductIdChange,
  onAddItem, onRemoveItem, onUpdateItem,
}: BOMFormFieldsProps) {
  return (
    <div className="p-6 space-y-4">
      <div>
        <label className={labelClass}>الاسم</label>
        <input className={inputClass} value={formName} onChange={e => onFormNameChange(e.target.value)} placeholder="مثال: BOM مفتاح سحري" />
      </div>
      <div>
        <label className={labelClass}>المنتج النهائي</label>
        <select className={inputClass} value={formProductId} onChange={e => onFormProductIdChange(e.target.value)}>
          <option value="">اختر منتج...</option>
          {bomProducts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelClass}>وصف</label>
        <textarea className={inputClass} value={formDescription} onChange={e => onFormDescriptionChange(e.target.value)} rows={2} />
      </div>

      <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
        <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1"><Package className="w-4 h-4" /> إعدادات التعبئة (كرتون)</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>عدد القطع / كرتونة</label>
            <input className={inputClass} type="number" min="1" value={formPcsPerCarton} onChange={e => onFormPcsPerCartonChange(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>عدد القطع / علبة</label>
            <input className={inputClass} type="number" min="1" value={formPcsPerBox} onChange={e => onFormPcsPerBoxChange(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>صنف الكرتونة</label>
            <select className={inputClass} value={formCartonProductId} onChange={e => onFormCartonProductIdChange(e.target.value)}>
              <option value="">بدون كرتونة</option>
              {products.filter(p => p.type === 'CARTON').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>صنف العلبة</label>
            <select className={inputClass} value={formBoxProductId} onChange={e => onFormBoxProductIdChange(e.target.value)}>
              <option value="">بدون علبة</option>
              {products.filter(p => p.type === 'BOX').map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className={labelClass}>المكونات (لقطعة واحدة)</label>
          <button onClick={onAddItem} className="text-sm px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg hover:bg-emerald-500/30 transition">+ إضافة مكون</button>
        </div>
        {formItems.map((item, idx) => (
          <div key={idx} className="flex gap-3 mb-2 items-end">
            <div className="flex-1">
              <SearchableSelect
                options={productOptions}
                value={item.product_id ? Number(item.product_id) : ''}
                onChange={(val) => onUpdateItem(idx, 'product_id', String(val))}
                placeholder="ابحث عن مكون..."
              />
            </div>
            <div className="w-24">
              <input
                className={inputClass}
                type="number"
                value={item.quantity}
                onChange={e => onUpdateItem(idx, 'quantity', e.target.value)}
                placeholder="الكمية"
                min="0"
                step="0.0001"
              />
            </div>
            <button onClick={() => onRemoveItem(idx)} className="px-3 py-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition"><X className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
