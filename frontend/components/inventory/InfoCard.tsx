'use client';

export default function InfoCard({ title, icon, children, className = '' }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string;
}) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl ${className}`}>
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </div>
  );
}

export function DetailRow({ label, value, valueClass = 'text-white' }: { label: string; value: React.ReactNode; valueClass?: string }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className={`font-bold text-sm ${valueClass}`}>{value}</span>
    </div>
  );
}
