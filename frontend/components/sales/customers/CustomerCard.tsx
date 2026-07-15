'use client';

import { MoreVertical, FileText, Wallet, Pencil, Phone, Mail, MapPin } from 'lucide-react';
import { useState } from 'react';
import { Customer, OVERDUE_THRESHOLD } from './types';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onStatement: (customer: Customer) => void;
  onPayment: (customer: Customer) => void;
  onQuickView: (customer: Customer) => void;
}

export function CustomerCard({
  customer,
  onEdit,
  onStatement,
  onPayment,
  onQuickView,
}: CustomerCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  const getStatusColor = (balance: number) => {
    if (balance <= 0) return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400', label: 'أمين' };
    if (balance <= OVERDUE_THRESHOLD) return { text: 'text-amber-400', bg: 'bg-amber-500/10', dot: 'bg-amber-400', label: 'مدين' };
    return { text: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400', label: 'مدين متأخر' };
  };

  const status = getStatusColor(customer.balance);

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-white/20 group">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${status.dot}`} />
          <button
            onClick={() => onQuickView(customer)}
            className="text-white font-semibold text-lg hover:text-emerald-400 transition-colors cursor-pointer"
          >
            {customer.name}
          </button>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-white/40 hover:text-white transition-colors"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          {showMenu && (
            <div className="absolute left-0 top-8 bg-slate-800 border border-white/10 rounded-lg py-2 min-w-[150px] z-10">
              <button
                onClick={() => {
                  onEdit(customer);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                تعديل
              </button>
              <button
                onClick={() => {
                  onStatement(customer);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                كشف حساب
              </button>
              <button
                onClick={() => {
                  onPayment(customer);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-right text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Wallet className="w-4 h-4" />
                سند قبض
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-2 mb-4">
        {customer.phone && (
          <div className="flex items-center gap-2 text-white/60">
            <Phone className="w-4 h-4" />
            <span className="text-sm">{customer.phone}</span>
          </div>
        )}
        {customer.email && (
          <div className="flex items-center gap-2 text-white/60">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{customer.email}</span>
          </div>
        )}
        {customer.address && (
          <div className="flex items-center gap-2 text-white/60">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{customer.address}</span>
          </div>
        )}
      </div>

      {/* Balance */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-white/60 text-sm">الرصيد</span>
          <span className={`font-bold text-lg ${status.text}`}>
            {customer.balance.toLocaleString('ar-EG')} ج.م
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-white/60 text-sm">الحالة</span>
          <span className={`px-2 py-1 rounded-full text-xs ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-white/10 pt-4 mt-4">
        <div className="flex gap-2">
          <button
            onClick={() => onStatement(customer)}
            className="flex-1 bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4" />
            كشف حساب
          </button>
          <button
            onClick={() => onPayment(customer)}
            className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Wallet className="w-4 h-4" />
            سند قبض
          </button>
          <button
            onClick={() => onEdit(customer)}
            className="bg-white/10 hover:bg-white/20 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
