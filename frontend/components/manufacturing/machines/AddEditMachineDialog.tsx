'use client';

import type { Machine } from '@/components/manufacturing/machines/types';

interface AddEditMachineDialogProps {
  visible: boolean;
  editingMachine: Machine | null;
  formError: string | null;
  formErrors: Record<string, string>;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onClose: () => void;
}

export function AddEditMachineDialog({ visible, editingMachine, formError, formErrors, onSubmit, onClose }: AddEditMachineDialogProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={onClose}>
      <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8 max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-6">
          {editingMachine ? 'تعديل ماكينة' : 'إضافة ماكينة جديدة'}
        </h2>
        <form onSubmit={onSubmit} className="space-y-4">
          {formError && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">{formError}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">اسم الماكينة</label>
            <input name="name" type="text" defaultValue={editingMachine?.name} required
              className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.name ? 'border-red-500' : 'border-white/20'}`} />
            {formErrors.name && <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الرقم التسلسلي</label>
            <input name="serial_number" type="text" defaultValue={editingMachine?.serial_number} required
              className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.serial_number ? 'border-red-500' : 'border-white/20'}`} />
            {formErrors.serial_number && <p className="text-red-400 text-xs mt-1">{formErrors.serial_number}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الطاقة (كيلو وات/ساعة)</label>
            <input name="power_consumption" type="number" step="0.01" defaultValue={editingMachine?.power_consumption}
              className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.power_consumption ? 'border-red-500' : 'border-white/20'}`} />
            {formErrors.power_consumption && <p className="text-red-400 text-xs mt-1">{formErrors.power_consumption}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">سعر الماكينة (ج.م)</label>
            <input name="price" type="number" step="0.01" defaultValue={editingMachine?.price}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">العمر الإنتاجي (سنوات)</label>
            <input name="useful_life_years" type="number" min="1" defaultValue={editingMachine?.useful_life_years || 5}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">الحالة</label>
            <select name="status" defaultValue={editingMachine?.status || 'ACTIVE'}
              className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.status ? 'border-red-500' : 'border-white/20'}`}>
              <option value="ACTIVE">نشطة</option>
              <option value="INACTIVE">غير نشطة</option>
              <option value="MAINTENANCE">صيانة</option>
              <option value="BROKEN">معطلة</option>
            </select>
            {formErrors.status && <p className="text-red-400 text-xs mt-1">{formErrors.status}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">تاريخ الشراء</label>
            <input name="purchase_date" type="date" defaultValue={editingMachine?.purchase_date?.split('T')[0] || ''}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
            <textarea name="notes" defaultValue={editingMachine?.notes} rows={3}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
          </div>
          <div className="flex gap-4 justify-end">
            <button type="button" onClick={onClose}
              className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
            <button type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700">
              {editingMachine ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
