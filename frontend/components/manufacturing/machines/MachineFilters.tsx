'use client';

interface MachineFiltersProps {
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onAdd: () => void;
}

export function MachineFilters({ searchQuery, statusFilter, onSearchChange, onStatusChange, onAdd }: MachineFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      <div className="flex-1">
        <input
          type="text" placeholder="بحث بالاسم أو الرقم التسلسلي..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
        />
      </div>
      <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)}
        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white">
        <option value="">كل الحالات</option>
        <option value="ACTIVE">نشطة</option>
        <option value="INACTIVE">غير نشطة</option>
        <option value="MAINTENANCE">صيانة</option>
        <option value="BROKEN">معطلة</option>
      </select>
      <button onClick={onAdd}
        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition whitespace-nowrap">
        + إضافة ماكينة
      </button>
    </div>
  );
}
