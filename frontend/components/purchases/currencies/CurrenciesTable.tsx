'use client';

import GlassPanel from '@/components/ui/GlassPanel';
import type { Currency } from '@/components/purchases/currencies/types';

interface CurrenciesTableProps {
  currencies: Currency[];
  onEdit: (c: Currency) => void;
  onDelete: (id: number) => void;
  onFxRate: (c: Currency) => void;
}

export function CurrenciesTable({ currencies, onEdit, onDelete, onFxRate }: CurrenciesTableProps) {
  return (
    <GlassPanel title="العملات">
      <table className="w-full">
        <thead>
          <tr className="border-b border-white/10 text-gray-400 text-sm">
            <th className="text-right px-6 py-4">الرمز</th>
            <th className="text-right px-6 py-4">الاسم</th>
            <th className="text-center px-6 py-4">سعر الصرف (→ EGP)</th>
            <th className="text-center px-6 py-4">الحالة</th>
            <th className="text-center px-6 py-4">الإجراءات</th>
          </tr>
        </thead>
        <tbody>
          {currencies.length === 0 ? (
            <tr><td colSpan={5} className="text-center py-12 text-gray-400">لا توجد عملات مضافة بعد</td></tr>
          ) : (
            currencies.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition">
                <td className="px-6 py-4">
                  <span className="text-white font-bold text-lg">{c.symbol || c.code}</span>
                  <span className="text-gray-400 mr-2">{c.code}</span>
                </td>
                <td className="px-6 py-4 text-gray-300">{c.name}</td>
                <td className="px-6 py-4 text-center text-gray-300">{Number(c.exchange_rate_to_egp).toFixed(4)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${c.is_active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {c.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2 justify-center">
                    <button onClick={() => onFxRate(c)} className="px-3 py-1.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-sm hover:bg-emerald-500/30 transition">سعر</button>
                    <button onClick={() => onEdit(c)} className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-sm hover:bg-blue-500/30 transition">تعديل</button>
                    <button onClick={() => onDelete(c.id)} className="px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm hover:bg-red-500/30 transition">حذف</button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </GlassPanel>
  );
}
