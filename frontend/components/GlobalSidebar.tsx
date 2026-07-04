'use client';

import { useState, useMemo, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePermission } from '@/lib/usePermission';
import { resolveRoles } from '@/lib/resolveRoles';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Factory,
  Calculator,
  Users,
  ShoppingBag,
  ArrowLeft,
  Menu,
  X,
  FileText,
  Bell,
  Settings,
  Shield,
  TrendingUp,
} from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  children?: { href: string; label: string }[];
}

const modules: NavItem[] = [
  { href: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  {
    href: '/sales', label: 'المبيعات', icon: ShoppingCart,
    children: [
      { href: '/sales/customers', label: 'العملاء' },
      { href: '/sales/orders', label: 'طلبات البيع' },
      { href: '/sales/quotes', label: 'عروض الأسعار' },
      { href: '/sales/returns', label: 'مرتجعات' },
    ],
  },
  {
    href: '/purchases', label: 'المشتريات', icon: ShoppingBag,
    children: [
      { href: '/purchases/suppliers', label: 'الموردين' },
      { href: '/purchases/orders', label: 'أوامر الشراء' },
      { href: '/purchases/returns', label: 'مرتجعات' },
      { href: '/purchases/currencies', label: 'العملات' },
      { href: '/purchases/containers', label: 'الحاويات' },
    ],
  },
  {
    href: '/inventory2', label: 'المخزون', icon: Package,
    children: [
      { href: '/inventory2', label: 'لوحة المخزون' },
      { href: '/inventory2/products', label: 'المنتجات' },
      { href: '/inventory2/semi-finished', label: 'البلاستيك' },
      { href: '/inventory2/stock', label: 'المخزون' },
      { href: '/inventory2/stock/movements', label: 'الحركات' },
      { href: '/inventory2/warehouses', label: 'المخازن' },
    ],
  },
  {
    href: '/manufacturing', label: 'التصنيع', icon: Factory,
    children: [
      { href: '/manufacturing', label: 'لوحة التصنيع' },
      { href: '/bom', label: 'BOM' },
      { href: '/manufacturing/machines', label: 'الماكينات' },
      { href: '/manufacturing/molds', label: 'القوالب' },
      { href: '/manufacturing/raw-materials', label: 'الخامات' },
      { href: '/manufacturing/daily-production', label: 'إنتاج يومي' },
      { href: '/manufacturing/planning', label: 'التخطيط' },
      { href: '/manufacturing/qc', label: 'الجودة' },
      { href: '/manufacturing/assembly', label: 'لوحة التجميع' },
      { href: '/assembly/accessories', label: 'الملحقات' },
      { href: '/assembly/production', label: 'إنتاج التجميع' },
      { href: '/assembly/attendance', label: 'الحضور' },
      { href: '/assembly/packaging', label: 'التغليف' },
      { href: '/assembly/plastic', label: 'بلاستيك' },
      { href: '/manufacturing/maintenance', label: 'الصيانة' },
      { href: '/manufacturing/mrp', label: 'MRP' },
      { href: '/manufacturing/feasibility', label: 'الجدوى' },
      { href: '/manufacturing/traceability', label: 'التتبع' },
      { href: '/manufacturing/fixed-costs', label: 'تكاليف ثابتة' },
    ],
  },
  {
    href: '/accounting', label: 'المحاسبة', icon: Calculator,
    children: [
      { href: '/accounting', label: 'الحسابات' },
      { href: '/accounting/journal', label: 'اليومية' },
    ],
  },
  {
    href: '/hr', label: 'الموارد البشرية', icon: Users,
    children: [
      { href: '/hr/payroll', label: 'الرواتب' },
      { href: '/hr/employees', label: 'الموظفين' },
    ],
  },
  {
    href: '/reports', label: 'التقارير', icon: TrendingUp,
    children: [
      { href: '/reports', label: 'التقارير الرئيسية' },
      { href: '/reports/production', label: 'تقرير الإنتاج' },
    ],
  },
  { href: '/notifications', label: 'الإشعارات', icon: Bell },
  { href: '/users', label: 'المستخدمين', icon: Shield },
  { href: '/settings', label: 'الإعدادات', icon: Settings },
  { href: '/audit', label: 'سجل التدقيق', icon: FileText },
];

export default function GlobalSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const { roleId } = usePermission();
  const allowedRoles = useMemo(() => resolveRoles(pathname), [pathname]);
  const hasAccess = allowedRoles.length === 0 || (roleId != null && allowedRoles.includes(roleId as number));

  useEffect(() => {
    if (!hasAccess && roleId != null) {
      router.replace('/dashboard');
    }
  }, [hasAccess, roleId, router]);

  const allowedModules = useMemo(() => {
    return modules.filter(mod => {
      const roles = resolveRoles(mod.href);
      const parentAccess = roles.length === 0 || (roleId != null && roles.includes(roleId as number));
      if (!parentAccess) return false;
      if (mod.children) {
        const visibleChildren = mod.children.filter(child => {
          const childRoles = resolveRoles(child.href);
          return childRoles.length === 0 || (roleId != null && childRoles.includes(roleId as number));
        });
        return visibleChildren.length > 0;
      }
      return true;
    });
  }, [roleId]);

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!hasAccess && roleId != null) return null;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname.startsWith(href);
  };

  const toggleSection = (href: string) => {
    setExpandedSection(expandedSection === href ? null : href);
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile hamburger */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-30 lg:hidden p-2.5 bg-slate-800 rounded-xl border border-white/10 text-slate-400 hover:text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen bg-slate-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 w-64 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
              <span className="text-sm font-black text-white">م</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">المصطفى</h1>
              <p className="text-[8px] text-slate-500 -mt-0.5">نظام إدارة متكامل</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {allowedModules.map((mod) => {
            const active = isActive(mod.href);
            const hasChildren = mod.children && mod.children.length > 0;
            const expanded = expandedSection === mod.href;

            return (
              <div key={mod.href}>
                <button
                  onClick={() => {
                    if (hasChildren) {
                      toggleSection(mod.href);
                    } else {
                      router.push(mod.href);
                      setOpen(false);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active && !expanded
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <mod.icon className="w-4 h-4 shrink-0" />
                  <span className="flex-1 text-right">{mod.label}</span>
                  {hasChildren && (
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>
                {hasChildren && expanded && (
                  <div className="mr-4 mt-0.5 space-y-0.5 border-r border-white/10 pr-2">
                    {mod.children!.filter(child => {
                      const roles = resolveRoles(child.href);
                      return roles.length === 0 || (roleId != null && roles.includes(roleId as number));
                    }).map((child) => {
                      const childActive = pathname === child.href || (child.href !== '/inventory2' && pathname.startsWith(child.href));
                      return (
                        <button
                          key={child.href}
                          onClick={() => { router.push(child.href); setOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                            childActive
                              ? 'bg-blue-600/10 text-blue-300 border border-blue-500/10'
                              : 'text-slate-500 hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${childActive ? 'bg-blue-400' : 'bg-slate-600'}`} />
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="p-2 border-t border-white/10">
          <button
            onClick={() => { router.push('/dashboard'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition border border-transparent"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>الرئيسية</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {children}
      </main>
    </div>
  );
}
