'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { ProductAnalysis } from '@/components/manufacturing/feasibility/types';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface ProductAnalysisTableProps {
  items: ProductAnalysis[];
}

const statusColor = (s: string) => {
  switch (s) {
    case 'OK': return 'bg-green-500/20 text-green-300';
    case 'NO_BOM': return 'bg-red-500/20 text-red-300';
    case 'NO_MOLD': return 'bg-amber-500/20 text-amber-300';
    case 'NO_MACHINE': return 'bg-red-500/20 text-red-300';
    case 'SHORTAGE': return 'bg-red-500/20 text-red-300';
    default: return 'bg-gray-500/20 text-gray-300';
  }
};
const statusText = (s: string) => {
  switch (s) {
    case 'OK': return 'جيد';
    case 'NO_BOM': return 'لا توجد BOM';
    case 'NO_MOLD': return 'لا يوجد قالب';
    case 'NO_MACHINE': return 'لا توجد ماكينة';
    case 'SHORTAGE': return 'عجز';
    default: return s;
  }
};

export function ProductAnalysisTable({ items }: ProductAnalysisTableProps) {
  return (
    <GlassPanel title="تحليل المنتجات">
      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-gray-400">
              <th className="text-right px-4 py-3">المنتج</th>
              <th className="text-center px-4 py-3">الكمية</th>
              <th className="text-center px-4 py-3">BOM</th>
              <th className="text-center px-4 py-3">المكونات</th>
              <th className="text-center px-4 py-3">القالب</th>
              <th className="text-center px-4 py-3">ماكينة مقترحة</th>
              <th className="text-center px-4 py-3">ساعات تقديرية</th>
              <th className="text-center px-4 py-3">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.productId} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-4 py-3 text-white font-medium">{item.productName}</td>
                <td className="px-4 py-3 text-center text-amber-400">{item.quantity.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  {item.bomFound
                    ? <span className="text-green-400 flex items-center gap-1"><CheckCircle /> {item.bomName}</span>
                    : <span className="text-red-400"><XCircle /></span>}
                </td>
                <td className="px-4 py-3 text-center text-gray-300">{item.componentCount}</td>
                <td className="px-4 py-3 text-center">
                  {item.moldFound
                    ? <span className="text-purple-400">{item.moldName} ({item.moldCavities} عيون)</span>
                    : <span className="text-amber-400 flex items-center gap-1"><AlertTriangle /> لا يوجد</span>}
                </td>
                <td className="px-4 py-3 text-center text-blue-400">
                  {item.suggestedMachine?.name || '—'}
                </td>
                <td className="px-4 py-3 text-center text-cyan-400">{item.estimatedHours || '—'}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${statusColor(item.status)}`}>
                    {statusText(item.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassPanel>
  );
}
