'use client';

const styles: Record<string, string> = {
  RAW: 'bg-amber-500/20 text-amber-300',
  SEMI: 'bg-emerald-500/20 text-blue-300',
  FINISHED: 'bg-emerald-500/20 text-emerald-300',
  IMPORTED: 'bg-teal-500/20 text-purple-300',
  RAW_PLASTIC: 'bg-orange-500/20 text-orange-300',
  PACKAGING: 'bg-cyan-500/20 text-cyan-300',
};

const labels: Record<string, string> = {
  RAW: 'خامة',
  SEMI: 'نصف مصنع',
  FINISHED: 'منتج تام',
  IMPORTED: 'مستورد',
  RAW_PLASTIC: 'خام بلاستيك',
  PACKAGING: 'تغليف',
};

interface TypeBadgeProps {
  type: string;
  className?: string;
}

export default function TypeBadge({ type, className = '' }: TypeBadgeProps) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[type] || 'bg-[#ecfdf5]0/20 text-gray-300'} ${className}`}>
      {labels[type] || type}
    </span>
  );
}
