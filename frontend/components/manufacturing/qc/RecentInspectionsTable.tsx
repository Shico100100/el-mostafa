'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { QCInspection } from '@/components/manufacturing/qc/types';

interface Props {
  items: QCInspection[];
  total: number;
}

export function RecentInspectionsTable({ items, total }: Props) {
  return (
    <GlassPanel title="سجل الفحوصات">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="text-right px-4 py-3">المنتج</th>
              <th className="text-right px-4 py-3">الماكينة</th>
              <th className="text-center px-4 py-3">النتيجة</th>
              <th className="text-center px-4 py-3">التاريخ</th>
              <th className="text-center px-4 py-3">الملاحظات</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-12 text-gray-400">{total === 0 ? 'لا توجد فحوصات بعد' : 'لا توجد نتائج للبحث'}</td></tr>
            ) : (
              items.map((r) => (
                <tr key={r.id} className="border-b border-white/5 hover:bg-white/5 transition">
                  <td className="px-4 py-3 text-white font-medium">{r.product?.name || r.production?.mold?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-300">{r.production?.machine?.name || '—'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status === 'PASS' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {r.status === 'PASS' ? 'ناجح' : 'راسب'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">
                    {r.created_at ? new Date(r.created_at).toLocaleDateString('ar-EG') : '—'}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-400">{r.notes || '—'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
