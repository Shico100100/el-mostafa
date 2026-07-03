'use client';

interface AlertSectionProps {
  hasActiveMachines: boolean;
}

export function AlertSection({ hasActiveMachines }: AlertSectionProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">تنبيهات سريعة</h3>
      <div className="text-gray-400 text-center py-8">
        {hasActiveMachines ? 'النظام يعمل بشكل مستقر' : 'لا توجد ماكينات نشطة حالياً'}
      </div>
    </div>
  );
}
