'use client';

import { useState } from 'react';
import {
  Link2,
  ListChecks,
  Play,
  ClipboardList,
  Settings,
  EyeOff,
  type LucideIcon,
} from 'lucide-react';
import { usePeachtreeSync } from '@/hooks/peachtree-sync/usePeachtreeSync';
import {
  BulkReviewDialog,
  ReviewJobProgress,
} from '@/components/peachtree-sync/BulkReviewDialog';
import { ReviewTable } from '@/components/peachtree-sync/ReviewTable';
import { SyncPanel } from '@/components/peachtree-sync/SyncPanel';
import { ActivityPanel } from '@/components/peachtree-sync/ActivityPanel';
import { SettingsPanel } from '@/components/peachtree-sync/SettingsPanel';

type TabId = 'review' | 'sync' | 'history' | 'settings';

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'review', label: 'المراجعة', icon: ListChecks },
  { id: 'sync', label: 'المزامنة', icon: Play },
  { id: 'history', label: 'السجل', icon: ClipboardList },
  { id: 'settings', label: 'الإعدادات', icon: Settings },
];

export default function PeachtreeSyncPage() {
  const h = usePeachtreeSync();
  const [tab, setTab] = useState<TabId>('review');
  const [bulkAction, setBulkAction] = useState<'apply' | 'skip' | null>(null);
  const [dismissedJobId, setDismissedJobId] = useState<string | null>(null);

  if (h.loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f0d]">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );

  const pendingTotal = h.pendingSummary?.total ?? 0;

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d]"
      dir="rtl"
    >
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Link2 className="w-8 h-8 text-sky-400" />
          ربط Peachtree
        </h1>
        <p className="text-[#6b8378] mb-6">
          مزامنة البيانات مع Peachtree Quantum — مراجعة ثم تنفيذ
        </p>

        {/* Status strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl px-4 py-3 flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${h.connected === true ? 'bg-green-500' : h.connected === false ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'}`}
            />
            <div>
              <p className="text-[#6b8378] text-xs">الاتصال</p>
              <p className="text-white font-semibold text-sm">
                {h.connected === true
                  ? 'متصل'
                  : h.connected === false
                    ? 'غير متصل'
                    : 'لم يتم الفحص'}
              </p>
            </div>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl px-4 py-3">
            <p className="text-[#6b8378] text-xs">فروقات معلقة</p>
            <p className="text-white font-bold text-xl tabular-nums">
              {h.pendingSummary
                ? pendingTotal.toLocaleString('ar-EG')
                : '—'}
            </p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl px-4 py-3">
            <p className="text-[#6b8378] text-xs">آخر مزامنة</p>
            <p className="text-white font-semibold text-sm">
              {h.history.length === 0
                ? '—'
                : h.history[0].status === 'completed'
                  ? `${h.history[0].records_synced ?? '-'} سجل`
                  : h.history[0].status === 'failed'
                    ? 'فشلت'
                    : 'جارية...'}
            </p>
          </div>
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl px-4 py-3">
            <p className="text-[#6b8378] text-xs">عملية جماعية</p>
            <p className="text-white font-semibold text-sm">
              {h.reviewJobRunning && h.reviewJob
                ? `جارية ${h.reviewJob.percentComplete}%`
                : h.reviewJob
                  ? 'انتهت'
                  : 'لا يوجد'}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#1f2d26] overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-3 font-semibold text-sm flex items-center gap-2 whitespace-nowrap transition border-b-2 -mb-px ${
                  active
                    ? 'text-white border-sky-400'
                    : 'text-[#6b8378] border-transparent hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
                {t.id === 'review' && pendingTotal > 0 && (
                  <span className="bg-emerald-600 text-white text-xs rounded-full px-2 py-0.5 tabular-nums">
                    {pendingTotal.toLocaleString('ar-EG')}
                  </span>
                )}
                {t.id === 'sync' &&
                  (h.syncing || h.reviewJobRunning) && (
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                  )}
              </button>
            );
          })}
        </div>

        {tab === 'review' && (
          <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-400" />
                تقرير الفروقات
              </h2>
              <div className="flex flex-wrap gap-2 md:mr-auto">
                <button
                  onClick={h.previewSync}
                  disabled={h.previewing || h.syncing}
                  title="تشغّل مزامنة كاملة من Peachtree ثم تعرض الفروقات — تمسح القائمة الحالية والتحديد"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {h.previewing
                    ? 'جارٍ المزامنة والمعاينة...'
                    : 'مزامنة ومعاينة الفروقات'}
                </button>
                <button
                  onClick={() => setBulkAction('apply')}
                  disabled={
                    h.applying || h.reviewJobRunning || !h.pendingSummary
                  }
                  title={
                    !h.pendingSummary
                      ? 'لم يتم تحميل عدد الفروقات بعد'
                      : 'قبول كل الفروقات المعلقة في عملية خلفية'
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-50"
                >
                  قبول الكل
                </button>
                <button
                  onClick={() => setBulkAction('skip')}
                  disabled={
                    h.applying || h.reviewJobRunning || !h.pendingSummary
                  }
                  title={
                    !h.pendingSummary
                      ? 'لم يتم تحميل عدد الفروقات بعد'
                      : 'تجاهل كل الفروقات المعلقة في عملية خلفية'
                  }
                  className="px-4 py-2 bg-[#121a16] text-white rounded-lg font-semibold hover:bg-white/20 transition disabled:opacity-50 flex items-center gap-2"
                >
                  <EyeOff className="w-4 h-4" />
                  تجاهل الكل
                </button>
              </div>
            </div>
            <p className="text-[#6b8378] text-xs mb-4">
              تنبيه: المعاينة تشغّل مزامنة كاملة — تُنشأ فروقات جديدة وتُمسح
              القائمة الحالية والتحديد.
            </p>

            {h.reviewJob && h.reviewJob.id !== dismissedJobId && (
              <ReviewJobProgress
                job={h.reviewJob}
                running={h.reviewJobRunning}
                onDismiss={
                  h.reviewJobRunning
                    ? undefined
                    : () => setDismissedJobId(h.reviewJob!.id)
                }
              />
            )}

            {bulkAction && (
              <BulkReviewDialog
                action={bulkAction}
                summary={h.pendingSummary}
                loading={h.loading}
                onConfirm={async () => {
                  const action = bulkAction;
                  setBulkAction(null);
                  await h.startReviewJob(action);
                }}
                onClose={() => setBulkAction(null)}
              />
            )}

            <ReviewTable h={h} />
          </div>
        )}

        {tab === 'sync' && <SyncPanel h={h} />}

        {tab === 'history' && <ActivityPanel h={h} />}

        {tab === 'settings' && <SettingsPanel h={h} />}
      </div>
    </div>
  );
}
