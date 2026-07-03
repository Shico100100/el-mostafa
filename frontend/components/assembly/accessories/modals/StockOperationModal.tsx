'use client';

import type { Accessory } from '../types';

export function StockOperationModal({
  show, isAdd, accessory, formData, setFormData, stockMode, setStockMode, onSubmit, onClose,
}: {
  show: boolean;
  isAdd: boolean;
  accessory: Accessory | null;
  formData: Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  stockMode: 'UNIT' | 'KG';
  setStockMode: (mode: 'UNIT' | 'KG') => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!show || !accessory) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-sm border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">
          {isAdd ? 'إضافة رصيد (شراء)' : 'صرف (استخدام)'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {accessory.weight_per_piece && Number(accessory.weight_per_piece) > 0 && (
            <div className="flex bg-white/5 p-1 rounded-lg mb-4">
              <button
                type="button"
                onClick={() => setStockMode('UNIT')}
                className={`flex-1 py-1 rounded-md text-sm transition ${stockMode === 'UNIT' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                بالعدد ({accessory.product.unit})
              </button>
              <button
                type="button"
                onClick={() => setStockMode('KG')}
                className={`flex-1 py-1 rounded-md text-sm transition ${stockMode === 'KG' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                بالوزن (KG)
              </button>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-gray-400">
              {stockMode === 'KG' ? 'الوزن بالكيلو جرام' : 'الكمية'}
            </label>
            <input
              type="number"
              step={stockMode === 'KG' ? "0.001" : "1"}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder={stockMode === 'KG' ? "أدخل الوزن" : "أدخل العدد"}
              value={formData.quantity || ''}
              onChange={e => setFormData({ ...formData, quantity: e.target.value })}
              required
            />
            {stockMode === 'KG' && formData.quantity && (
              <p className="text-sm text-green-400">
                ≈ {Math.round((Number(formData.quantity) * 1000) / (accessory.weight_per_piece || 1))} قطعة
              </p>
            )}
          </div>
          {isAdd && (
            <input
              type="number"
              step="0.01"
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="سعر الشراء (اختياري)"
              value={formData.price || ''}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
            />
          )}
          <input
            className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
            placeholder="ملاحظات"
            value={formData.notes || ''}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300">إلغاء</button>
            <button type="submit" className={`px-4 py-2 text-white rounded ${isAdd ? 'bg-green-600' : 'bg-red-600'}`}>
              {isAdd ? 'تأكيد الإضافة' : 'تأكيد الصرف'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
