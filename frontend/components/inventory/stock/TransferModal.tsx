'use client';

import type { StockItem, WarehouseOption } from '@/components/inventory/stock/types';

interface Props {
  show: boolean;
  item: StockItem | null;
  warehouses: WarehouseOption[];
  transferForm: { toWarehouseId: string; notes: string };
  onFormChange: (f: { toWarehouseId: string; notes: string }) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function TransferModal({ show, item, warehouses, transferForm, onFormChange, onConfirm, onClose }: Props) {
  if (!show || !item) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-6">
          <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
          <h3 className="text-xl font-bold text-white">تحويل مخزون</h3>
        </div>
        <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
          <div className="text-white font-medium">{item.product?.name || `منتج #${item.product_id}`}</div>
          <div className="text-sm text-slate-400 mt-1">من: <span className="text-amber-300">{item.warehouse?.name}</span></div>
          <div className="text-sm text-slate-400 mt-1">الكمية: <span className="text-emerald-400 font-bold">{Number(item.quantity).toLocaleString()}</span></div>
          <div className="text-xs text-[#ecfdf5]0 mt-1">سيتم نقل كامل الكمية إلى المخزن الجديد</div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">المخزن الوجهة</label>
            <select value={transferForm.toWarehouseId}
              onChange={(e) => onFormChange({ ...transferForm, toWarehouseId: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" autoFocus>
              <option value="">اختر المخزن...</option>
              {warehouses.filter((w) => w.id !== item.warehouse_id).map((w) => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">ملاحظات (اختياري)</label>
            <input type="text" value={transferForm.notes}
              onChange={(e) => onFormChange({ ...transferForm, notes: e.target.value })}
              className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none"
              placeholder="سبب التحويل..." />
          </div>
          <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
            <button onClick={onClose} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">إلغاء</button>
            <button onClick={onConfirm} className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 font-bold shadow-lg shadow-amber-900/20">تأكيد التحويل</button>
          </div>
        </div>
      </div>
    </div>
  );
}
