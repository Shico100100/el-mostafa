'use client';

import { ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  date: string;
  onDateChange: (d: string) => void;
  onNewRecord: () => void;
}

export function AttendanceHeader({ date, onDateChange, onNewRecord }: Props) {
  const router = useRouter();

  return (
    <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full text-white transition">
            <ArrowRight className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">الغياب والحضور</h1>
        </div>
        <div className="flex items-center gap-4">
          <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1 text-sm focus:outline-none focus:border-blue-500 transition" />
          <button onClick={onNewRecord}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-bold shadow-lg shadow-blue-600/20">
            + تسجيل جديد
          </button>
        </div>
      </div>
    </header>
  );
}
