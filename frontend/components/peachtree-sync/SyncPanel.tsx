'use client';

import { Fragment, useState } from 'react';
import {
  Play,
  Package,
  RefreshCw,
  FileText,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import { ENTITY_LABELS } from './labels';

type Hook = ReturnType<typeof usePeachtreeSync>;

interface ActionCard {
  key: string;
  title: string;
  description: string;
  button: string;
  icon: LucideIcon;
  gradient: string;
  run: (h: Hook) => Promise<void> | void;
  busy: (h: Hook) => boolean;
}

const ACTIONS: ActionCard[] = [
  {
    key: 'full',
    title: 'مزامنة شاملة',
    description: 'كل الكيانات الستة من Peachtree — قد تستغرق عدة دقائق',
    button: 'ابدأ الشاملة',
    icon: Play,
    gradient: 'from-sky-600 to-emerald-600 hover:from-sky-700 hover:to-emerald-700',
    run: (h) => h.runSync('full'),
    busy: (h) => h.syncing,
  },
  {
    key: 'smart',
    title: 'مزامنة ذكية',
    description: 'تتخطى الكيانات التي لم يتغير عدد سجلاتها منذ آخر مزامنة',
    button: 'ابدأ الذكية',
    icon: RefreshCw,
    gradient: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700',
    run: (h) => h.runIncrementalSync(),
    busy: (h) => h.syncing,
  },
  {
    key: 'items',
    title: 'إعادة مزامنة الأصناف',
    description: 'إعادة بناء بنود الفواتير فقط — لا يمس العملاء أو المنتجات',
    button: 'ابدأ الأصناف',
    icon: Package,
    gradient: 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700',
    run: (h) => h.resyncItems(),
    busy: (h) => h.resyncing || h.syncing,
  },
  {
    key: 'invoices',
    title: 'مزامنة الفواتير فقط',
    description: 'فواتير المبيعات والمشتريات فقط — لا يمس العملاء أو المنتجات',
    button: 'ابدأ الفواتير',
    icon: FileText,
    gradient: 'from-violet-600 to-teal-600 hover:from-violet-700 hover:to-teal-600',
    run: (h) => h.syncInvoices(['sales_invoices', 'purchase_invoices']),
    busy: (h) => h.syncing,
  },
];

export function SyncPanel({ h }: { h: Hook }) {
  const [expandedSyncId, setExpandedSyncId] = useState<string | null>(null);
  const connected = h.connected === true;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          const busy = a.busy(h);
          return (
            <div
              key={a.key}
              className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6 flex flex-col gap-3"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-6 h-6 text-sky-400" />
                <h3 className="text-white font-bold text-lg">{a.title}</h3>
              </div>
              <p className="text-[#6b8378] text-sm flex-1">{a.description}</p>
              <button
                onClick={() => a.run(h)}
                disabled={busy || !connected}
                title={
                  connected
                    ? a.description
                    : 'اختبر الاتصال أولاً من تبويب الإعدادات'
                }
                className={`px-6 py-3 rounded-lg font-semibold text-white transition bg-gradient-to-r ${a.gradient} disabled:opacity-40 flex items-center justify-center gap-2`}
              >
                {busy && <RefreshCw className="w-4 h-4 animate-spin" />}
                {busy ? 'جارٍ التنفيذ...' : a.button}
              </button>
            </div>
          );
        })}
      </div>

      {(h.syncing || h.resyncing || h.previewing) && (
        <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              {h.previewing ? 'جاري المزامنة والمعاينة' : 'جاري المزامنة'} —{' '}
              {h.syncPercent}%
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
              ) : (
                h.history.map((entry) => (
                  <Fragment key={entry.id}>
                    <tr className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                      <td className="py-3 px-4 text-white">
                        {new Date(
                          (entry.startedAt || entry.started_at) as string,
                        ).toLocaleString('ar-EG')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            entry.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : entry.status === 'failed'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {entry.status === 'completed'
                            ? 'نجاح'
                            : entry.status === 'failed'
                              ? 'فشل'
                              : 'قيد التنفيذ'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">
                        {entry.records_synced ??
                          entry.results?.reduce(
                            (s: number, r) =>
                              s +
                              (r.recordsCreated || 0) +
                              (r.recordsUpdated || 0),
                            0,
                          ) ??
                          '-'}
                      </td>
                      <td className="py-3 px-4 text-[#6b8378]">
                        {entry.duration_ms
                          ? `${(entry.duration_ms / 1000).toFixed(1)} ث`
                          : '-'}
                      </td>
                      <td className="py-3 px-4">
                        {entry.results && entry.results.length > 0 && (
                          <button
                            onClick={() =>
                              setExpandedSyncId(
                                expandedSyncId === entry.id ? null : entry.id,
                              )
                            }
                            className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                          >
                            {expandedSyncId === entry.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                            {entry.results.length} كيان
                          </button>
                        )}
                      </td>
                    </tr>
                    {expandedSyncId === entry.id && entry.results && (
                      <tr key={`${entry.id}-details`}>
                        <td colSpan={5} className="px-6 py-4 bg-black/30">
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {entry.results.map((r, i) => {
                              const meta = ENTITY_LABELS[r.entity] || {
                                label: r.entity,
                                icon: Package,
                                color: 'text-[#6b8378]',
                              };
                              const CardIcon = meta.icon;
                              return (
                                <div
                                  key={`${r.entity}-${i}`}
                                  className="flex items-center gap-3 bg-[#121a16] rounded-lg p-3"
                                >
                                  <CardIcon
                                    className={`w-5 h-5 ${meta.color}`}
                                  />
                                  <div>
                                    <p className="text-white text-sm font-semibold">
                                      {meta.label}
                                    </p>
                                    <p className="text-[#6b8378] text-xs">
                                      +{r.recordsCreated} / ~{r.recordsUpdated}{' '}
                                      / ={r.recordsSkipped}
                                      {r.status === 'failed' && (
                                        <span className="text-red-400 mr-2">
                                          فشل
                                        </span>
                                      )}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
