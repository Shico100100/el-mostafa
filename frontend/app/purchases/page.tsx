'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, Truck, RotateCcw } from 'lucide-react';

const links = [
  { href: '/purchases/suppliers', label: 'الموردين', icon: Truck, desc: 'إدارة الموردين وأرصدة حساباتهم' },
  { href: '/purchases/orders', label: 'أوامر الشراء', icon: ShoppingBag, desc: 'إنشاء ومتابعة أوامر الشراء' },
  { href: '/purchases/returns', label: 'مرتجعات', icon: RotateCcw, desc: 'إدارة مرتجعات المشتريات' },
];

export default function PurchasesPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d] text-white" dir="rtl">
      <header className="bg-[#0a0f0d]/70 backdrop-blur-xl border-b border-[#1f2d26]">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-700 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">المشتريات</h1>
              <p className="text-sm text-[#6b8378]">إدارة المشتريات والموردين</p>
            </div>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-6 py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {links.map((link) => (
            <button key={link.href} onClick={() => router.push(link.href)}
              className="bg-[#0f1714]/50 backdrop-blur-sm rounded-2xl border border-[#1f2d26] p-6 text-right hover:border-white/20 hover:bg-[#0f1714]/80 transition-all group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#16241d]/50 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-[#16241d] transition">
                  <link.icon className="w-6 h-6 text-amber-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold mb-1">{link.label}</h3>
                  <p className="text-sm text-[#6b8378]">{link.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
