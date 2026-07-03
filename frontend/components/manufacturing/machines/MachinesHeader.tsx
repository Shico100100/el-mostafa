'use client';

import ExcelActions from '@/components/ExcelActions';
import { Factory } from 'lucide-react';

interface MachinesHeaderProps {
  onImportSuccess: () => void;
}

export function MachinesHeader({ onImportSuccess }: MachinesHeaderProps) {
  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Factory /> إدارة الماكينات</h1>
        <div className="flex gap-3 items-center">
          <ExcelActions
            exportUrl="/manufacturing/export/machines"
            importUrl="/manufacturing/import/machines"
            fileName="machines.xlsx"
            onImportSuccess={onImportSuccess}
          />
        </div>
      </div>
    </header>
  );
}
