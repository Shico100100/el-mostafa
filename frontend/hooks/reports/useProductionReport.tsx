/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthCheck } from '@/lib/useAuthCheck';
import { toast } from 'sonner';

const API_URL = '/api';

export interface ProductionRecord {
  id: number;
  date: string;
  machine?: { name: string };
  mold?: { name: string };
  raw_material?: { name: string };
  total_production_kg: number | string;
  pieces_produced: number;
  downtime_minutes?: number;
}

export function useProductionReport() {
  const router = useRouter();
  const ready = useAuthCheck();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProductionRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      if (!token) { return; }
      const response = await fetch(`${API_URL}/v1/manufacturing/production?start_date=${startDate}&end_date=${endDate}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (response.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); router.push('/login'); return; }
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      setData(Array.isArray(result) ? result : []);
    } catch (err: unknown) {
      console.error('Error loading report:', err);
      setError(err instanceof Error ? err.message : 'حدث خطأ أثناء تحميل التقرير');
    } finally { setLoading(false); }
  }, [startDate, endDate, router]);

  useEffect(() => { if (!ready) return; loadReport(); }, [ready, loadReport]);

  const handleDelete = async (id: number) => {
    toast.custom((t: any) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">هل أنت متأكد من حذف هذا السجل؟</p>
        <p className="text-slate-400 text-sm mb-4">لن يتم التراجع عن تحديثات المخزون.</p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-slate-700/50 text-slate-200 rounded-lg hover:bg-slate-700 transition">إلغاء</button>
          <button onClick={async () => {
            toast.dismiss(t);
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${API_URL}/v1/manufacturing/production/${id}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
              });
              if (!response.ok) throw new Error('فشل الحذف');
              setData(prev => prev.filter(item => item.id !== id));
              toast.success('تم حذف السجل');
            } catch (err: unknown) {
              toast.error(err instanceof Error ? err.message : 'فشل الحذف');
            }
          }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">حذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  return { loading, data, error, startDate, endDate, setStartDate, setEndDate, loadReport, handleDelete };
}
