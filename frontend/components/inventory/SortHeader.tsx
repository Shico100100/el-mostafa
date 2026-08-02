'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import type { SortField, SortDir } from './types';

interface SortHeaderProps {
  field: SortField;
  label: string;
  sortField: SortField;
  sortDir: SortDir;
  onToggle: (field: SortField) => void;
  className?: string;
}

export default function SortHeader({ field, label, sortField, sortDir, onToggle, className = '' }: SortHeaderProps) {
  return (
    <th
      className={`px-6 py-4 text-right text-gray-300 font-semibold text-sm cursor-pointer hover:text-white select-none ${className}`}
      onClick={() => onToggle(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronUp className="w-3.5 h-3.5 opacity-20" />
        )}
      </span>
    </th>
  );
}
