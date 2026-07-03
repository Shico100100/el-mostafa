'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { BOM } from '@/components/bom/types';

interface BOMTableProps {
  boms: BOM[];
  search: string;
  onSearchChange: (val: string) => void;
  onExplode: (bom: BOM) => void;
  onEdit: (bom: BOM) => void;
  onDuplicate: (bom: BOM) => void;
  onDelete: (bom: BOM) => void;
  getProductName: (id: number) => string;
  formatDate: (dateStr: string) => string;
}

export function BOMTable({ boms, search, onSearchChange, onExplode, onEdit, onDuplicate, onDelete, getProductName, formatDate }: BOMTableProps) {
  const filteredBoms = boms.filter(b =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.product?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="relative container mx-auto px-6">
        <input
          className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition pr-10"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="ابحث عن BOM بالاسم أو المنتج..."
        />
      </div>

      <div className="container mx-auto px-6">
        <GlassPanel className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm">
                <th className="text-right px-6 py-4">الاسم</th>
                <th className="text-right px-6 py-4">المنتج النهائي</th>
                <th className="text-right px-6 py-4">الوصف</th>
                <th className="text-center px-6 py-4">عدد المكونات</th>
                <th className="text-center px-6 py-4">تاريخ الإنشاء</th>
                <th className="text-center px-6 py-4">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredBoms.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    {search ? 'لا توجد نتائج للبحث' : 'لا توجد قوائم مكونات بعد. أضف BOM جديد للبدء.'}
                  </td>
                </tr>
              ) : (
                filteredBoms.map((bom) => (
                  <tr key={bom.id} className="border-b border-white/5 hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-medium">{bom.name}</td>
                    <td className="px-6 py-4 text-gray-300">
                      {bom.product?.name || getProductName(bom.product_id)}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-sm max-w-xs truncate">
                      {bom.description || '—'}
                    </td>
                    <td className="px-6 py-4 text-center text-gray-300">{bom.items?.length || 0}</td>
                    <td className="px-6 py-4 text-center text-gray-400 text-sm">{formatDate(bom.created_at)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => onExplode(bom)} className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-sm transition">تفجير</button>
                        <button onClick={() => onEdit(bom)} className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg text-sm transition">تعديل</button>
                        <button onClick={() => onDuplicate(bom)} className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg text-sm transition">نسخ</button>
                        <button onClick={() => onDelete(bom)} className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </GlassPanel>
      </div>
    </>
  );
}
