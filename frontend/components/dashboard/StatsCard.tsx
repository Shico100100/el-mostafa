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
    <div className="group relative overflow-hidden rounded-xl border border-[#1f2d26] bg-[#121a16] p-5 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5">
      <div className={`absolute inset-x-0 top-0 h-1 bg-emerald-500`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-0 transition-opacity duration-500 group-hover:opacity-[0.07]`} />

      <div className="relative z-10 flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
          {icon}
        </div>
      </div>

      <p className="relative z-10 text-2xl font-black text-white tabular-nums">
        {value.toLocaleString('ar-EG')}{suffix}
      </p>
      <p className="relative z-10 text-xs text-[#6b8378] mt-1">{label}</p>
    </div>
  );
}
