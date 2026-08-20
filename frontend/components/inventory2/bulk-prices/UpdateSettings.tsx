'use client';

import { DollarSign } from 'lucide-react';
import { fieldOptions, updateTypeOptions } from '@/components/inventory2/bulk-prices/types';

interface Props {
  priceField: string;
  updateType: string;
  value: string;
  selectedCount: number;
  onPriceFieldChange: (v: 'cost_price' | 'selling_price') => void;
  onUpdateTypeChange: (v: 'percentage' | 'fixed') => void;
  onValueChange: (v: string) => void;
}

export function UpdateSettings({
  priceField, updateType, value, selectedCount,
  onPriceFieldChange, onUpdateTypeChange, onValueChange,
}: Props) {
  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 mb-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <DollarSign className="w-5 h-5 text-blue-400" />
        إعدادات التحديث
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">حقل السعر</label>
          <select
            value={priceField}
            onChange={(e) => onPriceFieldChange(e.target.value as 'cost_price' | 'selling_price')}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
          >
            {fieldOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">نوع التحديث</label>
          <select
            value={updateType}
            onChange={(e) => onUpdateTypeChange(e.target.value as 'percentage' | 'fixed')}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
          >
            {updateTypeOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            {updateType === 'percentage' ? 'النسبة المئوية' : 'القيمة (ج.م)'}
          </label>
          <input
            type="number"
            step={updateType === 'percentage' ? '1' : '0.01'}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
            placeholder={updateType === 'percentage' ? 'مثال: 10' : 'مثال: 50.00'}
          />
        </div>
        <div className="flex items-end">
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 w-full text-center">
            <p className="text-xs text-blue-300">
              {updateType === 'percentage'
                ? `زيادة/نقص بنسبة ${value || '0'}%`
                : `زيادة/نقص بقيمة ${value || '0'} ج.م`}
            </p>
            <p className="text-2xl font-black text-white mt-1">{selectedCount}</p>
            <p className="text-xs text-slate-400">منتج محدد</p>
          </div>
        </div>
      </div>
    </div>
  );
}
