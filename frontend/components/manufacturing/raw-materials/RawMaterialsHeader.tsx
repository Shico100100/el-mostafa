'use client';

import ExcelActions from '@/components/ExcelActions';
import { Package } from 'lucide-react';

interface RawMaterialsHeaderProps {
  onBack: () => void;
  onImportSuccess: () => void;
}

export function RawMaterialsHeader({ onBack, onImportSuccess }: RawMaterialsHeaderProps) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <Package />
          إدارة المواد الخام
        </h1>
        <div className="flex gap-3 items-center">
          <button onClick={onBack} className="px-4 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg transition">
            العودة للتصنيع
          </button>
          <ExcelActions
            exportUrl="/manufacturing/export/raw-materials"
            importUrl="/manufacturing/import/raw-materials"
            fileName="raw_materials.xlsx"
            onImportSuccess={onImportSuccess}
          />
        </div>
      </div>
    </header>
  );
}
