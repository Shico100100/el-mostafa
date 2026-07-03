'use client';

import { useRouter } from 'next/navigation';
import type { RawMaterial } from '@/components/manufacturing/raw-materials/types';
import { FileText, Pencil, Trash2, Plus } from 'lucide-react';

interface RawMaterialsTableProps {
  materials: RawMaterial[];
  sortConfig: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  onEdit: (rm: RawMaterial) => void;
  onDelete: (id: number) => void;
  getStockStatusColor: (status: string) => string;
  getStockStatusText: (status: string) => string;
}

function SortIndicator({ sortConfig, sortKey }: { sortConfig: { key: string; direction: 'asc' | 'desc' } | null; sortKey: string }) {
  if (!sortConfig || sortConfig.key !== sortKey) return <span className="text-gray-600">⇅</span>;
  return sortConfig.direction === 'asc' ? <span className="text-blue-400">↑</span> : <span className="text-blue-400">↓</span>;
}

export function RawMaterialsTable({
  materials, sortConfig, onSort, onEdit, onDelete,
  getStockStatusColor: statusColor, getStockStatusText: statusText,
}: RawMaterialsTableProps) {
  const router = useRouter();

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5 text-gray-300 text-sm uppercase font-semibold">
            <tr>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => onSort('name')}>
                <div className="flex items-center gap-2">اسم المادة الخام <SortIndicator sortConfig={sortConfig} sortKey="name" /></div>
              </th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => onSort('current_stock')}>
                <div className="flex items-center gap-2">المخزون الحالي <SortIndicator sortConfig={sortConfig} sortKey="current_stock" /></div>
              </th>
              <th className="px-6 py-4 text-right">الوحدة</th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => onSort('reorder_point')}>
                <div className="flex items-center gap-2">الحد الأدنى <SortIndicator sortConfig={sortConfig} sortKey="reorder_point" /></div>
              </th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-white transition group" onClick={() => onSort('cost_price')}>
                <div className="flex items-center gap-2">آخر سعر شراء <SortIndicator sortConfig={sortConfig} sortKey="cost_price" /></div>
              </th>
              <th className="px-6 py-4 text-right">الحالة</th>
              <th className="px-6 py-4 text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-gray-300">
            {materials.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-400">لا توجد مواد خام مسجلة</td>
              </tr>
            ) : (
              materials.map((rm) => (
                <tr
                  key={rm.id}
                  className="hover:bg-white/5 transition cursor-pointer"
                  onClick={() => router.push(`/manufacturing/raw-materials/${rm.id}`)}
                >
                  <td className="px-6 py-4"><div className="text-white font-medium">{rm.product.name}</div></td>
                  <td className="px-6 py-4"><div className="text-white font-semibold">{rm.current_stock}</div></td>
                  <td className="px-6 py-4"><div className="text-gray-300">كجم</div></td>
                  <td className="px-6 py-4"><div className="text-gray-300">{rm.reorder_point}</div></td>
                  <td className="px-6 py-4">
                    <div className="text-green-400 font-semibold">
                      {Number(rm.last_purchase_price || rm.product.cost_price).toFixed(2)} ج.م
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColor(rm.stock_status)}`}>
                      {statusText(rm.stock_status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2">
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/manufacturing/raw-materials/${rm.id}`); }}
                      className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm transition" title="التفاصيل"><FileText /></button>
                    <button onClick={(e) => { e.stopPropagation(); onEdit(rm); }}
                      className="p-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg text-sm transition" title="تعديل"><Pencil /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(rm.id); }}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition" title="حذف"><Trash2 /></button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/manufacturing/raw-materials/${rm.id}/add-stock`); }}
                      className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm transition" title="إضافة رصيد"><Plus /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
