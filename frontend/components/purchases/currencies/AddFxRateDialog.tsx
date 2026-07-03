'use client';

import { X } from 'lucide-react';
import type { Currency } from '@/components/purchases/currencies/types';

interface AddFxRateDialogProps {
  visible: boolean;
  currency: Currency | null;
  fxRateValue: string;
  fxAmount: string;
  fxDate: string;
  fxNotes: string;
  weightedAvg: number | null;
  onRateChange: (v: string) => void;
  onAmountChange: (v: string) => void;
  onDateChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onCalcWeightedAvg: () => void;
  onSave: () => void;
  onClose: () => void;
}

const inputClass = "w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition";
const labelClass = "block text-sm font-medium text-gray-300 mb-1";

export function AddFxRateDialog({ visible, currency, fxRateValue, fxAmount, fxDate, fxNotes, weightedAvg, onRateChange, onAmountChange, onDateChange, onNotesChange, onCalcWeightedAvg, onSave, onClose }: AddFxRateDialogProps) {
  if (!visible || !currency) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">إضافة سعر صرف - {currency.code}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>سعر الصرف (1 {currency.code} = ? EGP)</label>
            <input className={inputClass} type="number" step="0.0001" value={fxRateValue} onChange={e => onRateChange(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>المبلغ المدفوع (EGP) - لحساب المتوسط المرجح</label>
            <input className={inputClass} type="number" step="0.01" value={fxAmount} onChange={e => onAmountChange(e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>التاريخ</label>
            <input className={inputClass} type="date" value={fxDate} onChange={e => onDateChange(e.target.value)} required />
          </div>
          <div>
            <label className={labelClass}>ملاحظات</label>
            <input className={inputClass} value={fxNotes} onChange={e => onNotesChange(e.target.value)} />
          </div>

          <button type="button" onClick={onCalcWeightedAvg}
            className="w-full px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/30 transition text-sm">
            حساب المتوسط المرجح
          </button>
          {weightedAvg !== null && (
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <span className="text-gray-400 text-sm">المتوسط المرجح: </span>
              <span className="text-white font-bold">{weightedAvg.toFixed(4)}</span>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
            <button type="submit" className="px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition">حفظ</button>
          </div>
        </form>
      </div>
    </div>
  );
}
