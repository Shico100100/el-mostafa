'use client';

export function AddEditAccessoryModal({
  show, isEdit, formData, setFormData, setSelectedFile, onSubmit, onClose,
}: {
  show: boolean;
  isEdit: boolean;
  formData: Record<string, string>;
  setFormData: (data: Record<string, string>) => void;
  setSelectedFile: (file: File | null) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 p-8 rounded-xl w-full max-w-md border border-white/20">
        <h2 className="text-xl font-bold text-white mb-4">{isEdit ? 'تعديل' : 'إضافة جديد'}</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <input
            className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
            placeholder="اسم الأكسسوار"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
          <div className="space-y-2">
            <label className="text-sm text-gray-400">صورة الأكسسوار (اختياري)</label>
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files && setSelectedFile(e.target.files[0])}
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="الوحدة (قطعة، متر...)"
              value={formData.unit || ''}
              onChange={e => setFormData({ ...formData, unit: e.target.value })}
            />
            <input
              type="number"
              className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
              placeholder="حد الطلب"
              value={formData.reorder_point || ''}
              onChange={e => setFormData({ ...formData, reorder_point: e.target.value })}
            />
          </div>
          <input
            type="number"
            step="0.01"
            className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
            placeholder="وزن القطعة (جرام) - اختياري"
            value={formData.weight_per_piece || ''}
            onChange={e => setFormData({ ...formData, weight_per_piece: e.target.value })}
          />
          <textarea
            className="w-full p-2 bg-white/5 border border-white/10 rounded text-white"
            placeholder="ملاحظات"
            value={formData.notes || ''}
            onChange={e => setFormData({ ...formData, notes: e.target.value })}
          />
          <div className="flex gap-2 justify-end mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-300">إلغاء</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
