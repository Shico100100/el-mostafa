'use client';

import type { User } from '@/components/settings/types';

interface Props {
  user: User | null;
}

export function SystemInfoCard() {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">معلومات النظام</h3>
      <div className="space-y-3 text-gray-300">
        <p><span className="text-white font-semibold">الإصدار:</span> 1.0.0</p>
        <p><span className="text-white font-semibold">قاعدة البيانات:</span> PostgreSQL</p>
        <p><span className="text-white font-semibold">الحالة:</span> <span className="text-green-400">نشط</span></p>
      </div>
    </div>
  );
}

export function UserInfoCard({ user }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">معلومات المستخدم</h3>
      <div className="space-y-3 text-gray-300">
        <p><span className="text-white font-semibold">الاسم:</span> {user?.firstName} {user?.lastName}</p>
        <p><span className="text-white font-semibold">البريد الإلكتروني:</span> {user?.email}</p>
        <p><span className="text-white font-semibold">الدور:</span> {user?.role?.name}</p>
        <p><span className="text-white font-semibold">الصلاحيات:</span> {user?.role?.id === 1 ? 'كاملة' : 'محدودة'}</p>
      </div>
    </div>
  );
}
