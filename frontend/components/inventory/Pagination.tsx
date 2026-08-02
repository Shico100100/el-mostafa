'use client';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalItems);
  const showing = totalItems > 0 ? `${from}-${to}` : '0';

  return (
    <div className="bg-white/5 border-t border-white/10 px-6 py-4 flex justify-between items-center">
      <div className="text-sm text-gray-400">
        عرض {showing} من أصل {totalItems} منتج
      </div>
      <div className="flex gap-2">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition text-sm"
        >
          السابق
        </button>
        <span className="px-4 py-2 text-white font-medium bg-white/10 rounded-lg">
          {page} / {totalPages || 1}
        </span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-4 py-2 rounded-lg bg-white/5 text-white disabled:opacity-50 hover:bg-white/10 transition text-sm"
        >
          التالي
        </button>
      </div>
    </div>
  );
}
