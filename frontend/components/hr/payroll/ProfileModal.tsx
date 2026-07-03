'use client';

import { useState, useEffect } from 'react';
import type { CalculationResult } from '@/components/hr/payroll/types';

interface ProfileModalProps {
  visible: boolean;
  calculationResults: CalculationResult[];
  onSave: (data: { user_id: number; base_salary: number; working_hours_per_day: number; overtime_rate: number; deduction_rate: number }) => void;
  onClose: () => void;
}

export function ProfileModal({ visible, calculationResults, onSave, onClose }: ProfileModalProps) {
  const [userId, setUserId] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [workingHours, setWorkingHours] = useState('8');
  const [overtimeRate, setOvertimeRate] = useState('1.5');
  const [deductionRate, setDeductionRate] = useState('1.0');

  useEffect(() => {
    if (!visible) { setUserId(''); setBaseSalary(''); }
  }, [visible]);

  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      user_id: Number(userId),
      base_salary: Number(baseSalary),
      working_hours_per_day: Number(workingHours),
      overtime_rate: Number(overtimeRate),
      deduction_rate: Number(deductionRate),
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      <form onSubmit={handleSubmit} className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md relative z-10 p-6 space-y-4 shadow-2xl">
        <h2 className="text-xl font-bold mb-4">إعدادات راتب موظف</h2>
        <div>
          <label className="block text-sm text-gray-400 mb-1">الموظف</label>
          <select value={userId} onChange={e => setUserId(e.target.value)} required
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 appearance-none">
            <option value="">اختر الموظف...</option>
            {calculationResults.map(r => (
              <option key={r.user.id} value={r.user.id}>{r.user.firstName} {r.user.lastName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">الراتب الأساسي (ج.م)</label>
          <input type="number" step="0.01" value={baseSalary} onChange={e => setBaseSalary(e.target.value)}
            required className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">ساعات العمل/يوم</label>
            <input type="number" value={workingHours} onChange={e => setWorkingHours(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">معدل الإضافي (x)</label>
            <input type="number" step="0.1" value={overtimeRate} onChange={e => setOvertimeRate(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">معدل الخصم للغياب (x)</label>
          <input type="number" step="0.1" value={deductionRate} onChange={e => setDeductionRate(e.target.value)}
            className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" />
        </div>
        <div className="flex gap-4 pt-4">
          <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold transition">حفظ</button>
          <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 py-2 rounded-lg transition">إلغاء</button>
        </div>
      </form>
    </div>
  );
}
