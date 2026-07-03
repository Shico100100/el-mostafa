'use client';

import { useRouter } from 'next/navigation';
import type { Machine } from '@/components/manufacturing/machines/types';
import { AlertTriangle } from 'lucide-react';

interface MaintenanceAlertProps {
  overdueCount: number;
  machines: Machine[];
  getMaintenanceDays: (m: Machine) => { days: number; isOverdue: boolean } | null;
}

export function MaintenanceAlert({ overdueCount, machines, getMaintenanceDays }: MaintenanceAlertProps) {
  const router = useRouter();
  if (overdueCount === 0) return null;

  return (
    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-2xl"><AlertTriangle /></span>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-red-200 mb-2">تنبيه: ماكينات تحتاج صيانة عاجلة!</h3>
          <p className="text-red-300 mb-3">يوجد {overdueCount} ماكينة متأخرة في الصيانة:</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {machines.slice(0, 4).map(m => (
              <div key={m.id} className="bg-red-500/10 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <span className="text-white font-medium">{m.name}</span>
                  <span className="text-red-300 text-sm mr-2">متأخر {getMaintenanceDays(m)?.days} يوم</span>
                </div>
                <button onClick={() => router.push(`/manufacturing/machines/${m.id}/maintenance`)}
                  className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-200 text-sm rounded-lg transition">صيانة</button>
              </div>
            ))}
            {overdueCount > 4 && (
              <div className="col-span-full text-center text-red-300 text-sm">+ {overdueCount - 4} ماكينات أخرى</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
