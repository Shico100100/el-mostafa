'use client';

import { Package, X } from 'lucide-react';
import type { Accessory } from '../types';

export function BulkStockModal({
  show, accessories, bulkItems, setBulkItems, onSubmit, onClose,
}: {
  show: boolean;
  accessories: Accessory[];
  bulkItems: { id: number; quantity: string; price: string }[];
  setBulkItems: (items: { id: number; quantity: string; price: string }[]) => void;
  onSubmit: () => void;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-4xl border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2"><Package className="w-5 h-5" /> استلام شحنة مجمعة</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto mb-6">
          <table className="w-full text-right">
            <thead className="text-gray-400">
              <tr>
                <th className="px-4 py-2">الصنف</th>
                <th className="px-4 py-2 w-32">الكمية</th>
                <th className="px-4 py-2 w-32">السعر (اختياري)</th>
                <th className="px-4 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {bulkItems.map((item, idx) => (
                <tr key={idx} className="border-b border-white/5">
                  <td className="px-4 py-2">
                    <select
                      className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                      value={item.id}
                      onChange={(e) => {
                        const updated = [...bulkItems];
                        updated[idx].id = Number(e.target.value);
                        setBulkItems(updated);
                      }}
                    >
                      <option value={0}>اختر صنف...</option>
                      {accessories.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.product.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                      placeholder="الكمية"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...bulkItems];
                        updated[idx].quantity = e.target.value;
                        setBulkItems(updated);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
                      placeholder="السعر"
                      value={item.price}
                      onChange={(e) => {
                        const updated = [...bulkItems];
                        updated[idx].price = e.target.value;
                        setBulkItems(updated);
                      }}
                    />
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => {
                        const updated = bulkItems.filter((_, i) => i !== idx);
                        setBulkItems(updated);
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between">
          <button
            onClick={() => setBulkItems([...bulkItems, { id: 0, quantity: '', price: '' }])}
            className="px-4 py-2 border border-dashed border-gray-500 text-gray-400 rounded hover:border-white hover:text-white"
          >
            + إضافة سطر
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-gray-300">إلغاء</button>
            <button onClick={onSubmit} className="px-6 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700">تأكيد الاستلام</button>
          </div>
        </div>
      </div>
    </div>
  );
}
