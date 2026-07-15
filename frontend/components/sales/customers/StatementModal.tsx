'use client';

import { Printer, X, FileText, Filter } from 'lucide-react';
import type { Customer, StatementItem } from '@/components/sales/customers/types';

const MONTHS = [
  { value: '1', label: 'يناير' }, { value: '2', label: 'فبراير' },
  { value: '3', label: 'مارس' }, { value: '4', label: 'أبريل' },
  { value: '5', label: 'مايو' }, { value: '6', label: 'يونيو' },
  { value: '7', label: 'يوليو' }, { value: '8', label: 'أغسطس' },
  { value: '9', label: 'سبتمبر' }, { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' }, { value: '12', label: 'ديسمبر' },
];

interface StatementModalProps {
  visible: boolean;
  customer: Customer | null;
  statement: StatementItem[];
  loading: boolean;
  month: string;
  year: string;
  onMonthChange: (v: string) => void;
  onYearChange: (v: string) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  onClose: () => void;
}

export function StatementModal({
  visible, customer, statement, loading, month, year,
  onMonthChange, onYearChange, onApplyFilter, onClearFilter, onClose,
}: StatementModalProps) {
  if (!visible) return null;

  const availableYears = [...new Set(statement.map(s => new Date(s.date).getFullYear()))].sort((a, b) => b - a);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-slate-900/95 backdrop-blur-xl w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">كشف حساب: {customer?.name}</h2>
              <p className="text-xs text-slate-400">{statement.length} معاملة</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => customer && window.open(`/sales/customers/statement/${customer.id}`, '_blank')}
              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-xl text-xs font-bold transition border border-blue-500/20 flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" /> طباعة
            </button>
            <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2 shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select value={month} onChange={e => onMonthChange(e.target.value)}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white">
            <option value="">كل الشهور</option>
            {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
          <select value={year} onChange={e => onYearChange(e.target.value)}
            className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-xs text-white">
            <option value="">كل السنوات</option>
            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={onApplyFilter}
            className="px-3 py-1 bg-blue-600/20 text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition border border-blue-500/20">
            تطبيق
          </button>
          {(month || year) && (
            <button onClick={onClearFilter}
              className="px-2 py-1 bg-white/5 text-slate-400 rounded-lg text-xs hover:bg-white/10 transition flex items-center gap-1">
              <X className="w-3 h-3" /> مسح
            </button>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-5">
          {loading ? (
            <div className="text-center py-16 text-slate-500 animate-pulse">جاري تحميل البيانات...</div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead className="bg-white/5 sticky top-0">
                <tr>
                  <th className="p-3 text-xs font-bold text-slate-400 border-b border-white/10">التاريخ</th>
                  <th className="p-3 text-xs font-bold text-slate-400 border-b border-white/10">البيان</th>
                  <th className="p-3 text-xs font-bold text-slate-400 border-b border-white/10">مبيعات (+)</th>
                  <th className="p-3 text-xs font-bold text-slate-400 border-b border-white/10">تحصيل (-)</th>
                  <th className="p-3 text-xs font-bold text-slate-400 border-b border-white/10">الرصيد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {statement.length === 0 ? (
                  <tr><td colSpan={5} className="p-12 text-center text-slate-500 text-sm">لا توجد معاملات</td></tr>
                ) : statement.map((m, i) => (
                  <tr key={i} className="hover:bg-white/5 transition">
                    <td className="p-3 text-xs text-slate-400">{new Date(m.date).toLocaleDateString('ar-EG')}</td>
                    <td className="p-3 text-xs text-white font-medium">{m.description}</td>
                    <td className="p-3 text-xs text-emerald-400 font-bold">{m.debit > 0 ? Number(m.debit).toLocaleString() : '-'}</td>
                    <td className="p-3 text-xs text-rose-400 font-bold">{m.credit > 0 ? Number(m.credit).toLocaleString() : '-'}</td>
                    <td className={`p-3 text-xs font-bold ${m.balance > 0 ? 'text-amber-400' : 'text-blue-400'}`}>
                      {Number(m.balance).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-white/10 bg-white/5 flex justify-between items-center shrink-0">
          <span className="text-sm font-bold text-slate-400">إجمالي المديونية:</span>
          <span className="text-xl font-black text-amber-400">
            {Number(customer?.balance || 0).toLocaleString()} ج.م
          </span>
        </div>
      </div>
    </div>
  );
}
