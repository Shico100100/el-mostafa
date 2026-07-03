'use client';

interface Props {
  show: boolean;
  month: string;
  category: string;
  amount: string;
  notes: string;
  onFormChange: (d: { month: string; category: string; amount: string; notes: string }) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

const categoryOptions = [
  { value: 'ELECTRICITY', label: 'كهرباء' },
  { value: 'WATER', label: 'مياه' },
  { value: 'WAGES', label: 'أجور' },
  { value: 'PRODUCTION_WAGES', label: 'أجور إنتاج' },
  { value: 'ASSEMBLY_WAGES', label: 'أجور تجميع' },
  { value: 'RENT', label: 'إيجار' },
  { value: 'MAINTENANCE', label: 'صيانة' },
  { value: 'TRANSPORT', label: 'نقل' },
  { value: 'MISCELLANEOUS', label: 'مصروفات نثرية' },
  { value: 'OTHER', label: 'أخرى' },
].sort((a, b) => a.label.localeCompare(b.label, 'ar'));

export function AddCostDialog({ show, month, category, amount, notes, onFormChange, onSubmit, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-6">إضافة مصروف جديد</h2>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">الشهر</label>
            <input type="month" required value={month}
              onChange={(e) => onFormChange({ month: e.target.value, category, amount, notes })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">البند</label>
            <select required value={category}
              onChange={(e) => onFormChange({ month, category: e.target.value, amount, notes })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500">
              {categoryOptions.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">القيمة (ج.م)</label>
            <input type="number" step="0.01" required value={amount}
              onChange={(e) => onFormChange({ month, category, amount: e.target.value, notes })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              placeholder="0.00" />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">ملاحظات</label>
            <textarea value={notes}
              onChange={(e) => onFormChange({ month, category, amount, notes: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
              placeholder="تفاصيل إضافية..." />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-bold transition">حفظ</button>
            <button type="button" onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-gray-300 py-3 rounded-lg font-bold transition">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
}
