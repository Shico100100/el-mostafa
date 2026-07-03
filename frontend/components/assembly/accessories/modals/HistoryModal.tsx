'use client';

import { X } from 'lucide-react';
import type { Accessory, HistoryItem } from '../types';

export function HistoryModal({
  show, accessory, history, onClose,
}: {
  show: boolean;
  accessory: Accessory | null;
  history: HistoryItem[];
  onClose: () => void;
}) {
  if (!show || !accessory) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-2xl border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">سجل الحركات - {accessory.product.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-right text-sm">
            <thead className="text-gray-400 border-b border-white/10">
              <tr>
                <th className="py-2">التاريخ</th>
                <th className="py-2">النوع</th>
                <th className="py-2">الكمية</th>
                <th className="py-2">ملاحظات</th>
              </tr>
            </thead>
            <tbody className="text-gray-300 divide-y divide-white/5">
              {history.map((item) => (
                <tr key={item.id}>
                  <td className="py-2">{new Date(item.date).toLocaleDateString('ar-EG')}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${item.type === 'IN' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {item.type === 'IN' ? 'إضافة' : 'صرف'}
                    </span>
                  </td>
                  <td className="py-2">{item.quantity}</td>
                  <td className="py-2 text-gray-500">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
