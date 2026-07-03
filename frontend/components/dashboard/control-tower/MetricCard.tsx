'use client';

import type { ReactNode } from 'react';
import { ArrowUpRight } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit: string;
  icon: ReactNode;
  color: 'blue' | 'indigo' | 'rose' | 'emerald';
}

const colorMap: Record<string, string> = {
  blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function MetricCard({ title, value, unit, icon, color }: MetricCardProps) {
  return (
    <div className={`bg-white/5 border rounded-3xl p-6 backdrop-blur-xl transition hover:bg-white/10 group ${colorMap[color] || colorMap.blue}`}>
      <div className="flex justify-between items-start mb-4">
        <span className="text-2xl">{icon}</span>
        <span className="opacity-0 group-hover:opacity-100 transition"><ArrowUpRight className="w-5 h-5" /></span>
      </div>
      <p className="text-slate-400 text-sm font-medium">{title}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <h3 className="text-3xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</h3>
        <span className="text-xs font-bold opacity-60 uppercase">{unit}</span>
      </div>
    </div>
  );
}
