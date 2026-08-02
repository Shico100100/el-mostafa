'use client';

import { useState } from 'react';
import type { Category } from '../types';

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSave: (data: {
    priceField: 'selling_price' | 'cost_price';
    updateType: 'percentage' | 'fixed';
    value: string;
    categoryId: string;
    type: string;
  }) => Promise<void>;
}

export default function BulkPriceModal({ isOpen, onClose, categories, onSave }: BulkPriceModalProps) {
  const [priceField, setPriceField] = useState<'selling_price' | 'cost_price'>('selling_price');
  const [updateType, setUpdateType] = useState<'percentage' | 'fixed'>('percentage');
  const [value, setValue] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!value) return;
    setSaving(true);
    try {
      await onSave({ priceField, updateType, value, categoryId, type: filterType });
      setValue('');
      setCategoryId('');
      setFilterType('');
    } catch (e) {
      console.error('Bulk price update failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-lg border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-white mb-6">تحديث أسعار جماعي</h3>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">الحقل المراد تحديثه</label>
            <select
              value={priceField}
              onChange={(e) => setPriceField(e.target.value as 'selling_price' | 'cost_price')}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="selling_price">سعر البيع</option>
              <option value="cost_price">سعر التكلفة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">نسبة / قيمة ثابتة</label>
            <select
              value={updateType}
              onChange={(e) => setUpdateType(e.target.value as 'percentage' | 'fixed')}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="percentage">نسبة مئوية (%)</option>
              <option value="fixed">قيمة ثابتة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {updateType === 'percentage' ? 'نسبة التغيير (مثال: 10 للزيادة، -10 للخصم)' : 'القيمة (مثال: 50 للزيادة، -50 للخصم)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="القيمة..."
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">تصفية حسب التصنيف</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">كل التصنيفات</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">تصفية حسب النوع</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              >
                <option value="">كل الأنواع</option>
                <option value="RAW">خامة</option>
                <option value="SEMI">نصف مصنع</option>
                <option value="FINISHED">منتج تام</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition" disabled={saving}>إلغاء</button>
            <button onClick={handleSave} disabled={saving || !value} className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-bold shadow-lg shadow-purple-900/20 disabled:opacity-50">
              {saving ? 'جاري التطبيق...' : 'تطبيق التحديث'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
