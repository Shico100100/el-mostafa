'use client';

import { Printer, X } from 'lucide-react';
import type { Customer, StatementItem } from '@/components/sales/customers/types';

interface StatementModalProps {
  visible: boolean;
  customer: Customer | null;
  statement: StatementItem[];
  loading: boolean;
  onClose: () => void;
}

export function StatementModal({ visible, customer, statement, loading, onClose }: StatementModalProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60]" onClick={onClose}>
      <div className="bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">كشف حساب: {customer?.name}</h2>
            <p className="text-sm text-gray-400">سجل المعاملات المالية التاريخي</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => customer && window.open(`/sales/customers/statement/${customer.id}`, '_blank')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 text-sm font-bold transition shadow-lg shadow-blue-600/20">
              <span><Printer className="w-4 h-4 inline" /></span> طباعة
            </button>
            <button onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-gray-400 transition"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500 animate-pulse">جاري تحميل البيانات...</div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="p-3 border-b border-white/10 text-gray-300">التاريخ</th>
                  <th className="p-3 border-b border-white/10 text-gray-300">البيان</th>
                  <th className="p-3 border-b border-white/10 text-gray-300">مبيعات (+)</th>
                  <th className="p-3 border-b border-white/10 text-gray-300">تحصيل (-)</th>
                  <th className="p-3 border-b border-white/10 text-gray-300">الرصيد الجاري</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {statement.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-gray-500">لا توجد معاملات مسجلة</td></tr>
                ) : statement.map((m, i) => (
                  <tr key={i} className="hover:bg-white/5 transition">
                    <td className="p-3 text-sm text-gray-400">{new Date(m.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 text-sm text-white font-medium">{m.description}</td>
                    <td className="p-3 text-sm text-emerald-400 font-bold">{m.debit > 0 ? Number(m.debit).toLocaleString() : ''}</td>
                    <td className="p-3 text-sm text-rose-400 font-bold">{m.credit > 0 ? Number(m.credit).toLocaleString() : ''}</td>
                    <td className={`p-3 text-sm font-bold ${m.balance > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {Number(m.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-between items-center text-white">
          <span className="font-bold">إجمالي المديونية المستحقة:</span>
          <span className="text-2xl font-black text-amber-500">
            {Number(customer?.balance || 0).toLocaleString()} جنيه
          </span>
        </div>
      </div>
    </div>
  );
}
