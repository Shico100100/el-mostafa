'use client';

import { Phone, Mail, MapPin } from 'lucide-react';
import type { Supplier } from '@/components/purchases/suppliers/types';

interface SupplierCardProps {
  supplier: Supplier;
  onEdit: (s: Supplier) => void;
  onStatement: (s: Supplier) => void;
  onPayment: (s: Supplier) => void;
}

export function SupplierCard({ supplier, onEdit, onStatement, onPayment }: SupplierCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-2">{supplier.name}</h3>
      <p className="text-gray-300 mb-1 flex items-center gap-1"><Phone className="w-4 h-4" /> {supplier.phone || '-'}</p>
      <p className="text-gray-300 mb-1 flex items-center gap-1"><Mail className="w-4 h-4" /> {supplier.email || '-'}</p>
      <p className="text-gray-300 mb-3 flex items-center gap-1"><MapPin className="w-4 h-4" /> {supplier.address || '-'}</p>
      <p className="text-purple-400 font-semibold mb-4">الرصيد: {supplier.balance} جنيه</p>
      <div className="flex gap-2">
        <button onClick={() => onEdit(supplier)}
          className="flex-1 px-3 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-purple-200 rounded">تعديل</button>
        <button onClick={() => onStatement(supplier)}
          className="flex-1 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-blue-200 rounded">كشف حساب</button>
        <button onClick={() => onPayment(supplier)}
          className="flex-1 px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded">دفع</button>
      </div>
    </div>
  );
}
