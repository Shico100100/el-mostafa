'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Users, ArrowLeft, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface Employee {
  id: number;
  base_salary: number;
  working_hours_per_day: number;
  overtime_rate: number;
  deduction_rate: number;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPayrollProfiles().then((data) => {
      setEmployees(data || []);
    }).catch(() => toast.error('فشل تحميل بيانات الموظفين')).finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      {/* Header */}
      <header className="bg-slate-900/70 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/hr')} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold">الموظفين</h1>
                <p className="text-xs text-slate-500">إدارة ملفات الموظفين وبياناتهم</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/hr/payroll')}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-sm font-medium hover:from-emerald-700 hover:to-teal-700 transition"
          >
            <DollarSign className="w-4 h-4" />
            الرواتب
          </button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">لا يوجد موظفين بعد</p>
            <p className="text-xs text-slate-600 mt-1">يمكنك إضافة موظفين من صفحة الرواتب</p>
            <button
              onClick={() => router.push('/hr/payroll')}
              className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-sm font-medium hover:from-blue-700 hover:to-indigo-700 transition"
            >
              الذهاب للرواتب
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="bg-slate-800/50 backdrop-blur-sm rounded-xl border border-white/5 p-5 hover:border-white/10 transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
                      {emp.user?.firstName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium">{emp.user?.firstName} {emp.user?.lastName}</p>
                      <p className="text-xs text-slate-500">{emp.user?.email}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">الراتب الأساسي</span>
                    <span className="font-bold text-emerald-400">{emp.base_salary.toLocaleString()} ج.م</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ساعات العمل</span>
                    <span>{emp.working_hours_per_day} س/يوم</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">أجر الإضافي</span>
                    <span className="text-amber-400">{emp.overtime_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">نسبة الخصم</span>
                    <span className="text-rose-400">{emp.deduction_rate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
