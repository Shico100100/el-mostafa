'use client';

import {
  X, Check, EyeOff, AlertTriangle, RefreshCw,
  Users as UsersIcon, Truck as TruckIcon, Package as PackageIcon,
  FileText as FileIcon,
  type LucideIcon,
} from 'lucide-react';
import type { ReviewSummary, ReviewJob } from '@/hooks/peachtree-sync/usePeachtreeSync';

const ENTITY_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  customers: { label: 'العملاء', icon: UsersIcon },
  suppliers: { label: 'الموردين', icon: TruckIcon },
  products: { label: 'المنتجات', icon: PackageIcon },
  sales_invoices: { label: 'فواتير المبيعات', icon: FileIcon },
  purchase_invoices: { label: 'فواتير المشتريات', icon: FileIcon },
  invoice_line_items: { label: 'بنود الفواتير', icon: PackageIcon },
};

interface BulkReviewDialogProps {
  action: 'apply' | 'skip';
  summary: ReviewSummary | null;
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function BulkReviewDialog({
  action, summary, loading, onConfirm, onClose,
}: BulkReviewDialogProps) {
  const isApply = action === 'apply';
  const total = summary?.total ?? 0;
  const byEntity = summary?.byEntity ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f1714] border border-[#1f2d26] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#1f2d26] flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            {isApply ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <EyeOff className="w-5 h-5 text-[#6b8378]" />
            )}
            {isApply ? 'قبول الكل' : 'تجاهل الكل'}
          </h2>
          <button onClick={onClose} className="text-[#6b8378] hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading ? (
            <p className="text-[#6b8378] text-center py-8">جاري التحميل...</p>
          ) : total === 0 ? (
            <p className="text-[#6b8378] text-center py-8">
              لا توجد فروقات معلقة
            </p>
          ) : (
            <>
              <div className="text-center py-2">
                <p className="text-4xl font-bold text-white tabular-nums">
                  {total.toLocaleString('ar-EG')}
                </p>
                <p className="text-[#6b8378] text-sm mt-1">سجل تعليق</p>
              </div>

              <div className="space-y-2">
                <p className="text-[#6b8378] text-sm">التوزيع حسب النوع:</p>
                <div className="space-y-1.5">
                  {byEntity.map((row) => {
                    const meta = ENTITY_LABELS[row.entity];
                    const Icon = meta?.icon ?? PackageIcon;
                    const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                    return (
                      <div key={row.entity} className="flex items-center gap-2 text-sm">
                        <Icon className="w-4 h-4 text-[#6b8378] shrink-0" />
                        <span className="text-[#6b8378] w-32 shrink-0 truncate">
                          {meta?.label ?? row.entity}
                        </span>
                        <div className="flex-1 h-1.5 bg-[#121a16] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500/60 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-white font-mono text-xs tabular-nums w-16 text-left">
                          {row.count.toLocaleString('ar-EG')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isApply && (
                <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-amber-300 text-xs leading-relaxed">
                    القبول يطبّق تغييرات Peachtree على بياناتك الفعلية. العملية
                    تستمر في الخلفية حتى لو أغلقت الصفحة، وكل سجل يُحفظ على حدة.
                  </p>
                </div>
              )}
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onConfirm}
              disabled={loading || total === 0}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold text-white transition disabled:opacity-40 flex items-center justify-center gap-2 ${
                isApply
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-[#121a16] hover:bg-white/20'
              }`}
            >
              {isApply ? <Check className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {isApply ? 'تأكيد القبول' : 'تأكيد التجاهل'}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-[#121a16] text-[#6b8378] rounded-lg font-semibold hover:text-white transition"
            >
              إلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ReviewJobProgressProps {
  job: ReviewJob;
  running: boolean;
}

export function ReviewJobProgress({ job, running }: ReviewJobProgressProps) {
  const isApply = job.action === 'apply';
  const meta = job.currentEntity ? ENTITY_LABELS[job.currentEntity] : null;
  const doneLabel = job.done.toLocaleString('ar-EG');
  const totalLabel = job.total.toLocaleString('ar-EG');

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-sky-500/20 rounded-xl p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-white font-semibold text-sm flex items-center gap-2">
          {running && (
            <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
          )}
          {running
            ? isApply ? 'جاري قبول الكل' : 'جاري تجاهل الكل'
            : isApply ? 'انتهى قبول الكل' : 'انتهى تجاهل الكل'}
        </span>
        <span className="text-white font-mono text-sm tabular-nums">
          {doneLabel} / {totalLabel}
        </span>
      </div>

      <div className="w-full h-2.5 bg-[#121a16] rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-l from-sky-500 to-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${job.percentComplete}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#6b8378]">
        <span className="tabular-nums">{job.percentComplete}%</span>
        {running && job.currentRecordKey && (
          <span className="flex items-center gap-1.5 truncate">
            <span>{meta?.label ?? job.currentEntity}</span>
            <span className="font-mono text-[#ecfdf5]">{job.currentRecordKey}</span>
          </span>
        )}
        {!running && job.failed > 0 && (
          <span className="text-red-400">فشل {job.failed}</span>
        )}
      </div>
    </div>
  );
}
