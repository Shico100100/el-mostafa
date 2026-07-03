'use client';

import { ArrowLeft, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  onNewUser: () => void;
}

export function UsersHeader({ onNewUser }: Props) {
  const router = useRouter();

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">إدارة المستخدمين والصلاحيات</h1>
        </div>
        <button onClick={onNewUser} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40">
          <UserPlus className="w-5 h-5" />
          إضافة مستخدم
        </button>
      </div>
    </header>
  );
}
