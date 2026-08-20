'use client';

import type { Machine } from '@/components/manufacturing/maintenance/types';
import { X } from 'lucide-react';

interface AddMaintenanceDialogProps {
  visible: boolean;
  machines: Machine[];
  formData: {
    machine_id: string;
    type: string;
    date: string;
    description: string;
    cost: string;
    status: string;
    notes: string;
  };
  onFormChange: (data: Record<string, string>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function AddMaintenanceDialog({ visible, machines, formData, onFormChange, onSubmit, onClose }: AddMaintenanceDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-[#0f1714] w-full max-w-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden" style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold">تسجيل عملية صيانة</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X /></button>
        </div>
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">الماكينة</label>
              <select required value={formData.machine_id} onChange={e => onFormChange({ machine_id: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-emerald-500 outline-none">
                <option value="">اختر الماكينة</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">النوع</label>
              <select value={formData.type} onChange={e => onFormChange({ type: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-emerald-500 outline-none">
                <option value="SCHEDULED">دورية</option>
                <option value="BREAKDOWN">عطل مفاجئ</option>
                <option value="PREVENTIVE">وقائية</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">التاريخ</label>
              <input type="date" required value={formData.date} onChange={e => onFormChange({ date: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">التكلفة (ج.م)</label>
              <input type="number" value={formData.cost} onChange={e => onFormChange({ cost: e.target.value })}
                className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-emerald-500 outline-none" placeholder="0.00" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">الوصف</label>
            <textarea required value={formData.description} onChange={e => onFormChange({ description: e.target.value })}
              className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-emerald-500 outline-none h-24"
              placeholder="وصف تفصيلي للعملية..." />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">الحالة</label>
            <select value={formData.status} onChange={e => onFormChange({ status: e.target.value })}
              className="w-full bg-slate-800 border border-white/10 rounded-xl p-3 focus:border-emerald-500 outline-none">
              <option value="PENDING">معلق</option>
              <option value="IN_PROGRESS">جاري العمل</option>
              <option value="COMPLETED">مكتمل</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="submit"
              className="flex-1 py-4 bg-blue-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all">
              حفظ البيانات
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-all border border-white/10">
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
