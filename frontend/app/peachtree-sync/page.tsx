'use client';

import { Fragment, useState } from 'react';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import type { ReviewEntry, LogEntry } from '@/hooks/peachtree-sync/usePeachtreeSync';
import {
  Link2, Play, CheckCircle2, XCircle, RefreshCw, Database, Settings,
  Users, Truck, Package, FileText, ChevronDown, ChevronUp, ListChecks, ClipboardList,
  Check, EyeOff,
  type LucideIcon,
} from 'lucide-react';

const ENTITY_LABELS: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  customers: { label: 'العملاء', icon: Users, color: 'text-emerald-400' },
  suppliers: { label: 'الموردين', icon: Truck, color: 'text-orange-400' },
  products: { label: 'المنتجات', icon: Package, color: 'text-green-400' },
  sales_invoices: { label: 'فواتير المبيعات', icon: FileText, color: 'text-emerald-400' },
  purchase_invoices: { label: 'فواتير المشتريات', icon: FileText, color: 'text-rose-400' },
  invoice_line_items: { label: 'بنود الفواتير', icon: Package, color: 'text-teal-400' },
};

const ACTION_LABELS: Record<string, string> = {
  inserted: 'إضافة جديدة',
  different: 'اختلاف',
  skipped: 'مطابق',
  missing: 'غير موجود في Peachtree',
  updated: 'تم التحديث',
  skipped_review: 'تم التجاهل',
};

function reviewDiff(entry: ReviewEntry): { field: string; old: string; new: string }[] {
  const oldV = entry.old_values || {};
  const newV = entry.new_values || {};
  const keys = new Set([...Object.keys(oldV), ...Object.keys(newV)]);
  const out: { field: string; old: string; new: string }[] = [];
  for (const k of keys) {
    if (k === 'items' || k === 'kind') continue;
    const o = JSON.stringify(oldV[k] ?? '');
    const n = JSON.stringify(newV[k] ?? '');
    if (o !== n) out.push({ field: k, old: String(oldV[k] ?? ''), new: String(newV[k] ?? '') });
  }
  return out;
}

export default function PeachtreeSyncPage() {
  const h = usePeachtreeSync();
  const [expandedSync, setExpandedSync] = useState<string | null>(null);
  const [syncingInvoices, setSyncingInvoices] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Set<string>>(new Set());
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  const handleSyncInvoices = async () => {
    setSyncingInvoices(true);
    try {
      await h.syncInvoices(['sales_invoices', 'purchase_invoices']);
    } finally {
      setSyncingInvoices(false);
    }
  };

  if (h.loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
      <div className="text-white text-xl">جاري التحميل...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]" dir="rtl">
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Link2 className="w-8 h-8 text-sky-400" />ربط Peachtree
        </h1>
        <p className="text-[#6b8378] mb-8">مزامنة البيانات مع Peachtree Quantum — {Object.keys(ENTITY_LABELS).length} كيان</p>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-3 h-3 rounded-full ${h.connected === true ? 'bg-green-500' : h.connected === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`} />
              <span className="text-[#6b8378] text-sm">الاتصال</span>
            </div>
            <p className="text-white font-bold">{h.connected === true ? 'متصل' : h.connected === false ? 'غير متصل' : 'لم يتم الفحص'}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
            <p className="text-[#6b8378] text-sm mb-2">عمليات المزامنة</p>
            <p className="text-white font-bold text-2xl">{h.history.length}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
            <p className="text-[#6b8378] text-sm mb-2">جداول Peachtree</p>
            <p className="text-white font-bold text-2xl">{h.tables.length}</p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
            <p className="text-[#6b8378] text-sm mb-2">آخر مزامنة</p>
            <p className="text-white font-bold text-lg">
              {h.history.length > 0
                ? `${h.history[0].records_synced ?? '-'} سجل`
                : '-'}
            </p>
          </div>
        </div>

        {/* Connection Config */}
        <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-sky-400" />إعدادات الاتصال
          </h2>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-[#6b8378] text-sm">DSN / مسار قاعدة البيانات</label>
              <input
                type="text"
                value={h.dsn}
                onChange={e => h.setDsn(e.target.value)}
                placeholder="D:\OneDrive\Mostafaapp"
                className="w-full mt-1 px-4 py-3 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white font-mono text-sm"
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
                className="px-6 py-3 bg-[#121a16] text-white rounded-lg font-semibold hover:bg-white/20 transition whitespace-nowrap flex items-center gap-2"
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
                ? 'bg-[#16241d] text-[#6b8378] cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-600 to-emerald-600 text-white hover:from-sky-700 hover:to-emerald-700'
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
                ? 'bg-[#16241d] text-[#6b8378] cursor-not-allowed'
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
                ? 'bg-[#16241d] text-[#6b8378] cursor-not-allowed'
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
                ? 'bg-[#16241d] text-[#6b8378] cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-teal-600 text-white hover:from-violet-700 hover:to-teal-600'
            }`}
          >
            {syncingInvoices ? (
              <span className="flex items-center gap-2"><RefreshCw className="w-5 h-5 animate-spin" />جاري مزامنة الفواتير...</span>
            ) : (
              <span className="flex items-center gap-2"><FileText className="w-5 h-5" />مزامنة الفواتير فقط</span>
            )}
          </button>
        </div>

        {/* Sync Progress Bar */}
        {(h.syncing || h.resyncing || h.previewing) && (
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
                {h.previewing ? 'جاري المعاينة' : 'جاري المزامنة'} — {h.syncPercent}%
              </span>
              <span className="text-[#6b8378] text-sm">
                {h.syncEntity && ENTITY_LABELS[h.syncEntity]
                  ? ENTITY_LABELS[h.syncEntity].label
                  : h.syncEntity || 'جاري التجهيز...'}
              </span>
            </div>
            <div className="w-full h-3 bg-[#121a16] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${h.syncPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Review Differences */}
        <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-emerald-400" />تقرير الفروقات
            </h2>
            <div className="flex gap-2 md:mr-auto">
               <button
                 onClick={h.previewSync}
                 disabled={h.previewing || h.syncing}
                 className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center gap-2"
               >
                 <RefreshCw className={`w-4 h-4 ${h.previewing ? 'animate-spin' : ''}`} />
                 <span>{h.previewing ? 'جارٍ المعاينة...' : 'معاينة الفروقات'}</span>
               </button>
               <button
                 onClick={() => h.applyReview([...selectedReview])}
                 disabled={h.applying || selectedReview.size === 0}
                 className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50 flex items-center gap-2"
               >
                 {h.applying ? (
                   <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" />جاري التطبيق...</span>
                 ) : (
                   <><Check className="w-4 h-4" />تطبيق المحدد ({selectedReview.size})</>
                 )}
               </button>
              <button
                onClick={() => h.applyReview(h.review.filter((r) => r.status === 'pending').map((r) => r.id))}
                disabled={h.applying}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
              >
                قبول الكل
              </button>
              <button
                onClick={() => h.skipReview(h.review.filter((r) => r.status === 'pending').map((r) => r.id))}
                disabled={h.applying}
                className="px-4 py-2 bg-[#121a16] text-white rounded-lg font-semibold hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2"
              >
                <EyeOff className="w-4 h-4" />تجاهل الكل
              </button>
            </div>
          </div>

          {h.review.length === 0 ? (
            <p className="text-[#6b8378] text-center py-8">
              لا توجد فروقات معلقة — اضغط &quot;معاينة الفروقات&quot; للفحص
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#6b8378] border-b border-[#1f2d26]">
                    <th className="py-3 px-4 text-right" />
                    <th className="py-3 px-4 text-right">الكيان</th>
                    <th className="py-3 px-4 text-right">السجل</th>
                    <th className="py-3 px-4 text-right">النوع</th>
                    <th className="py-3 px-4 text-right">التفاصيل</th>
                    <th className="py-3 px-4 text-right">إجراء</th>
                  </tr>
                </thead>
                <tbody>
                  {h.review.map((entry) => {
                    const meta =
                      ENTITY_LABELS[entry.entity] ||
                      ({} as { label: string; icon: LucideIcon; color: string });
                    const Icon = (meta.icon || Package) as LucideIcon;
                    const diffs = reviewDiff(entry);
                    const lineItemCount =
                      entry.change_type === 'update' &&
                      entry.entity === 'invoice_line_items'
                        ? [
                            (entry.old_values?.items as Record<string, unknown>[] | undefined)?.length ?? 0,
                            (entry.new_values?.items as Record<string, unknown>[] | undefined)?.length ?? 0,
                          ]
                        : null;
                    return (
                      <Fragment key={entry.id}>
                        <tr className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={selectedReview.has(entry.id)}
                              onChange={() => {
                                const next = new Set(selectedReview);
                                if (next.has(entry.id)) next.delete(entry.id);
                                else next.add(entry.id);
                                setSelectedReview(next);
                              }}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="py-3 px-4 text-white flex items-center gap-2">
                            <Icon className={`w-5 h-5 ${meta.color || 'text-[#6b8378]'}`} />
                            {meta.label || entry.entity}
                          </td>
                          <td className="py-3 px-4 text-[#6b8378] font-mono text-xs">
                            {entry.record_key}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                entry.change_type === 'missing'
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : 'bg-sky-500/20 text-sky-400'
                              }`}
                            >
                              {entry.change_type === 'missing'
                                ? 'غير موجود في Peachtree'
                                : 'تحديث'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {lineItemCount ? (
                              <span className="text-[#6b8378]">
                                البنود: {lineItemCount[0]} ← {lineItemCount[1]}
                              </span>
                            ) : diffs.length > 0 ? (
                              <button
                                onClick={() =>
                                  setExpandedSync(
                                    expandedSync === `rv-${entry.id}`
                                      ? null
                                      : `rv-${entry.id}`,
                                  )
                                }
                                className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                              >
                                {expandedSync === `rv-${entry.id}` ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                                {diffs.length} حقل
                              </button>
                            ) : (
                              <span className="text-[#6b8378]">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => h.applyReview([entry.id])}
                                disabled={
                                  h.applying || entry.status !== 'pending'
                                }
                                className="px-2 py-1 rounded text-xs bg-green-600 text-white hover:bg-green-700 disabled:opacity-40"
                              >
                                قبول
                              </button>
                              <button
                                onClick={() => h.skipReview([entry.id])}
                                disabled={
                                  h.applying || entry.status !== 'pending'
                                }
                                className="px-2 py-1 rounded text-xs bg-[#121a16] text-white hover:bg-white/20 disabled:opacity-40"
                              >
                                تجاهل
                              </button>
                            </div>
                          </td>
                        </tr>
                        {expandedSync === `rv-${entry.id}` &&
                          diffs.length > 0 && (
                            <tr key={`${entry.id}-details`}>
                              <td colSpan={6} className="px-6 py-4 bg-black/30">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="text-[#6b8378] border-b border-[#1f2d26]">
                                      <th className="py-2 text-right">الحقل</th>
                                      <th className="py-2 text-right">القديم</th>
                                      <th className="py-2 text-right">الجديد</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {diffs.map((d) => (
                                      <tr
                                        key={d.field}
                                        className="border-b border-[#1f2d26]"
                                      >
                                        <td className="py-2 text-[#6b8378]">
                                          {d.field}
                                        </td>
                                        <td className="py-2 text-[#ecfdf5]">
                                          {d.old || '—'}
                                        </td>
                                        <td className="py-2 text-green-400">
                                          {d.new || '—'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </td>
                            </tr>
                          )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sync History */}
        <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#1f2d26]">
            <h2 className="text-lg font-bold text-white">سجل المزامنة</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6b8378] border-b border-[#1f2d26]">
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
                    <td colSpan={5} className="py-12 text-center text-[#6b8378]">
                      لم تتم أي مزامنة بعد
                    </td>
                  </tr>
                ) : h.history.map((entry) => (
                  <Fragment key={entry.id}>
                    <tr className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                      <td className="py-3 px-4 text-white">
                        {new Date((entry.startedAt || entry.started_at) as string).toLocaleString('ar-EG')}
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
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {entry.records_synced ?? entry.results?.reduce?.(
                          (s: number, r) => s + (r.recordsCreated || 0) + (r.recordsUpdated || 0), 0
                        ) ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-[#6b8378]">
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
                            {entry.results.map((r) => {
                              const meta = ENTITY_LABELS[r.entity] || { label: r.entity, icon: Package, color: 'text-[#6b8378]' };
                              const Icon = meta.icon;
                              return (
                                <div key={r.entity} className="flex items-center gap-3 bg-[#121a16] rounded-lg p-3">
                                  <Icon className={`w-5 h-5 ${meta.color}`} />
                                  <div>
                                    <p className="text-white text-sm font-semibold">{meta.label}</p>
                                    <p className="text-[#6b8378] text-xs">
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

        {/* Audit Log */}
        <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden mt-8">
          <div className="px-6 py-4 border-b border-[#1f2d26] flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-400" />سجل العمليات
            </h2>
            <button
              onClick={h.loadLogs}
              className="text-sky-400 hover:text-sky-300 text-sm"
            >
              تحديث السجل
            </button>
          </div>
          {h.logs.length === 0 ? (
            <p className="py-8 text-center text-[#6b8378]">
              لا توجد عمليات مسجلة بعد
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {Object.entries(
                h.logs.reduce<Record<string, LogEntry[]>>((acc, e) => {
                  ;(acc[e.run_id] ||= []).push(e);
                  return acc;
                }, {}),
              ).map(([runId, events]) => (
                <Fragment key={runId}>
                  <button
                    onClick={() =>
                      setExpandedRun(
                        expandedRun === runId ? null : runId,
                      )
                    }
                    className="w-full text-right px-6 py-3 hover:bg-[#121a16] flex items-center justify-between gap-3"
                  >
                    <div>
                      <p className="text-white font-mono text-xs">{runId}</p>
                      <p className="text-[#6b8378] text-xs">
                        {events.length} حدث — {events[0].triggered_by}
                        {events[0].created_at
                          ? ` — ${new Date(events[0].created_at).toLocaleString('ar-EG')}`
                          : ''}
                      </p>
                    </div>
                    {expandedRun === runId ? (
                      <ChevronUp className="w-4 h-4 text-[#6b8378]" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6b8378]" />
                    )}
                  </button>
                  {expandedRun === runId && (
                    <div className="px-6 pb-4 bg-black/30">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-[#6b8378] border-b border-[#1f2d26]">
                            <th className="py-2 text-right">الكيان</th>
                            <th className="py-2 text-right">الإجراء</th>
                            <th className="py-2 text-right">السجل</th>
                            <th className="py-2 text-right">التغييرات</th>
                          </tr>
                        </thead>
                        <tbody>
                          {events.map((e) => {
                            const meta =
                              ENTITY_LABELS[e.entity] ||
                              ({} as {
                                label: string;
                                icon: LucideIcon;
                                color: string;
                              });
                            const Icon = (meta.icon || Package) as LucideIcon;
                            return (
                              <tr
                                key={e.id}
                                className="border-b border-[#1f2d26]"
                              >
                                <td className="py-2 text-white flex items-center gap-2">
                                  <Icon
                                    className={`w-4 h-4 ${meta.color || 'text-[#6b8378]'}`}
                                  />
                                  {meta.label || e.entity}
                                </td>
                                <td className="py-2 text-[#ecfdf5]">
                                  {ACTION_LABELS[e.action] || e.action}
                                </td>
                                <td className="py-2 text-[#6b8378] font-mono">
                                  {e.record_key}
                                </td>
                                <td className="py-2 text-[#6b8378]">
                                  {e.changes
                                    ? (Object.entries(e.changes) as [
                                        string,
                                        [unknown, unknown],
                                      ][]).map(([f, [o, n]]) => (
                                        <span key={f} className="block">
                                          <span className="text-[#6b8378]">
                                            {f}:
                                          </span>{' '}
                                          {String(o)} ← {String(n)}
                                        </span>
                                      ))
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
