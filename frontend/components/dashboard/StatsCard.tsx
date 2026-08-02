'use client';

import { type ReactNode } from 'react';

interface StatsCardProps {
  label: string;
  value: number;
  icon: ReactNode;
  color: string;
  suffix?: string;
}

export function StatsCard({ label, value, icon, color, suffix = ' ج.م' }: StatsCardProps) {
  return (
    <div className="group relative bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-5 hover:border-white/20 transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 group-hover:opacity-[0.07] transition-opacity duration-500`} />

      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>

      <p className="relative z-10 text-2xl font-black text-white tabular-nums">
        {value.toLocaleString('ar-EG')}{suffix}
      </p>
      <p className="relative z-10 text-xs text-slate-400 mt-1">{label}</p>

      <div className={`absolute bottom-0 left-4 right-4 h-[2px] bg-gradient-to-r ${color} scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-right rounded-full`} />
    </div>
  );
}
