'use client';

interface Props {
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusChange: (v: 'ALL' | 'PASS' | 'FAIL') => void;
}

export function QCSearchFilter({ searchQuery, statusFilter, onSearchChange, onStatusChange }: Props) {
  return (
    <div className="flex flex-col md:flex-row gap-4">
      <input
        type="text"
        placeholder="بحث في الفحوصات..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="flex-1 px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm"
      />
      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as 'ALL' | 'PASS' | 'FAIL')}
        className="px-4 py-2 rounded-lg bg-slate-800 border border-white/10 text-white text-sm"
      >
        <option value="ALL">كل النتائج</option>
        <option value="PASS">ناجح</option>
        <option value="FAIL">راسب</option>
      </select>
    </div>
  );
}
