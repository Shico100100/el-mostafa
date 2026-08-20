'use client';

interface QuickProductModalProps {
  show: boolean;
  data: { name: string; unit: string; weight_grams: string };
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDataChange: (data: QuickProductModalProps['data']) => void;
}

export default function QuickProductModal({
  show, data, onClose, onSubmit, onDataChange,
}: QuickProductModalProps) {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-4">إضافة صنف جديد سريع</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">اسم الصنف</label>
            <input
              type="text"
              value={data.name}
              onChange={(e) => onDataChange({ ...data, name: e.target.value })}
              required
              autoFocus
              className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">وحدة القياس</label>
            <select
              value={data.unit}
              onChange={(e) => onDataChange({ ...data, unit: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white focus:border-emerald-500 outline-none"
            >
              <option value="kg">كيلوجرام</option>
              <option value="piece">قطعة</option>
              <option value="meter">متر</option>
              <option value="box">علبة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">وزن القطعة (جرام)</label>
            <input
              type="number"
              value={data.weight_grams}
              onChange={(e) => onDataChange({ ...data, weight_grams: e.target.value })}
              min="0"
              step="0.01"
              className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white focus:border-emerald-500 outline-none"
              placeholder="مثال: 50"
            />
            <p className="text-xs text-[#ecfdf5]0 mt-1">يساعد في حساب عدد القطع عند الشراء بالكيلو</p>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#ecfdf5]0/20 hover:bg-[#ecfdf5]0/30 text-gray-200 rounded-lg transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
            >
              إضافة
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
