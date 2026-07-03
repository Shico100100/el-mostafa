'use client';

import { Eye, ArrowLeftRight, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/components/sales/quotes/StatusBadge';
import type { Quote } from '@/components/sales/quotes/types';

interface QuotesTableProps {
  quotes: Quote[];
  loading: boolean;
  onView: (quote: Quote) => void;
  onConvert: (id: number) => void;
  onDelete: (id: number) => void;
}

export function QuotesTable({ quotes, loading, onView, onConvert, onDelete }: QuotesTableProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-white/5 text-gray-300">
            <tr>
              <th className="px-6 py-4 font-semibold text-sm">#</th>
              <th className="px-6 py-4 font-semibold text-sm">التاريخ</th>
              <th className="px-6 py-4 font-semibold text-sm">العميل</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">المبلغ</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">الحالة</th>
              <th className="px-6 py-4 font-semibold text-sm text-center">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">جاري التحميل...</td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">لا توجد عروض أسعار</td></tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 text-blue-300 font-bold">#{quote.id}</td>
                  <td className="px-6 py-4 text-gray-300">
                    {new Date(quote.created_at).toLocaleDateString('ar-EG')}
                  </td>
                  <td className="px-6 py-4 text-white font-medium">{quote.customer?.name}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-lg font-bold text-blue-400">
                      {Number(quote.total_amount).toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-500 mr-1">ج.م</span>
                  </td>
                  <td className="px-6 py-4 text-center"><StatusBadge status={quote.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onView(quote)}
                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition" title="عرض التفاصيل">
                        <Eye className="w-5 h-5" />
                      </button>
                      {quote.status !== 'CONVERTED' && (
                        <>
                          <button onClick={() => onConvert(quote.id)}
                            className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/40 transition" title="تحويل إلى أمر بيع">
                            <ArrowLeftRight className="w-5 h-5" />
                          </button>
                          <button onClick={() => onDelete(quote.id)}
                            className="p-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/40 transition" title="حذف">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
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
