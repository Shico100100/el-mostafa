'use client';

import { useRouter } from 'next/navigation';
import {
  Package, Users, Receipt, ShoppingCart, Building2,
  DollarSign, BarChart3, Radar, User, ScrollText, Cog,
} from 'lucide-react';

interface Action {
  icon: React.ReactNode;
  label: string;
  href: string;
  color: string;
}

const actions: Action[] = [
  { icon: <Package className="w-5 h-5" />, label: 'المنتجات', href: '/inventory/products', color: 'from-emerald-500 to-cyan-500' },
  { icon: <Users className="w-5 h-5" />, label: 'العملاء', href: '/sales/customers', color: 'from-emerald-500 to-teal-500' },
  { icon: <Receipt className="w-5 h-5" />, label: 'أوامر البيع', href: '/sales/orders', color: 'from-emerald-500 to-green-500' },
  { icon: <ShoppingCart className="w-5 h-5" />, label: 'أوامر الشراء', href: '/purchases/orders', color: 'from-amber-500 to-orange-500' },
  { icon: <Building2 className="w-5 h-5" />, label: 'الإنتاج', href: '/manufacturing', color: 'from-rose-500 to-pink-500' },
  { icon: <DollarSign className="w-5 h-5" />, label: 'الحسابات', href: '/accounting', color: 'from-violet-500 to-teal-500' },
  { icon: <BarChart3 className="w-5 h-5" />, label: 'التقارير', href: '/reports', color: 'from-teal-500 to-emerald-500' },
  { icon: <Radar className="w-5 h-5" />, label: 'برج المراقبة', href: '/dashboard/control-tower', color: 'from-cyan-500 to-teal-500' },
];

const adminActions: Action[] = [
  { icon: <User className="w-5 h-5" />, label: 'المستخدمين', href: '/users', color: 'from-rose-500 to-red-500' },
  { icon: <ScrollText className="w-5 h-5" />, label: 'سجل العمليات', href: '/audit', color: 'from-slate-400 to-[#ecfdf5]0' },
  { icon: <Cog className="w-5 h-5" />, label: 'الإعدادات', href: '/settings', color: 'from-gray-400 to-[#ecfdf5]0' },
];

export function QuickActionsGrid({ isAdmin }: { isAdmin: boolean }) {
  const router = useRouter();
  const items = isAdmin ? [...actions, ...adminActions] : actions;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {items.map((action) => (
        <button
          key={action.href}
          onClick={() => router.push(action.href)}
          className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 transition-all duration-300"
        >
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300`}>
            {action.icon}
          </div>
          <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{action.label}</span>
        </button>
      ))}
    </div>
  );
}
