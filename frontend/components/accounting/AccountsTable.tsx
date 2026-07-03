'use client';

import type { Account } from '@/components/accounting/types';

interface Props {
  accounts: Account[];
}

export function AccountsTable({ accounts }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
      <div className="p-4 border-b border-white/10 bg-white/5">
        <h2 className="text-xl font-bold text-white">شجرة الحسابات</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white/5">
            <tr>
              <th className="px-6 py-3 text-right text-white font-semibold">الكود</th>
              <th className="px-6 py-3 text-right text-white font-semibold">اسم الحساب</th>
              <th className="px-6 py-3 text-right text-white font-semibold">النوع</th>
              <th className="px-6 py-3 text-right text-white font-semibold">الرصيد</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc) => (
              <tr key={acc.id} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-6 py-3 text-gray-300">{acc.code}</td>
                <td className="px-6 py-3 text-gray-200 font-medium">{acc.name}</td>
                <td className="px-6 py-3 text-gray-400 text-sm">{acc.type}</td>
                <td className={`px-6 py-3 font-mono ${Number(acc.balance) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {Number(acc.balance).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
