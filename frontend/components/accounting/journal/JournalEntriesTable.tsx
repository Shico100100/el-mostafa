'use client';

import type { JournalEntry } from '@/components/accounting/journal/types';

interface Props {
  entries: JournalEntry[];
}

export function JournalEntriesTable({ entries }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <table className="w-full">
        <thead className="bg-white/5">
          <tr>
            <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
            <th className="px-6 py-4 text-right text-white font-semibold">البيان</th>
            <th className="px-6 py-4 text-right text-white font-semibold">الحساب</th>
            <th className="px-6 py-4 text-right text-white font-semibold">مدين</th>
            <th className="px-6 py-4 text-right text-white font-semibold">دائن</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="border-t border-white/10 hover:bg-white/5">
              <td className="px-6 py-4 text-gray-300">{new Date(entry.date).toLocaleDateString('ar-EG')}</td>
              <td className="px-6 py-4 text-gray-300">{entry.description}</td>
              <td className="px-6 py-4 text-gray-200">{entry.account?.name}</td>
              <td className="px-6 py-4 text-green-400 font-mono">{Number(entry.debit) > 0 ? Number(entry.debit).toFixed(2) : '-'}</td>
              <td className="px-6 py-4 text-red-400 font-mono">{Number(entry.credit) > 0 ? Number(entry.credit).toFixed(2) : '-'}</td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-gray-400">لا توجد قيود يومية.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
