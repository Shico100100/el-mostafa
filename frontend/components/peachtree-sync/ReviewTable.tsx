'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  Package,
  type LucideIcon,
} from 'lucide-react';
import {
  usePeachtreeSync,
  type ReviewEntry,
} from '@/hooks/peachtree-sync/usePeachtreeSync';
import { ENTITY_LABELS, REVIEW_PAGE_SIZE } from './labels';

type Hook = ReturnType<typeof usePeachtreeSync>;

function reviewDiff(entry: ReviewEntry): { field: string; old: string; nw: string }[] {
  const oldV = entry.old_values || {};
  const newV = entry.new_values || {};
  const keys = new Set([...Object.keys(oldV), ...Object.keys(newV)]);
  const out: { field: string; old: string; nw: string }[] = [];
  for (const k of keys) {
    if (k === 'items' || k === 'kind') continue;
    const o = JSON.stringify(oldV[k] ?? '');
    const n = JSON.stringify(newV[k] ?? '');
    if (o !== n)
      out.push({ field: k, old: String(oldV[k] ?? ''), nw: String(newV[k] ?? '') });
  }
  return out;
}

export function ReviewTable({ h }: { h: Hook }) {
  const [entityFilter, setEntityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedDiffId, setExpandedDiffId] = useState<string | null>(null);
  const [expandedItemsId, setExpandedItemsId] = useState<string | null>(null);

  const reviewIds = useMemo(() => new Set(h.review.map((e) => e.id)), [h.review]);
  useEffect(() => {
    setSelected((prev) => {
      let changed = false;
      const next = new Set<string>();
      for (const id of prev) {
        if (reviewIds.has(id)) next.add(id);
        else changed = true;
      }
      return changed ? next : prev;
    });
  }, [reviewIds]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return h.review.filter(
      (e) =>
        (entityFilter === 'all' || e.entity === entityFilter) &&
        (q === '' || e.record_key.toLowerCase().includes(q)),
    );
  }, [h.review, entityFilter, search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / REVIEW_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const paged = filtered.slice(
    safePage * REVIEW_PAGE_SIZE,
    (safePage + 1) * REVIEW_PAGE_SIZE,
  );
  useEffect(() => {
    setPage(0);
  }, [entityFilter, search, h.review.length]);

  const allPageSelected =
    paged.length > 0 && paged.every((e) => selected.has(e.id));
  const somePageSelected = paged.some((e) => selected.has(e.id));
  const togglePageSelection = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        for (const e of paged) next.delete(e.id);
      } else {
        for (const e of paged) next.add(e.id);
      }
      return next;
    });
  };

  const applySelected = async () => {
    await h.applyReview([...selected]);
    setSelected(new Set());
  };

  if (h.review.length === 0) {
    return (
      <p className="text-[#6b8378] text-center py-8">
        لا توجد فروقات معلقة — ابدأ بمزامنة من تبويب المزامنة
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <select
          value={entityFilter}
          onChange={(e) => setEntityFilter(e.target.value)}
          aria-label="تصفية حسب الكيان"
          className="px-4 py-2 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white text-sm"
        >
          <option value="all">كل الكيانات ({h.review.length})</option>
          {Object.entries(ENTITY_LABELS).map(([key, meta]) => (
            <option key={key} value={key}>
              {meta.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث برقم السجل..."
          aria-label="بحث برقم السجل"
          className="px-4 py-2 bg-[#121a16] border border-[#1f2d26] rounded-lg text-white text-sm font-mono flex-1"
        />
        {(entityFilter !== 'all' || search.trim() !== '') && (
          <span className="text-[#6b8378] text-sm self-center whitespace-nowrap">
            نتائج: {filtered.length} من {h.review.length}
          </span>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-[#6b8378] text-center py-8">
          لا توجد نتائج مطابقة — غيّر الفلتر أو امسح البحث
        </p>
      ) : (
        <>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={applySelected}
              disabled={h.applying || selected.size === 0}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              {h.applying ? (
                <>جاري التطبيق...</>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  تطبيق المحدد ({selected.size})
                </>
              )}
            </button>
            {selected.size > 0 && (
              <button
                onClick={() => setSelected(new Set())}
                className="text-[#6b8378] hover:text-white text-sm transition"
              >
                مسح التحديد
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#6b8378] border-b border-[#1f2d26]">
                  <th className="py-3 px-4 text-right">
                    <input
                      type="checkbox"
                      aria-label="تحديد الكل في الصفحة"
                      checked={allPageSelected}
                      ref={(el) => {
                        if (el)
                          el.indeterminate =
                            somePageSelected && !allPageSelected;
                      }}
                      onChange={togglePageSelection}
                      className="w-4 h-4"
                    />
                  </th>
                  <th className="py-3 px-4 text-right">الكيان</th>
                  <th className="py-3 px-4 text-right">السجل</th>
                  <th className="py-3 px-4 text-right">النوع</th>
                  <th className="py-3 px-4 text-right">التفاصيل</th>
                  <th className="py-3 px-4 text-right">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((entry) => {
                  const meta =
                    ENTITY_LABELS[entry.entity] ||
                    ({} as { label: string; icon: LucideIcon; color: string });
                  const Icon = (meta.icon || Package) as LucideIcon;
                  const diffs = reviewDiff(entry);
                  const lineItemCount =
                    entry.change_type === 'update' &&
                    entry.entity === 'invoice_line_items'
                      ? [
                          (
                            entry.old_values?.items as
                              | Record<string, unknown>[]
                              | undefined
                          )?.length ?? 0,
                          (
                            entry.new_values?.items as
                              | Record<string, unknown>[]
                              | undefined
                          )?.length ?? 0,
                        ]
                      : null;
                  return (
                    <Fragment key={entry.id}>
                      <tr className="border-b border-[#1f2d26] hover:bg-[#121a16] transition">
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            aria-label={`تحديد ${entry.record_key}`}
                            checked={selected.has(entry.id)}
                            onChange={() => {
                              const next = new Set(selected);
                              if (next.has(entry.id)) next.delete(entry.id);
                              else next.add(entry.id);
                              setSelected(next);
                            }}
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="py-3 px-4 text-white flex items-center gap-2">
                          <Icon
                            className={`w-5 h-5 ${meta.color || 'text-[#6b8378]'}`}
                          />
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
                            <button
                              onClick={() =>
                                setExpandedItemsId(
                                  expandedItemsId === entry.id
                                    ? null
                                    : entry.id,
                                )
                              }
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                            >
                              {expandedItemsId === entry.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              البنود: {lineItemCount[0]} ← {lineItemCount[1]}
                            </button>
                          ) : diffs.length > 0 ? (
                            <button
                              onClick={() =>
                                setExpandedDiffId(
                                  expandedDiffId === entry.id
                                    ? null
                                    : entry.id,
                                )
                              }
                              className="text-sky-400 hover:text-sky-300 flex items-center gap-1"
                            >
                              {expandedDiffId === entry.id ? (
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
                      {expandedDiffId === entry.id && diffs.length > 0 && (
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
                                      {d.nw || '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                      {expandedItemsId === entry.id && lineItemCount && (
                        <tr key={`${entry.id}-items`}>
                          <td colSpan={6} className="px-6 py-4 bg-black/30">
                            <p className="text-[#6b8378] text-xs mb-2">
                              البنود الجديدة التي ستُكتب عند القبول:
                            </p>
                            {(
                              entry.new_values?.items as
                                | Record<string, unknown>[]
                                | undefined
                            )?.length ? (
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="text-[#6b8378] border-b border-[#1f2d26]">
                                    <th className="py-2 text-right">المنتج</th>
                                    <th className="py-2 text-right">الكمية</th>
                                    <th className="py-2 text-right">السعر</th>
                                    <th className="py-2 text-right">الإجمالي</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(
                                    entry.new_values?.items as Record<
                                      string,
                                      unknown
                                    >[]
                                  ).map((it, i) => (
                                    <tr
                                      key={`${entry.id}-item-${i}`}
                                      className="border-b border-[#1f2d26]"
                                    >
                                      <td className="py-2 text-white font-mono">
                                        {String(it.product_id ?? '—')}
                                      </td>
                                      <td className="py-2 text-[#ecfdf5]">
                                        {String(it.quantity ?? '—')}
                                      </td>
                                      <td className="py-2 text-[#ecfdf5]">
                                        {String(it.price ?? '—')}
                                      </td>
                                      <td className="py-2 text-green-400">
                                        {String(it.total ?? '—')}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <span className="text-[#6b8378]">
                                لا توجد بنود جديدة — سيتم مسح البنود الحالية
                              </span>
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>

          {pageCount > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-[#6b8378] text-sm">
                صفحة {safePage + 1} من {pageCount} — عرض {paged.length} من{' '}
                {filtered.length}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={safePage === 0}
                  onClick={() => setPage(safePage - 1)}
                  className="px-4 py-2 bg-[#121a16] text-white rounded-lg text-sm hover:bg-white/20 transition disabled:opacity-40"
                >
                  السابق
                </button>
                <button
                  disabled={safePage >= pageCount - 1}
                  onClick={() => setPage(safePage + 1)}
                  className="px-4 py-2 bg-[#121a16] text-white rounded-lg text-sm hover:bg-white/20 transition disabled:opacity-40"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
