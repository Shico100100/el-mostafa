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
      { href: '/sales/returns', label: 'مرتجعات' },
    ],
  },
  {
    href: '/purchases', label: 'المشتريات', icon: ShoppingBag,
    children: [
      { href: '/purchases/suppliers', label: 'الموردين' },
      { href: '/purchases/orders', label: 'أوامر الشراء' },
      { href: '/purchases/returns', label: 'مرتجعات' },
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
      { href: '/bom', label: 'BOM (قوائم المكونات)' },
      { href: '/manufacturing/machines', label: 'الماكينات' },
      { href: '/manufacturing/molds', label: 'القوالب' },
      { href: '/manufacturing/raw-materials', label: 'الخامات' },
      { href: '/manufacturing/daily-production', label: 'إنتاج يومي' },
      { href: '/manufacturing/manufacturing-orders', label: 'أوامر إنتاج' },
      { href: '/manufacturing/maintenance', label: 'الصيانة' },
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
    <div className="flex min-h-screen bg-[#0a0f0d]">
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
        className="fixed top-4 right-4 z-30 lg:hidden p-2.5 bg-[#121a16] rounded-lg border border-[#1f2d26] text-[#6b8378] hover:text-white shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 z-50 h-screen bg-[#0f1714]/95 backdrop-blur-xl border-l border-[#1f2d26] flex flex-col shrink-0 transition-transform duration-300 lg:translate-x-0 w-64 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#1f2d26]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <span className="text-sm font-black text-[#04130d]">م</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">المصطفى</h1>
              <p className="text-[8px] text-[#6b8378] -mt-0.5">نظام إدارة متكامل</p>
            </div>
          </div>
          <button onClick={() => setOpen(false)} className="lg:hidden p-1.5 text-[#6b8378] hover:text-white rounded-lg hover:bg-white/5 transition">
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
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    active && !expanded
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/20'
                      : 'text-[#6b8378] hover:text-white hover:bg-white/5 border border-transparent'
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
                  <div className="mr-4 mt-0.5 space-y-0.5 border-r border-[#1f2d26] pr-2">
                    {mod.children!.filter(child => {
                      const roles = resolveRoles(child.href);
                      return roles.length === 0 || (roleId != null && roles.includes(roleId as number));
                    }).map((child) => {
                      const childActive = pathname === child.href || (child.href !== '/inventory2' && pathname.startsWith(child.href));
                      return (
                        <button
                          key={child.href}
                          onClick={() => { router.push(child.href); setOpen(false); }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${
                            childActive
                              ? 'bg-emerald-600/10 text-emerald-300 border border-emerald-500/10'
                              : 'text-[#6b8378] hover:text-white hover:bg-white/5 border border-transparent'
                          }`}
                        >
                          <div className={`w-1 h-1 rounded-full ${childActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
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
        <div className="p-2 border-t border-[#1f2d26]">
          <button
            onClick={() => { router.push('/dashboard'); setOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#6b8378] hover:text-white hover:bg-white/5 transition border border-transparent"
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
