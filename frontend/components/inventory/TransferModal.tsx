'use client';

import { useState, useEffect } from 'react';
import { ArrowRightLeft } from 'lucide-react';

interface TransferItem {
  product_id: number;
  product_name?: string;
  warehouse_id: number;
  warehouse_name?: string;
  quantity: number;
  unit?: string;
}

interface WarehouseOption {
  id: number;
  name: string;
}

interface TransferModalProps {
  isOpen: boolean;
  item: TransferItem | null;
  otherWarehouses: WarehouseOption[];
  onClose: () => void;
  onTransfer: (data: { toWarehouseId: string; notes: string }) => Promise<void>;
}

export default function TransferModal({ isOpen, item, otherWarehouses, onClose, onTransfer }: TransferModalProps) {
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && otherWarehouses.length > 0) {
      setToWarehouseId(otherWarehouses[0]?.id?.toString() || '');
    }
  }, [isOpen, otherWarehouses]);

  if (!isOpen || !item) return null;

  const handleTransfer = async () => {
    if (!toWarehouseId) return;
    setSaving(true);
    try {
      await onTransfer({ toWarehouseId, notes });
      setNotes('');
    } catch (e) {
      console.error('Transfer failed:', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <ArrowRightLeft className="w-6 h-6 text-amber-400" />
          <h3 className="text-xl font-bold text-white">تحويل مخزون</h3>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <div className="text-white font-medium">{item.product_name || `منتج #${item.product_id}`}</div>
          {item.warehouse_name && (
            <div className="text-sm text-gray-400 mt-1">
              من: <span className="text-amber-300">{item.warehouse_name}</span>
            </div>
          )}
          <div className="text-sm text-gray-400">
            الكمية: <span className="text-green-400 font-bold">{item.quantity.toLocaleString()}</span> {item.unit || 'قطعة'}
          </div>
          <div className="text-xs text-gray-500 mt-1">سيتم نقل كامل الكمية إلى المخزن الجديد</div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">المخزن الوجهة</label>
            <select
              value={toWarehouseId}
              onChange={(e) => setToWarehouseId(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              autoFocus
            >
              <option value="">اختر المخزن...</option>
              {otherWarehouses.map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات (اختياري)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-white/20 rounded-lg text-white focus:border-blue-500 focus:outline-none"
              placeholder="سبب التحويل..."
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition" disabled={saving}>إلغاء</button>
            <button onClick={handleTransfer} disabled={saving || !toWarehouseId} className="px-6 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 font-bold shadow-lg shadow-amber-900/20 disabled:opacity-50">
              {saving ? 'جاري التحويل...' : 'تأكيد التحويل'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
