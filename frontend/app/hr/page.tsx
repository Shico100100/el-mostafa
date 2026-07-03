'use client';

import { useRouter } from 'next/navigation';
import { Users, DollarSign, ArrowLeft } from 'lucide-react';

const cards = [
  {
    href: '/hr/payroll',
    label: 'الرواتب',
    desc: 'إدارة كشوف الرواتب وحساب المستحقات والمكافآت والخصومات',
    icon: DollarSign,
    color: 'from-emerald-600 to-teal-600',
    shadow: 'shadow-emerald-500/30',
  },
  {
    href: '/hr/employees',
    label: 'الموظفين',
    desc: 'عرض ملفات الموظفين وبياناتهم الأساسية ورواتبهم',
    icon: Users,
    color: 'from-violet-600 to-purple-600',
    shadow: 'shadow-violet-500/30',
  },
];

export default function HRPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" dir="rtl">
      <header className="bg-slate-900/70 backdrop-blur-xl border-b border-white/5">
        <div className="container mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">الموارد البشرية</h1>
              <p className="text-xs text-slate-500">إدارة شؤون الموظفين والرواتب</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto">
          {cards.map((card) => (
            <button
              key={card.href}
              onClick={() => router.push(card.href)}
              className="group text-right bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white/5 p-6 hover:border-white/15 transition-all duration-300 hover:shadow-xl"
            >
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center shadow-lg ${card.shadow} mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-lg font-bold mb-2">{card.label}</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
