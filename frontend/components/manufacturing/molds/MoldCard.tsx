'use client';

import { useRouter } from 'next/navigation';
import type { Mold } from '@/components/manufacturing/molds/types';

interface MoldCardProps {
  mold: Mold;
  onEdit: (m: Mold) => void;
  onIssue: (m: Mold) => void;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'GOOD': return 'bg-green-500/20 text-green-200';
    case 'NEEDS_REPAIR': return 'bg-yellow-500/20 text-yellow-200';
    case 'BROKEN': return 'bg-red-500/20 text-red-200';
    default: return 'bg-[#ecfdf5]0/20 text-gray-200';
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'GOOD': return 'سليمة';
    case 'NEEDS_REPAIR': return 'تحتاج صيانة';
    case 'BROKEN': return 'معطلة';
    case 'MAINTENANCE': return 'تحت الصيانة';
    default: return status;
  }
}

export function MoldCard({ mold, onEdit, onIssue }: MoldCardProps) {
  const router = useRouter();

  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-3">{mold.name}</h3>
      <div className="space-y-2 mb-4">
        <p className="text-gray-300 text-sm">المنتج: {mold.product?.name || 'غير محدد'}</p>
        <p className="text-gray-300 text-sm">الوزن: {mold.product_weight} جرام</p>
        {mold.price > 0 && <p className="text-gray-300 text-sm">السعر: {Number(mold.price).toLocaleString()} ج.م</p>}
        <p className="text-gray-300 text-sm">عدد العيون: {mold.cavities}</p>
        <div className="mt-2 text-xs">
          <div className="flex justify-between mb-1">
            <span className="text-gray-400">العمر الافتراضي ({mold.current_shots || 0})</span>
            <span className={mold.life_cycle_status === 'critical' ? 'text-red-400' : mold.life_cycle_status === 'warning' ? 'text-amber-400' : 'text-green-400'}>
              {(((mold.current_shots ?? 0) / (mold.max_shots || 1)) * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${mold.life_cycle_status === 'critical' ? 'bg-red-500' : mold.life_cycle_status === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(((mold.current_shots || 0) / (mold.max_shots || 1000000)) * 100, 100)}%` }} />
          </div>
        </div>
        <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(mold.status)}`}>
          {getStatusText(mold.status)}
        </span>
      </div>
      <div className="flex gap-2">
        <button onClick={() => router.push(`/manufacturing/molds/${mold.id}`)}
          className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-blue-200 rounded">السجل</button>
        <button onClick={() => onEdit(mold)}
          className="flex-1 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-purple-200 rounded">تعديل</button>
        <button onClick={() => onIssue(mold)}
          className="flex-1 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded">مشكلة</button>
      </div>
    </div>
  );
}
