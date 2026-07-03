'use client';

import { useRouter } from 'next/navigation';
import { Package, Box, BarChart3, Wrench, Users, Receipt, ClipboardList, Factory, ShoppingCart, Building2, Cog, DollarSign, Banknote, TrendingUp, Radar, Bot, User, ScrollText } from 'lucide-react';

interface ActionItem {
  icon: React.ReactNode;
  label: string;
  desc: string;
  onClick: (router: ReturnType<typeof useRouter>) => void;
}

interface ActionGroup {
  title: string;
  color: string;
  items: ActionItem[];
}

const actionGroups: ActionGroup[] = [
  {
    title: 'المخزون', color: 'border-blue-500/20',
    items: [
      { icon: <Package />, label: 'المنتجات', desc: 'إدارة المخزون', onClick: (r) => r.push('/inventory2/products') },
      { icon: <Box />, label: 'مخزن البلاستيك', desc: 'منتجات نصف مصنعة', onClick: (r) => r.push('/inventory2/semi-finished') },
      { icon: <BarChart3 />, label: 'لوحة المخزون', desc: 'نظرة شاملة', onClick: (r) => r.push('/inventory2') },
      { icon: <Wrench />, label: 'الصيانة', desc: 'صيانة الماكينات', onClick: (r) => r.push('/manufacturing/maintenance') },
    ],
  },
  {
    title: 'المبيعات', color: 'border-emerald-500/20',
    items: [
      { icon: <Users />, label: 'العملاء', desc: 'الديون والفواتير', onClick: (r) => r.push('/sales/customers') },
      { icon: <Receipt />, label: 'أوامر البيع', desc: 'تسجيل فواتير', onClick: (r) => r.push('/sales/orders') },
      { icon: <ClipboardList />, label: 'عروض الأسعار', desc: 'إنشاء وتحويل', onClick: (r) => r.push('/sales/quotes') },
    ],
  },
  {
    title: 'المشتريات والإنتاج', color: 'border-amber-500/20',
    items: [
      { icon: <Factory />, label: 'الموردين', desc: 'المشتريات', onClick: (r) => r.push('/purchases/suppliers') },
      { icon: <ShoppingCart />, label: 'أوامر الشراء', desc: 'فواتير الشراء', onClick: (r) => r.push('/purchases/orders') },
      { icon: <Building2 />, label: 'الإنتاج', desc: 'أوامر التصنيع', onClick: (r) => r.push('/manufacturing') },
      { icon: <Cog />, label: 'التجميع', desc: 'أقسام التجميع', onClick: (r) => r.push('/assembly') },
    ],
  },
  {
    title: 'المالية والإدارة', color: 'border-purple-500/20',
    items: [
      { icon: <DollarSign />, label: 'الحسابات', desc: 'القيود والتقارير', onClick: (r) => r.push('/accounting') },
      { icon: <Banknote />, label: 'الرواتب', desc: 'مسير الرواتب', onClick: (r) => r.push('/hr/payroll') },
      { icon: <BarChart3 />, label: 'التقارير', desc: 'تحليلات الأداء', onClick: (r) => r.push('/reports') },
    ],
  },
  {
    title: 'أدوات', color: 'border-cyan-500/20',
    items: [
      { icon: <Radar />, label: 'برج المراقبة', desc: 'تحليلات متقدمة', onClick: (r) => r.push('/dashboard/control-tower') },
      { icon: <Bot />, label: 'المساعد الذكي', desc: 'محادثة مع مساعد المصنع', onClick: () => { const e = new CustomEvent('toggle-chatbot'); window.dispatchEvent(e); } },
    ],
  },
  {
    title: 'المشرف', color: 'border-rose-500/20',
    items: [
      { icon: <User />, label: 'المستخدمين', desc: 'إدارة الصلاحيات', onClick: (r) => r.push('/users') },
      { icon: <ScrollText />, label: 'سجل العمليات', desc: 'متابعة التحركات', onClick: (r) => r.push('/audit') },
      { icon: <Cog />, label: 'الإعدادات', desc: 'ضبط النظام', onClick: (r) => r.push('/settings') },
    ],
  },
];

export function QuickActions({ router, isAdmin }: { router: ReturnType<typeof useRouter>; isAdmin: boolean }) {
  const groups = isAdmin ? actionGroups : actionGroups.filter((g) => g.title !== 'المشرف');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {groups.map((group) => (
        <div key={group.title} className={`group/card bg-slate-800/20 backdrop-blur-xl rounded-2xl border ${group.color} p-4 hover:bg-slate-800/40 transition-all duration-300`}>
          <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">{group.title}</h4>
          <div className="grid grid-cols-2 gap-2">
            {group.items.map((a) => (
              <button key={a.label} onClick={() => a.onClick(router)}
                className="group/btn flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10 text-right">
                <span className="shrink-0 group-hover/btn:scale-110 group-hover/btn:rotate-6 transition-all duration-200">{a.icon}</span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover/btn:text-blue-300 transition-colors truncate">{a.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{a.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
