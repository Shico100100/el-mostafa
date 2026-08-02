'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart, Users, RotateCcw } from 'lucide-react';

const links = [
  { href: '/sales/customers', label: 'العملاء', icon: Users, desc: 'إدارة العملاء وأرصدة حساباتهم' },
  { href: '/sales/orders', label: 'طلبات البيع', icon: ShoppingCart, desc: 'إنشاء ومتابعة أوامر البيع' },
  { href: '/sales/returns', label: 'مرتجعات', icon: RotateCcw, desc: 'إدارة مرتجعات المبيعات' },
];

export default function SalesPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      <header className="bg-slate-900/70 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">المبيعات</h1>
              <p className="text-sm text-slate-400">إدارة المبيعات والعملاء</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {links.map((link) => (
            <button key={link.href} onClick={() => router.push(link.href)}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 text-right hover:border-white/20 hover:bg-slate-800/80 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition">
                  <link.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{link.label}</h3>
                  <p className="text-sm text-slate-400">{link.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
