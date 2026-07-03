'use client';

import { type ReactNode } from 'react';

interface NavCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  badge?: string;
  gradient?: string;
}

export function NavCard({ icon, title, description, onClick, badge, gradient }: NavCardProps) {
  const baseClass = gradient || 'bg-white/10 backdrop-blur-lg';
  return (
    <div onClick={onClick}
      className={`${baseClass} p-6 rounded-2xl border border-white/20 hover:bg-white/20 transition cursor-pointer group`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition duration-300">
          <span className="text-2xl">{icon}</span>
        </div>
        {badge && <div className="px-2 py-1 bg-red-500/20 text-red-400 text-[10px] rounded-full font-bold">{badge}</div>}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  );
}

interface NavButtonProps {
  icon: ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  gradient: string;
  borderClass?: string;
  iconBg?: string;
}

export function NavButton({ icon, title, description, onClick, gradient, borderClass, iconBg }: NavButtonProps) {
  return (
    <button onClick={onClick}
      className={`${gradient} hover:opacity-80 backdrop-blur-lg p-8 rounded-2xl border ${borderClass || 'border-white/10'} flex flex-col items-center gap-4 transition group`}>
      <span className="text-5xl group-hover:scale-110 transition">{icon}</span>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-blue-200 text-center">{description}</p>
    </button>
  );
}
