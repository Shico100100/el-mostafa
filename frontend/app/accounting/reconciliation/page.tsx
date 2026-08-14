'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { ArrowLeftRight, CheckCircle, AlertTriangle, XCircle, Download, FileText } from 'lucide-react';

interface ReconciliationItem {
  account_code: string;
  account_name: string;
  type: string;
  elmostafa_balance: number;
  journal_computed: number;
  difference: number;
  status: 'MATCHED' | 'DISCREPANCY' | 'NO_JOURNAL';
}

interface ReconciliationSummary {
  total_accounts: number;
  matched: number;
  discrepancies: number;
  no_journal: number;
  total_difference: number;
  items: ReconciliationItem[];
}

const STATUS_CONFIG = {
  MATCHED: { label: 'مطابق', color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle },
  DISCREPANCY: { label: 'خلاف', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertTriangle },
  NO_JOURNAL: { label: 'بدون قيود', color: 'text-yellow-400', bg: 'bg-yellow-500/20', icon: XCircle },
};

const TYPE_LABELS: Record<string, string> = {
  ASSET: 'أصول',
  LIABILITY: 'خصوم',
  EQUITY: 'حقوق ملكية',
  REVENUE: 'إيرادات',
  EXPENSE: 'مصروفات',
};

export default function ReconciliationPage() {
  const [data, setData] = useState<ReconciliationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'MATCHED' | 'DISCREPANCY' | 'NO_JOURNAL'>('ALL');
  const router = useRouter();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await api.fetchWithAuth<ReconciliationSummary>('/v1/accounting/reconciliation');
      setData(result);
      setError('');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData();
  }, [fetchData, router]);

  const exportCSV = () => {
    if (!data) return;
    const headers = ['كود الحساب', 'اسم الحساب', 'النوع', 'رصيد ELMostafa', 'رصيد اليومية', 'الفرق', 'الحالة'];
    const rows = filteredItems.map((i) => [
      i.account_code, i.account_name, TYPE_LABELS[i.type] || i.type,
      i.elmostafa_balance.toFixed(2), i.journal_computed.toFixed(2),
      i.difference.toFixed(2), STATUS_CONFIG[i.status].label,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reconciliation.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    if (!data) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const rows = filteredItems
      .map(
        (i) => `<tr>
          <td style="padding:8px;border:1px solid #ddd">${i.account_code}</td>
          <td style="padding:8px;border:1px solid #ddd">${i.account_name}</td>
          <td style="padding:8px;border:1px solid #ddd">${TYPE_LABELS[i.type] || i.type}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:left">${i.elmostafa_balance.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:left">${i.journal_computed.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #ddd;text-align:left">${i.difference.toLocaleString()}</td>
          <td style="padding:8px;border:1px solid #ddd">${STATUS_CONFIG[i.status].label}</td>
        </tr>`,
      )
      .join('');
    printWindow.document.write(`
      <html><head><title>المطابقة المالية</title></head><body dir="rtl">
      <h2>تقرير المطابقة المالية</h2>
      <p>إجمالي الحسابات: ${data.total_accounts} | مطابق: ${data.matched} | خلاف: ${data.discrepancies} | بدون قيود: ${data.no_journal}</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f3f4f6">
          <th style="padding:8px;border:1px solid #ddd">كود</th>
          <th style="padding:8px;border:1px solid #ddd">اسم</th>
          <th style="padding:8px;border:1px solid #ddd">النوع</th>
          <th style="padding:8px;border:1px solid #ddd">ELMostafa</th>
          <th style="padding:8px;border:1px solid #ddd">اليومية</th>
          <th style="padding:8px;border:1px solid #ddd">الفرق</th>
          <th style="padding:8px;border:1px solid #ddd">الحالة</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-red-400 text-xl">{error}</div>
      </div>
    );
  }

  const filteredItems =
    data?.items.filter((i) => filter === 'ALL' || i.status === filter) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <header className="bg-white/5 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <ArrowLeftRight className="w-6 h-6 text-blue-400" />
          <h1 className="text-2xl font-bold text-white">المطابقة المالية</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard label="إجمالي الحسابات" value={data.total_accounts} color="text-white" />
              <StatCard label="مطابق" value={data.matched} color="text-green-400" />
              <StatCard label="خلافات" value={data.discrepancies} color="text-red-400" />
              <StatCard label="بدون قيود" value={data.no_journal} color="text-yellow-400" />
              <StatCard label="إجمالي الفروقات" value={data.total_difference.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} color="text-orange-400" />
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4 mb-6 flex flex-wrap items-center gap-3">
              {(['ALL', 'DISCREPANCY', 'NO_JOURNAL', 'MATCHED'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'الكل' : STATUS_CONFIG[f].label}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition"
              >
                <Download className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={exportPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-xl text-sm transition"
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>

            <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">كود الحساب</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">اسم الحساب</th>
                      <th className="px-4 py-3 text-right text-gray-400 font-medium">النوع</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">رصيد ELMostafa</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">رصيد اليومية</th>
                      <th className="px-4 py-3 text-left text-gray-400 font-medium">الفرق</th>
                      <th className="px-4 py-3 text-center text-gray-400 font-medium">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, idx) => {
                      const cfg = STATUS_CONFIG[item.status];
                      const Icon = cfg.icon;
                      return (
                        <tr
                          key={idx}
                          className={`border-b border-white/5 hover:bg-white/5 transition ${cfg.bg}`}
                        >
                          <td className="px-4 py-3 text-white font-mono">{item.account_code}</td>
                          <td className="px-4 py-3 text-gray-300">{item.account_name}</td>
                          <td className="px-4 py-3 text-gray-400">{TYPE_LABELS[item.type] || item.type}</td>
                          <td className="px-4 py-3 text-white text-left font-mono">
                            {item.elmostafa_balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-white text-left font-mono">
                            {item.journal_computed.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className={`px-4 py-3 text-left font-mono ${item.difference !== 0 ? cfg.color : 'text-gray-400'}`}>
                            {item.difference.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                              <Icon className="w-3 h-3" />
                              {cfg.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredItems.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                          لا توجد نتائج
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-4">
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
