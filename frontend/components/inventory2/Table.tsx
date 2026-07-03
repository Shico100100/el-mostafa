'use client';

import { ChevronUp, ChevronDown, Inbox } from 'lucide-react';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  sortField?: string;
  sortDir?: 'asc' | 'desc';
  onSort?: (field: string) => void;
  onRowClick?: (item: T) => void;
  loading?: boolean;
  emptyMessage?: string;
}

export default function Table<T>({
  columns, data, keyExtractor, sortField, sortDir, onSort,
  onRowClick, loading, emptyMessage = 'لا توجد بيانات',
}: TableProps<T>) {
  if (loading) return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden animate-pulse">
      <div className="bg-white/5 px-6 py-4 flex gap-6">
        {columns.map((_, i) => <div key={i} className="h-4 bg-white/10 rounded flex-1" />)}
      </div>
      {Array.from({ length: 5 }).map((_, r) => (
        <div key={r} className="px-6 py-4 flex gap-6 border-t border-white/5">
          {columns.map((_, c) => <div key={c} className="h-4 bg-white/10 rounded flex-1" />)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && onSort?.(col.key)}
                  className={`px-6 py-4 text-right text-gray-400 text-sm font-medium ${
                    col.sortable ? 'cursor-pointer hover:text-white select-none' : ''
                  } ${col.className || ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-gray-500">
                  <Inbox className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  onClick={() => onRowClick?.(item)}
                  className={`transition ${onRowClick ? 'cursor-pointer hover:bg-white/5' : 'hover:bg-white/5'}`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 text-white ${col.className || ''}`}>
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
