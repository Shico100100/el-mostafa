'use client';

import { FileText, TrendingDown } from 'lucide-react';

interface RawMaterialsToolbarProps {
  onEntryLog: () => void;
  onConsumption: () => void;
  onAdd: () => void;
}

export function RawMaterialsToolbar({ onEntryLog, onConsumption, onAdd }: RawMaterialsToolbarProps) {
  return (
    <div className="flex gap-4 mb-6">
      <button onClick={onEntryLog} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-semibold transition flex items-center gap-2">
        <FileText /> سجل دخول الخامات
      </button>
      <button onClick={onConsumption} className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg font-semibold transition flex items-center gap-2">
        <TrendingDown /> سجل الاستهلاك
      </button>
      <button onClick={onAdd} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center gap-2">
        + مادة خام جديدة
      </button>
    </div>
  );
}
