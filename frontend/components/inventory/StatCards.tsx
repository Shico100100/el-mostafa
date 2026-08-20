'use client';

import type { ReactNode } from 'react';

interface StatCardDef { label: string; value: string | number; icon: ReactNode; color: string; }

function StatCard({ label, value, icon, color }: StatCardDef) {
  return (
    <div className="bg-white/5 backdrop-blur rounded-xl border border-white/10 p-4 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}

export default function StatCards({ cards }: { cards: StatCardDef[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {cards.map((card, i) => (<StatCard key={i} {...card} />))}
    </div>
  );
}
