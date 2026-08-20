'use client';

interface CardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  sub?: string;
  color?: 'blue' | 'green' | 'amber' | 'purple' | 'red' | 'emerald';
  className?: string;
}

const colors = {
  blue: 'bg-emerald-500/10 border-emerald-500/20 text-blue-400',
  green: 'bg-green-500/10 border-green-500/20 text-green-400',
  amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
  purple: 'bg-teal-500/10 border-teal-500/20 text-purple-400',
  red: 'bg-red-500/10 border-red-500/20 text-red-400',
  emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
};

const iconBg = {
  blue: 'bg-emerald-500/20', green: 'bg-green-500/20', amber: 'bg-amber-500/20',
  purple: 'bg-teal-500/20', red: 'bg-red-500/20', emerald: 'bg-emerald-500/20',
};

export default function Card({ icon, label, value, sub, color = 'blue', className = '' }: CardProps) {
  return (
    <div className={`${colors[color]} backdrop-blur rounded-xl border p-5 ${className}`}>
      <div className="flex items-center gap-4">
        {icon && <div className={`p-3 ${iconBg[color]} rounded-lg`}>{icon}</div>}
        <div>
          <div className="stat-value">{value}</div>
          <div className="stat-label">{label}</div>
          {sub && <div className="text-[10px] opacity-60 mt-0.5">{sub}</div>}
        </div>
      </div>
    </div>
  );
}
