'use client';

import { X } from 'lucide-react';

interface AddEditCurrencyDialogProps {
  visible: boolean;
  isEdit: boolean;
  formCode: string;
  formName: string;
  formSymbol: string;
  formRate: string;
  onCodeChange: (v: string) => void;
  onNameChange: (v: string) => void;
  onSymbolChange: (v: string) => void;
  onRateChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function AddEditCurrencyDialog({ visible, isEdit, formCode, formName, formSymbol, formRate, onCodeChange, onNameChange, onSymbolChange, onRateChange, onSave, onClose }: AddEditCurrencyDialogProps) {
  if (!visible) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">{isEdit ? 'تعديل العملة' : 'عملة جديدة'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>الرمز (مثال: CNY)</label>
              <input className={inputClass} value={formCode} onChange={e => onCodeChange(e.target.value)} maxLength={3} required />
            </div>
            <div>
              <label className={labelClass}>الرمز ($, ¥, €)</label>
              <input className={inputClass} value={formSymbol} onChange={e => onSymbolChange(e.target.value)} />
            </div>
          </div>
          <div>
            <label className={labelClass}>الاسم</label>
            <input className={inputClass} value={formName} onChange={e => onNameChange(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>سعر الصرف مقابل EGP</label>
            <input className={inputClass} type="number" step="0.0001" value={formRate} onChange={e => onRateChange(e.target.value)} required />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
            <button type="submit" className={`px-4 py-2 rounded-lg border transition ${isEdit ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'}`}>
              {isEdit ? 'تحديث' : 'إضافة'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
