'use client';

import { Search } from 'lucide-react';

interface FilterSelect { value: string; onChange: (value: string) => void; options: { value: string; label: string }[]; placeholder: string; }
interface FilterToggle { label: string; active: boolean; onClick: () => void; icon?: React.ReactNode; }

export default function FilterBar({ search, onSearchChange, searchPlaceholder = 'بحث...', selects, toggles, children }: {
  search: string; onSearchChange: (value: string) => void; searchPlaceholder?: string;
  selects?: FilterSelect[]; toggles?: FilterToggle[]; children?: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex flex-wrap gap-4 items-center mb-6">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder={searchPlaceholder} value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pr-10 pl-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" />
      </div>
      {selects?.map((s, i) => (
        <select key={i} value={s.value} onChange={(e) => s.onChange(e.target.value)}
          className="px-4 py-2.5 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 min-w-[140px]">
          <option value="">{s.placeholder}</option>
          {s.options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
        </select>
      ))}
      {children}
      {toggles?.map((t, i) => (
        <button key={i} onClick={t.onClick}
          className={`px-4 py-2.5 rounded-xl font-medium transition flex items-center gap-2 border ${t.active ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-900/50 text-slate-400 border-white/10 hover:border-red-500/30 hover:text-red-400'}`}>
          {t.icon}{t.label}
        </button>
      ))}
    </div>
  );
}
