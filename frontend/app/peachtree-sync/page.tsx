'use client';

import { Fragment } from 'react';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import {
  Link2, Play, CheckCircle2, XCircle, RefreshCw, Database, Settings,
  Users, Truck, Package, FileText, ChevronDown, ChevronUp,
} from 'lucide-react';
import { useState } from 'react';

const ENTITY_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  customers: { label: 'العملاء', icon: Users, color: 'text-blue-400' },
  suppliers: { label: 'الموردين', icon: Truck, color: 'text-orange-400' },
  products: { label: 'المنتجات', icon: Package, color: 'text-green-400' },
  sales_invoices: { label: 'فواتير المبيعات', icon: FileText, color: 'text-emerald-400' },
  purchase_invoices: { label: 'فواتير المشتريات', icon: FileText, color: 'text-rose-400' },
  invoice_line_items: { label: 'بنود الفواتير', icon: Package, color: 'text-teal-400' },
};

export default function PeachtreeSyncPage() {
  const h = usePeachtreeSync();
  const [expandedSync, setExpandedSync] = useState<string | null>(null);
  const [syncingInvoices, setSyncingInvoices] = useState(false);

  const handleSyncInvoices = async () => {
    setSyncingInvoices(true);
    try {
      await h.syncInvoices(['sales_invoices', 'purchase_invoices']);
    } finally {
      setSyncingInvoices(false);
    }
  };

  if (h.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Link2 className="w-8 h-8 text-sky-400" />ربط Peachtree
        </h1>
        <p className="text-gray-400 mb-8">مزامنة البيانات مع Peachtree Quantum — {Object.keys(ENTITY_LABELS).length} كيان</p>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${h.connected === true ? 'bg-green-500' : h.connected === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-gray-400 text-sm">الاتصال</span>
            </div>
            <p className="text-white font-bold">{h.connected === true ? 'متصل' : h.connected === false ? 'غير متصل' : 'لم يتم الفحص'}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">عمليات المزامنة</p>
            <p className="text-white font-bold text-2xl">{h.history.length}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">جداول Peachtree</p>
            <p className="text-white font-bold text-2xl">{h.tables.length}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <p className="text-gray-400 text-sm mb-2">آخر مزامنة</p>
            <p className="text-white font-bold text-lg">
              {h.history.length > 0
                ? `${h.history[0].records_synced ?? '-'} سجل`
                : '-'}
            </p>
          </div>
        </div>

        {/* Connection Config */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-sky-400" />إعدادات الاتصال
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-gray-400 text-sm">DSN / مسار قاعدة البيانات</label>
              <input
                type="text"
                value={h.dsn}
                onChange={e => h.setDsn(e.target.value)}
                placeholder="D:\OneDrive\Mostafaapp"
                className="w-full mt-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={h.saveConfig}
                className="px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition whitespace-nowrap"
              >
                حفظ
              </button>
              <button
                onClick={h.testConnection}
                disabled={h.testing}
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition whitespace-nowrap flex items-center gap-2"
              >
                {h.testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                <span>{h.testing ? 'جاري الفحص...' : 'اختبار الاتصال'}</span>
              </button>
            </div>
          </div>
          {h.connected === true && (
            <p className="text-green-400 text-sm mt-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />الاتصال ناجح — DSN: {h.dsn}
            </p>
          )}
          {h.connected === false && (
            <p className="text-red-400 text-sm mt-3 flex items-center gap-2">
              <XCircle className="w-4 h-4" />فشل الاتصال — {h.connectionError || 'تأكد من تثبيت Pervasive PSQL ODBC driver'}
            </p>
          )}
        </div>

        {/* Sync Button */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => h.runSync('full')}
            disabled={h.syncing || h.connected !== true}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition flex items-center gap-3 ${
              h.syncing || h.connected !== true
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white hover:from-sky-700 hover:to-blue-700'
            }`}
          >
            {h.syncing ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />جاري المزامنة...</span>
            ) : (
              <span className="flex items-center gap-2"><Play className="w-5 h-5" />مزامنة شاملة ({Object.keys(ENTITY_LABELS).length} كيان)</span>
            )}
          </button>
          <button
            onClick={h.resyncItems}
            disabled={h.resyncing || h.syncing || h.connected !== true}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition flex items-center gap-3 ${
              h.resyncing || h.syncing || h.connected !== true
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700'
            }`}
          >
            {h.resyncing ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />جاري إعادة المزامنة...</span>
            ) : (
              <span className="flex items-center gap-2"><Package className="w-5 h-5" />إعادة مزامنة الأصناف</span>
            )}
          </button>
          <button
            onClick={() => h.runIncrementalSync()}
            disabled={h.syncing || h.connected !== true}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition flex items-center gap-3 ${
              h.syncing || h.connected !== true
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700'
            }`}
          >
            <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5" />إعادة مزامنة ذكية</span>
          </button>
          <button
            onClick={handleSyncInvoices}
            disabled={syncingInvoices || h.syncing || h.connected !== true}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition flex items-center gap-3 ${
              syncingInvoices || h.syncing || h.connected !== true
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:from-violet-700 hover:to-purple-700'
            }`}
          >
            {syncingInvoices ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />جاري مزامنة الفواتير...</span>
            ) : (
              <span className="flex items-center gap-2"><FileText className="w-5 h-5" />مزامنة الفواتير فقط</span>
            )}
          </button>
        </div>

        {/* Sync History */}
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/10">
            <h2 className="text-lg font-bold text-white">سجل المزامنة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 border-b border-white/10">
                  <th className="py-3 px-4 text-right">التاريخ</th>
                  <th className="py-3 px-4 text-right">الحالة</th>
                  <th className="py-3 px-4 text-right">السجلات</th>
                  <th className="py-3 px-4 text-right">المدة</th>
                  <th className="py-3 px-4 text-right">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {h.history.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-500">
                      لم تتم أي مزامنة بعد
                    </td>
                  </tr>
                ) : h.history.map((entry: any) => (
                  <Fragment key={entry.id}>
                    <tr className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="py-3 px-4 text-white">
                        {new Date(entry.startedAt || entry.started_at).toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          entry.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : entry.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {entry.status === 'completed' ? 'نجاح' : entry.status === 'failed' ? 'فشل' : 'قيد التنفيذ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-blue-400 font-semibold">
                        {entry.records_synced ?? entry.results?.reduce?.(
                          (s: number, r: any) => s + (r.recordsCreated || 0) + (r.recordsUpdated || 0), 0
                        ) ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-gray-400">
                        {entry.duration_ms ? `${(entry.duration_ms / 1000).toFixed(1)} ث` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {entry.results && entry.results.length > 0 && (
                          <button
                            onClick={() => setExpandedSync(expandedSync === entry.id ? null : entry.id)}
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                          >
                            {expandedSync === entry.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {entry.results.length} كيان
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedSync === entry.id && entry.results && (
                      <tr key={`${entry.id}-details`}>
                        <td colSpan={5} className="px-6 py-4 bg-black/30">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {entry.results.map((r: any) => {
                              const meta = ENTITY_LABELS[r.entity] || { label: r.entity, icon: Package, color: 'text-gray-400' };
                              const Icon = meta.icon;
                              return (
                                <div key={r.entity} className="flex items-center gap-3 bg-white/5 rounded-lg p-3">
                                  <Icon className={`w-5 h-5 ${meta.color}`} />
                                  <div>
                                    <p className="text-white text-sm font-semibold">{meta.label}</p>
                                    <p className="text-gray-400 text-xs">
                                      +{r.recordsCreated} / ~{r.recordsUpdated} / ={r.recordsSkipped}
                                      {r.status === 'failed' && <span className="text-red-400 mr-2">فشل</span>}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
