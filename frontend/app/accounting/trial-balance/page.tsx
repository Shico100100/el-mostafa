'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { Scale as BalanceIcon, FileDown } from 'lucide-react';
import { exportToCsv } from '@/lib/csv-export';
import { exportElementToPdf } from '@/lib/pdf-reports';

interface AccountBalance {
  code: string;
  name: string;
  type: string;
  balance: number;
}

export default function TrialBalancePage() {
  const ready = useAuthCheck();
  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    api.fetchWithAuth<AccountBalance[]>('/accounting/trial-balance')
      .then(data => setAccounts(data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [ready]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]"><div className="text-white text-xl">جاري التحميل...</div></div>;

  const totalDebit = accounts.filter(a => a.balance > 0).reduce((s, a) => s + a.balance, 0);
  const totalCredit = accounts.filter(a => a.balance < 0).reduce((s, a) => s + Math.abs(a.balance), 0);

  const handleExportCsv = () => {
    exportToCsv(accounts.map(a => ({
      'الكود': a.code,
      'الاسم': a.name,
      'النوع': a.type,
      'الرصيد': a.balance,
    })), 'ميزان_التجربة');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3"><BalanceIcon className="w-8 h-8 text-yellow-400" />ميزان المراجعة</h1>
          <div className="flex gap-3">
            <button onClick={handleExportCsv} className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition flex items-center gap-2">
              <FileDown className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => exportElementToPdf('trial-balance-content', 'ميزان_المراجعة')} className="bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 px-4 py-2 rounded-lg border border-cyan-500/30 transition flex items-center gap-2">
              <FileDown className="w-4 h-4" /> PDF
            </button>
          </div>
        </div>

        <div id="trial-balance-content" className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6b8378] border-b border-[#1f2d26]">
                  <th className="py-3 px-4 text-right">الكود</th>
                  <th className="py-3 px-4 text-right">اسم الحساب</th>
                  <th className="py-3 px-4 text-right">النوع</th>
                  <th className="py-3 px-4 text-right">مدين</th>
                  <th className="py-3 px-4 text-right">دائن</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a, i) => (
                  <tr key={i} className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                    <td className="py-3 px-4 text-white font-mono">{a.code}</td>
                    <td className="py-3 px-4 text-white">{a.name}</td>
                    <td className="py-3 px-4 text-[#6b8378] text-xs">{a.type}</td>
                    <td className="py-3 px-4 text-green-400">{a.balance > 0 ? a.balance.toLocaleString() : '-'}</td>
                    <td className="py-3 px-4 text-red-400">{a.balance < 0 ? Math.abs(a.balance).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-white/20 font-bold">
                  <td colSpan={3} className="py-3 px-4 text-white text-right">الإجمالي</td>
                  <td className="py-3 px-4 text-green-400">{totalDebit.toLocaleString()}</td>
                  <td className="py-3 px-4 text-red-400">{totalCredit.toLocaleString()}</td>
                </tr>
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-white text-right">الفرق</td>
                  <td colSpan={2} className={`py-3 px-4 font-bold ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'text-green-400' : 'text-red-400'}`}>
                    {(totalDebit - totalCredit).toLocaleString()} ج.م
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
