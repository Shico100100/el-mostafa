'use client';

import { BarChart3, FileSpreadsheet, Package } from 'lucide-react';
import ExcelActions from '@/components/ExcelActions';

export function AccessoriesToolbar({
  onOpenReports, onDraftPO, onOpenBulk, onAdd, onImportSuccess,
}: {
  onOpenReports: () => void;
  onDraftPO: () => void;
  onOpenBulk: () => void;
  onAdd: () => void;
  onImportSuccess: () => void;
}) {
  return (
    <div className="flex justify-between mb-6">
      <div className="flex gap-3">
        <ExcelActions
          exportUrl="/manufacturing/accessories/export/excel"
          importUrl="/manufacturing/accessories/import/excel"
          fileName="accessories.xlsx"
          onImportSuccess={onImportSuccess}
        />
        <button onClick={onOpenReports} className="px-4 py-2 bg-purple-600/20 text-purple-300 hover:bg-purple-600/30 border border-purple-500/30 rounded-lg transition flex items-center gap-1">
          <BarChart3 className="w-4 h-4" /> التقارير
        </button>
        <button onClick={onDraftPO} className="px-4 py-2 bg-orange-600/20 text-orange-300 hover:bg-orange-600/30 border border-orange-500/30 rounded-lg transition flex items-center gap-1">
          <FileSpreadsheet className="w-4 h-4" /> مسودة طلبية
        </button>
        <button onClick={onOpenBulk} className="px-4 py-2 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg transition flex items-center gap-1">
          <Package className="w-4 h-4" /> استلام مجمع
        </button>
        <button onClick={onAdd} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition">
          + إضافة أكسسوار
        </button>
      </div>
    </div>
  );
}
