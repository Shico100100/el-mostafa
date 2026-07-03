'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, Truck, RotateCcw, Coins, PackageOpen, Container } from 'lucide-react';

const links = [
  { href: '/purchases/suppliers', label: 'الموردين', icon: Truck, desc: 'إدارة الموردين وأرصدة حساباتهم' },
  { href: '/purchases/orders', label: 'أوامر الشراء', icon: ShoppingBag, desc: 'إنشاء ومتابعة أوامر الشراء' },
  { href: '/purchases/returns', label: 'مرتجعات', icon: RotateCcw, desc: 'إدارة مرتجعات المشتريات' },
  { href: '/purchases/currencies', label: 'العملات', icon: Coins, desc: 'إدارة العملات وأسعار الصرف' },
  { href: '/purchases/containers', label: 'الحاويات', icon: Container, desc: 'إدارة الحاويات وحساب CBM' },
];

export default function PurchasesPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      <header className="bg-slate-900/70 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">المشتريات</h1>
              <p className="text-sm text-slate-400">إدارة المشتريات والموردين</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <button key={link.href} onClick={() => router.push(link.href)}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 text-right hover:border-white/20 hover:bg-slate-800/80 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-slate-700/50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-slate-700 transition">
                  <link.icon className="w-6 h-6 text-amber-400" />
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
