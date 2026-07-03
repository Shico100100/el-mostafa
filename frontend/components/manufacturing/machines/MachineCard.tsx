'use client';

import { useRouter } from 'next/navigation';
import type { Machine } from '@/components/manufacturing/machines/types';

interface MachineCardProps {
  machine: Machine;
  onEdit: (m: Machine) => void;
  getStatusColor: (s: string) => string;
  getStatusText: (s: string) => string;
  getMaintenanceDays: (m: Machine) => { days: number; isOverdue: boolean } | null;
}

export function MachineCard({ machine, onEdit, getStatusColor, getStatusText, getMaintenanceDays }: MachineCardProps) {
  const router = useRouter();
  const maintenanceStatus = getMaintenanceDays(machine);

  return (
    <div className={`bg-white/10 backdrop-blur-lg p-6 rounded-2xl border ${maintenanceStatus?.isOverdue ? 'border-red-500/50' : 'border-white/20'} relative`}>
      {maintenanceStatus?.isOverdue && (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          صيانة متأخرة {maintenanceStatus.days} يوم
        </div>
      )}
      {!maintenanceStatus?.isOverdue && maintenanceStatus && maintenanceStatus.days <= 7 && !maintenanceStatus.isOverdue && (
        <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
          مستحقة خلال {maintenanceStatus.days} يوم
        </div>
      )}
      <h3 className="text-xl font-bold text-white mb-3">{machine.name}</h3>
      <div className="space-y-2 mb-4">
        <p className="text-gray-300 text-sm">الرقم التسلسلي: {machine.serial_number || '-'}</p>
        {machine.price > 0 && <p className="text-gray-300 text-sm">السعر: {Number(machine.price).toLocaleString()} ج.م (عمر إنتاجي: {machine.useful_life_years || 5} سنوات)</p>}
        <p className="text-gray-300 text-sm">ساعات التشغيل: {machine.total_hours || 0} ساعة</p>
        <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(machine.status)}`}>
          {getStatusText(machine.status)}
        </span>
      </div>
      <div className="bg-white/5 rounded-lg p-3 mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-xs">آخر صيانة:</span>
          <span className="text-gray-200 text-sm">{machine.last_maintenance ? new Date(machine.last_maintenance).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-400 text-xs">الصيانة القادمة:</span>
          <span className={`text-sm ${maintenanceStatus?.isOverdue ? 'text-red-400 font-medium' : maintenanceStatus && maintenanceStatus.days <= 7 ? 'text-yellow-400 font-medium' : 'text-gray-200'}`}>
            {machine.next_maintenance ? new Date(machine.next_maintenance).toLocaleDateString('ar-EG') : 'غير محدد'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onEdit(machine)} className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded">تعديل</button>
        <button onClick={() => router.push(`/manufacturing/machines/${machine.id}`)} className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded">السجل</button>
        <button onClick={() => router.push(`/manufacturing/machines/${machine.id}/maintenance`)} className="flex-1 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded">الصيانة</button>
      </div>
    </div>
  );
}
