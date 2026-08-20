'use client';

import { Warehouse } from 'lucide-react';
import { Modal } from '@/components/inventory2/Modal';
import type { WarehouseForm } from '@/hooks/inventory2/useWarehouses';

interface WarehouseModalProps {
  isOpen: boolean;
  editing: boolean;
  form: WarehouseForm;
  saving: boolean;
  onClose: () => void;
  onFormChange: (f: WarehouseForm) => void;
  onSave: () => void;
}

export function WarehouseModal({ isOpen, editing, form, saving, onClose, onFormChange, onSave }: WarehouseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}
      title={editing ? 'تعديل المخزن' : 'إضافة مخزن جديد'}
      icon={<Warehouse className="w-6 h-6 text-cyan-400" />}>
      <form onSubmit={(e) => { e.preventDefault(); onSave(); }} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">الاسم *</label>
          <input type="text" value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" autoFocus />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">الموقع / الوصف</label>
          <textarea value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-900/50 border border-white/20 rounded-xl text-white focus:border-emerald-500 focus:outline-none" rows={3} />
        </div>
        <div className="flex gap-3 justify-end pt-4 border-t border-white/10">
          <button type="button" onClick={onClose} className="px-5 py-2.5 bg-slate-700/50 text-slate-200 rounded-xl hover:bg-slate-700 transition">إلغاء</button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-bold hover:from-blue-700 hover:to-cyan-700 transition disabled:opacity-50 shadow-lg shadow-blue-900/20">
            {saving ? 'جاري...' : editing ? 'تحديث' : 'إضافة'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
