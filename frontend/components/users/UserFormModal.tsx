'use client';

import { ROLES, type UserForm } from '@/components/users/types';

interface Props {
  show: boolean;
  editing: boolean;
  formData: UserForm;
  onFormChange: (d: UserForm) => void;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export function UserFormModal({ show, editing, formData, onFormChange, onSave, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="glass p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">
          {editing ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد'}
        </h2>
        <form onSubmit={onSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-400">الاسم الأول</label>
              <input className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 transition outline-none"
                value={formData.firstName} onChange={e => onFormChange({ ...formData, firstName: e.target.value })} required />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-slate-400">اسم العائلة</label>
              <input className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 transition outline-none"
                value={formData.lastName} onChange={e => onFormChange({ ...formData, lastName: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-400">البريد الإلكتروني</label>
            <input type="email" className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 transition outline-none"
              value={formData.email} onChange={e => onFormChange({ ...formData, email: e.target.value })} required />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-400">كلمة المرور {editing && '(اتركها فارغة لعدم التغيير)'}</label>
            <input type="password" className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 transition outline-none"
              value={formData.password} onChange={e => onFormChange({ ...formData, password: e.target.value })} required={!editing} />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-slate-400">الصلاحية</label>
            <select className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-emerald-500/50 transition outline-none"
              value={formData.role.id}
              onChange={e => onFormChange({ ...formData, role: { id: parseInt(e.target.value) } })}>
              {ROLES.map(r => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 justify-end mt-8">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-300 hover:bg-white/5 rounded-xl transition">إلغاء</button>
            <button type="submit" className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-emerald-500/20">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
