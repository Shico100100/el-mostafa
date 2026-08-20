'use client';

import SearchableSelect from '@/components/ui/SearchableSelect';
import type { Account, JournalLine } from '@/components/accounting/journal/types';

interface Props {
  show: boolean;
  date: string;
  description: string;
  reference: string;
  lines: JournalLine[];
  accounts: Account[];
  totalDebit: number;
  totalCredit: number;
  onClose: () => void;
  onDateChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onReferenceChange: (v: string) => void;
  onLineChange: (index: number, field: keyof JournalLine, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function JournalEntryModal({
  show, date, description, reference, lines, accounts,
  totalDebit, totalCredit,
  onClose, onDateChange, onDescriptionChange, onReferenceChange,
  onLineChange, onAddLine, onRemoveLine, onSubmit,
}: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-3xl border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">قيد يومية جديد</h2>
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
              <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} required
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">رقم المستند (اختياري)</label>
              <input type="text" value={reference} onChange={(e) => onReferenceChange(e.target.value)}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">البيان</label>
            <input type="text" value={description} onChange={(e) => onDescriptionChange(e.target.value)} required
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-200 mb-2">أطراف القيد</label>
            {lines.map((line, index) => (
              <div key={index} className="flex gap-4 items-center animate-in fade-in slide-in-from-top-1">
                <div className="flex-1">
                  <SearchableSelect
                    options={accounts.map(acc => ({ value: acc.id, label: `${acc.code} - ${acc.name}` }))}
                    value={line.account_id}
                    onChange={(val) => onLineChange(index, 'account_id', val.toString())}
                    placeholder="اختر الحساب..."
                    className="w-full"
                  />
                </div>
                <input type="number" step="0.01" value={line.debit}
                  onChange={(e) => onLineChange(index, 'debit', e.target.value)} placeholder="مدين"
                  className="w-32 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                <input type="number" step="0.01" value={line.credit}
                  onChange={(e) => onLineChange(index, 'credit', e.target.value)} placeholder="دائن"
                  className="w-32 px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
                <button type="button" onClick={() => onRemoveLine(index)}
                  className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded-lg">X</button>
              </div>
            ))}
            <button type="button" onClick={onAddLine}
              className="mt-2 text-sm text-blue-400 hover:text-blue-300">+ إضافة طرف آخر</button>
          </div>

          <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg">
            <div className="text-gray-300">
              إجمالي المدين: <span className="text-green-400 font-bold">{totalDebit.toFixed(2)}</span>
            </div>
            <div className="text-gray-300">
              إجمالي الدائن: <span className="text-red-400 font-bold">{totalCredit.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700">حفظ القيد</button>
          </div>
        </form>
      </div>
    </div>
  );
}
