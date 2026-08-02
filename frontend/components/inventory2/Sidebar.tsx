'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ClipboardList, ArrowRightLeft, ArrowLeft } from 'lucide-react';

const links = [
  { href: '/inventory2', label: 'لوحة التحكم', icon: LayoutDashboard },
  { href: '/inventory2/products', label: 'المنتجات', icon: Package },
  { href: '/inventory2/stock', label: 'المخزون', icon: ClipboardList },
  { href: '/inventory2/stock/movements', label: 'الحركات', icon: ArrowRightLeft },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="w-64 bg-slate-900/80 backdrop-blur-xl border-l border-white/10 min-h-screen flex flex-col shrink-0">
      <div className="p-6 border-b border-white/10">
        <h2 className="text-lg font-black text-white">المخزون v2</h2>
        <p className="text-xs text-slate-500 mt-1">نظام إدارة متطور</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== '/inventory2' && pathname.startsWith(link.href));
          return (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              <link.icon className="w-5 h-5 shrink-0" />
              {link.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => router.push('/dashboard')}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition border border-transparent"
        >
          <ArrowLeft className="w-5 h-5 shrink-0" />
          العودة للرئيسية
        </button>
      </div>
    </aside>
  );
}
