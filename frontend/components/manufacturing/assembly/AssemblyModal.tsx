'use client';

import type { BOM } from '@/components/manufacturing/assembly/types';
import { AlertTriangle } from 'lucide-react';

interface Props {
  show: boolean;
  boms: BOM[];
  selectedBom: string;
  quantity: string;
  date: string;
  onBomChange: (v: string) => void;
  onQuantityChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function AssemblyModal({ show, boms, selectedBom, quantity, date, onBomChange, onQuantityChange, onDateChange, onSubmit, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">تنفيذ أمر تجميع</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
            <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">المنتج (المعادلة)</label>
            <select value={selectedBom} onChange={(e) => onBomChange(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
              <option value="">اختر المنتج المراد تجميعه</option>
              {boms.map((bom) => (
                <option key={bom.id} value={bom.id}>{bom.name} ({bom.product?.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الكمية المراد إنتاجها</label>
            <input type="number" value={quantity} onChange={(e) => onQuantityChange(e.target.value)} required min="1"
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 flex items-start gap-2">
            <AlertTriangle className="text-yellow-200 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-yellow-200">تنبيه: سيتم خصم الخامات المطلوبة تلقائياً من المخزن وإضافة المنتج النهائي.</p>
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg hover:from-orange-700 hover:to-red-700">تنفيذ الأمر</button>
          </div>
        </form>
      </div>
    </div>
  );
}
