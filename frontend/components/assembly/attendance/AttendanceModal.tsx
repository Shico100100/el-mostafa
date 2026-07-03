'use client';

import type { AttendanceRecord, Worker } from '@/components/assembly/attendance/types';

interface Props {
  show: boolean;
  editingRecord: AttendanceRecord | null;
  workers: Worker[];
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function AttendanceModal({ show, editingRecord, workers, onSave, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="bg-slate-800 border border-white/10 rounded-2xl w-full max-w-md relative z-10 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/5">
          <h2 className="text-xl font-bold">{editingRecord ? 'تعديل سجل حضور' : 'تسجيل حضور جديد'}</h2>
        </div>
        <form onSubmit={onSave} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">الموظف</label>
            <select name="user_id" defaultValue={editingRecord?.user_id} required
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition appearance-none">
              <option value="">اختر الموظف...</option>
              {workers.map(w => (
                <option key={w.id} value={w.id}>{w.firstName} {w.lastName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">الحالة</label>
            <select name="status" defaultValue={editingRecord?.status || 'PRESENT'}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition appearance-none">
              <option value="PRESENT">حاضر</option>
              <option value="ABSENT">غائب</option>
              <option value="LATE">متأخر</option>
              <option value="EXCUSED">إذن / عذر</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">وقت الحضور</label>
              <input type="time" name="check_in" defaultValue={editingRecord?.check_in}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">وقت الانصراف</label>
              <input type="time" name="check_out" defaultValue={editingRecord?.check_out}
                className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">ملاحظات</label>
            <textarea name="notes" defaultValue={editingRecord?.notes} rows={3}
              className="w-full bg-slate-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition resize-none"
              placeholder="أي ملاحظات إضافية..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition">حفظ</button>
            <button type="button" onClick={onClose} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-2 rounded-lg transition">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
