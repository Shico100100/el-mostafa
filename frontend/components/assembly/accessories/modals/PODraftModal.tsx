'use client';

import { Printer, X } from 'lucide-react';
import type { POItem } from '../types';

export function PODraftModal({
  show, poData, onClose,
}: {
  show: boolean;
  poData: POItem[];
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white text-black p-8 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">طلب شراء نواقص (Draft PO)</h1>
            <p className="text-sm text-gray-600">تاريخ الإنشاء: {new Date().toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 print:flex print:items-center print:gap-2">
              <Printer className="w-4 h-4" /> طباعة
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-black text-xl"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="p-2 border">م</th>
              <th className="p-2 border">الصنف</th>
              <th className="p-2 border">المورد المفضل</th>
              <th className="p-2 border">الرصيد الحالي</th>
              <th className="p-2 border">حد الطلب</th>
              <th className="p-2 border">الكمية المقترحة</th>
              <th className="p-2 border">آخر سعر</th>
              <th className="p-2 border">إجمالي تقديري</th>
            </tr>
          </thead>
          <tbody>
            {poData.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-2 border">{idx + 1}</td>
                <td className="p-2 border font-bold">{item.product_name}</td>
                <td className="p-2 border">{item.supplier}</td>
                <td className="p-2 border text-red-600">{item.current_stock}</td>
                <td className="p-2 border">{item.reorder_point}</td>
                <td className="p-2 border bg-yellow-50">{item.suggested_quantity}</td>
                <td className="p-2 border">{Number(item.last_price).toFixed(2)}</td>
                <td className="p-2 border font-bold">{Number(item.total_estimated_cost).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t-2">
              <td colSpan={7} className="p-2 font-bold text-center">الإجمالي الكلي التقديري</td>
              <td className="p-2 font-bold border">{poData.reduce((sum, i) => sum + Number(i.total_estimated_cost), 0).toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
