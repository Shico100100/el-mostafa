'use client';

import { Plus, RefreshCw, Search } from 'lucide-react';

interface WarehousesHeaderProps {
  total: number;
  search: string;
  onSearchChange: (v: string) => void;
  onInit: () => void;
  onAdd: () => void;
}

export function WarehousesHeader({ total, search, onSearchChange, onInit, onAdd }: WarehousesHeaderProps) {
  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-black text-white">المخازن</h1>
            <span className="text-sm text-slate-400">({total})</span>
          </div>
          <div className="flex gap-3">
            <button onClick={onInit} className="text-xs px-3 py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 rounded-xl border border-emerald-500/20 transition flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> تهيئة افتراضي
            </button>
            <button onClick={onAdd} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/30">
              <Plus className="w-5 h-5" /> إضافة
            </button>
          </div>
        </div>
      </header>
      <div className="px-8 py-8">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#ecfdf5]0" />
            <input type="text" placeholder="بحث..." value={search} onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-[#ecfdf5]0 focus:outline-none focus:border-emerald-500" />
          </div>
        </div>
      </div>
    </>
  );
}
