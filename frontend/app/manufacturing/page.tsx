'use client';

import { useRouter } from 'next/navigation';
import { useManufacturingDashboard } from '@/hooks/manufacturing/useManufacturingDashboard';
import { ManufacturingHeader } from '@/components/manufacturing/dashboard/ManufacturingHeader';
import { NavCard, NavButton } from '@/components/manufacturing/dashboard/NavCard';
import { SummarySection } from '@/components/manufacturing/dashboard/SummarySection';
import { AlertSection } from '@/components/manufacturing/dashboard/AlertSection';
import { BarChart3, Box, DollarSign, FileText, Search, Wrench, Factory, Settings, Link } from 'lucide-react';

export default function ManufacturingDashboard() {
  const router = useRouter();
  const { stats, loading } = useManufacturingDashboard();

  const navCards = [
    { icon: <BarChart3 />, title: 'الإنتاج اليومي', description: 'تسجيل إنتاج الماكينات اليومي', onClick: () => router.push('/manufacturing/daily-production') },
    { icon: <Box />, title: 'المواد الخام', description: 'إدارة مخزون المواد الخام', onClick: () => router.push('/manufacturing/raw-materials') },
    { icon: <DollarSign />, title: 'التكاليف الثابتة', description: 'إيجار، كهرباء، ومصروفات أخرى', onClick: () => router.push('/manufacturing/fixed-costs') },
  ];

  const gradientCards = [
    { icon: <FileText />, title: 'قائمة المكونات BOM', description: 'تفجير المكونات وحساب الأوزان والتكاليف', gradient: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10', borderClass: 'border-emerald-500/20', onClick: () => router.push('/bom') },
    { icon: <Search />, title: 'تحليل جدوى الإنتاج', description: 'فحص إمكانية الإنتاج، المكونات الناقصة، واقتراح الماكينات', gradient: 'bg-gradient-to-br from-cyan-500/10 to-blue-500/10', borderClass: 'border-cyan-500/20', onClick: () => router.push('/manufacturing/feasibility') },
    { icon: <Wrench />, title: 'إدارة الصيانة', description: 'متابعة ومواعيد صيانة الماكينات', gradient: 'bg-gradient-to-br from-red-500/10 to-amber-500/10', badge: 'عاجل', onClick: () => router.push('/manufacturing/maintenance') },
  ];

  const navButtons = [
    { icon: <Factory />, title: 'إدارة الماكينات', description: 'إضافة الماكينات، متابعة الحالة، وسجلات الصيانة', gradient: 'bg-gradient-to-br from-blue-500/20 to-blue-600/20', borderClass: 'border-blue-500/30', onClick: () => router.push('/manufacturing/machines') },
    { icon: <Settings />, title: 'إدارة الإسطمبات', description: 'إدارة الإسطمبات، أوزان المنتجات، وعدد العيون', gradient: 'bg-gradient-to-br from-purple-500/20 to-purple-600/20', borderClass: 'border-purple-500/30', onClick: () => router.push('/manufacturing/molds') },
    { icon: <Link />, title: 'تتبع الإنتاج', description: 'تتبع الدفعات، التواريخ، وسلاسل الإمداد', gradient: 'bg-gradient-to-br from-cyan-500/20 to-teal-500/20', borderClass: 'border-cyan-500/30', onClick: () => router.push('/manufacturing/traceability') },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <ManufacturingHeader onBack={() => router.push('/dashboard')} />
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {navCards.map(c => <NavCard key={c.title} {...c} />)}
          {gradientCards.map(c => <NavCard key={c.title} {...c} gradient={c.gradient} badge={(c as any).badge} />)}
          {navButtons.map(c => <NavButton key={c.title} {...c} />)}
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <SummarySection stats={stats} loading={loading} />
          <AlertSection hasActiveMachines={stats.activeMachines > 0} />
        </div>
      </main>
    </div>
  );
}
