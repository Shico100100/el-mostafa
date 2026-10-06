'use client';

import { Fragment, useState } from 'react';
import {
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Package,
  type LucideIcon,
} from 'lucide-react';
import {
  usePeachtreeSync,
  type LogEntry,
} from '@/hooks/peachtree-sync/usePeachtreeSync';
import { ENTITY_LABELS, ACTION_LABELS } from './labels';

type Hook = ReturnType<typeof usePeachtreeSync>;

export function ActivityPanel({ h }: { h: Hook }) {
  const [expandedRun, setExpandedRun] = useState<string | null>(null);

  return (
    <div className="bg-black/40 backdrop-blur-xl border border-[#1f2d26] rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-[#1f2d26] flex items-center justify-between">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-violet-400" />
          سجل العمليات
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
              (acc[e.run_id] ||= []).push(e);
              return acc;
            }, {}),
          ).map(([runId, events]) => (
            <Fragment key={runId}>
              <button
                onClick={() =>
                  setExpandedRun(expandedRun === runId ? null : runId)
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
                                ? (
                                    Object.entries(e.changes) as [
                                      string,
                                      [unknown, unknown],
                                    ][]
                                  ).map(([f, [o, n]]) => (
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
  );
}
