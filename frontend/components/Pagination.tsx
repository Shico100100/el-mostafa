'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  showingItems: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, totalItems, showingItems, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-3">
      <div className="text-sm text-gray-400">
        عرض {showingItems} من {totalItems.toLocaleString()}
      </div>
      <div className="flex gap-2 items-center">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm disabled:opacity-50 transition"
        >
          السابق
        </button>
        {generatePageNumbers(page, totalPages).map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-500 text-sm">...</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p as number)}
              className={`px-3 py-1.5 rounded-lg text-sm transition ${
                p === page
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-white/5 hover:bg-white/10 text-gray-300'
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white text-sm disabled:opacity-50 transition"
        >
          التالي
        </button>
      </div>
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}
