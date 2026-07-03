'use client';

import Image from 'next/image';
import { Plus, Minus, Pencil, ScrollText, Trash2 } from 'lucide-react';
import type { Accessory } from './types';

export function AccessoriesTable({
  accessories, getStatusColor, onStockAdd, onStockConsume, onEdit, onHistory, onDelete,
}: {
  accessories: Accessory[];
  getStatusColor: (status: string) => string;
  onStockAdd: (acc: Accessory) => void;
  onStockConsume: (acc: Accessory) => void;
  onEdit: (acc: Accessory) => void;
  onHistory: (acc: Accessory) => void;
  onDelete: (acc: Accessory) => void;
}) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <table className="w-full text-right">
        <thead className="bg-white/5 text-gray-300">
          <tr>
            <th className="px-6 py-4">الصورة</th>
            <th className="px-6 py-4">الاسم</th>
            <th className="px-6 py-4">الرصيد</th>
            <th className="px-6 py-4">الحالة</th>
            <th className="px-6 py-4">الوزن (جم)</th>
            <th className="px-6 py-4">حد الطلب</th>
            <th className="px-6 py-4">آخر سعر</th>
            <th className="px-6 py-4">المورد</th>
            <th className="px-6 py-4">إجراءات</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-gray-200">
          {accessories.map((acc) => (
            <tr key={acc.id} className="hover:bg-white/5">
              <td className="px-6 py-4">
                {acc.image_path ? (
                  <Image
                    src={acc.image_path}
                    alt={acc.product.name}
                    width={40}
                    height={40}
                    className="w-10 h-10 object-cover rounded cursor-pointer hover:scale-150 transition"
                    onClick={() => window.open(acc.image_path, '_blank')}
                    unoptimized
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-xs text-gray-400">NA</div>
                )}
              </td>
              <td className="px-6 py-4 font-medium">{acc.product.name}</td>
              <td className="px-6 py-4">{acc.current_stock} {acc.product.unit}</td>
              <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(acc.stock_status)}`}>
                  {acc.stock_status}
                </span>
              </td>
              <td className="px-6 py-4 text-gray-400">{acc.weight_per_piece ? `${acc.weight_per_piece} جم` : '-'}</td>
              <td className="px-6 py-4">{acc.reorder_point}</td>
              <td className="px-6 py-4">{Number(acc.last_purchase_price).toFixed(2)}</td>
              <td className="px-6 py-4 text-gray-400">{acc.preferred_supplier?.name || '-'}</td>
              <td className="px-6 py-4">
                <div className="flex gap-2">
                  <button onClick={() => onStockAdd(acc)} className="p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30" title="إضافة رصيد"><Plus className="w-4 h-4" /></button>
                  <button onClick={() => onStockConsume(acc)} className="p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30" title="صرف"><Minus className="w-4 h-4" /></button>
                  <button onClick={() => onEdit(acc)} className="p-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30" title="تعديل"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => onHistory(acc)} className="p-2 bg-purple-500/20 text-purple-400 rounded hover:bg-purple-500/30" title="سجل الحركات"><ScrollText className="w-4 h-4" /></button>
                  <button onClick={() => onDelete(acc)} className="p-2 bg-red-900/20 text-red-500 rounded hover:bg-red-900/30" title="حذف"><Trash2 className="w-4 h-4" /></button>
                </div>
              </td>
            </tr>
          ))}
          {accessories.length === 0 && (
            <tr><td colSpan={9} className="text-center py-8 text-gray-500">لا توجد بيانات</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
