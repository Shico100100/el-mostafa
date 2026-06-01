'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useSetBackButton } from '@/components/BackButton';
import GlassPanel from '@/components/ui/GlassPanel';

interface QuickActionProps {
    icon: string;
    label: string;
    desc: string;
    href: string;
    color: string;
}

function QuickAction({ icon, label, desc, href, color }: QuickActionProps) {
    const router = useRouter();
    return (
        <button
            onClick={() => router.push(href)}
            className={`relative overflow-hidden group rounded-2xl border border-white/10 bg-white/5 p-6 text-right transition hover:scale-[1.02] hover:shadow-xl hover:shadow-${color}-500/10`}
        >
            <div className={`absolute top-0 left-0 w-1 h-full bg-${color}-500 rounded-r`} />
            <div className="flex items-start gap-4">
                <span className="text-4xl">{icon}</span>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">{label}</h3>
                    <p className="text-sm text-gray-400">{desc}</p>
                </div>
                <span className="text-gray-500 group-hover:translate-x-1 transition-transform">←</span>
            </div>
        </button>
    );
}

export default function AssemblyPage() {
    useSetBackButton('/dashboard');
    const [stats, setStats] = useState({ accessories: 0, attendance: 0, production: 0 });

    useEffect(() => {
        Promise.all([
            api.getAccessories().catch(() => []),
            api.getAttendance().catch(() => []),
        ]).then(([accessories, attendance]) => {
            setStats({
                accessories: accessories?.length || 0,
                attendance: attendance?.length || 0,
                production: 0,
            });
        });
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🧩 قسم التجميع</h1>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                        <div className="text-purple-300 text-sm">الملحقات</div>
                        <div className="text-3xl font-bold text-white">{stats.accessories}</div>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <div className="text-blue-300 text-sm">الحضور</div>
                        <div className="text-3xl font-bold text-white">{stats.attendance}</div>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
                        <div className="text-amber-300 text-sm">الإنتاج</div>
                        <div className="text-3xl font-bold text-white">{stats.production}</div>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                        <div className="text-green-300 text-sm">الأقسام</div>
                        <div className="text-3xl font-bold text-white">5</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <GlassPanel title="الأقسام">
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <QuickAction icon="🔧" label="الملحقات" desc="إدارة الملحقات والمكونات الصغيرة" href="/assembly/accessories" color="purple" />
                        <QuickAction icon="🪣" label="بلاستيك" desc="المنتجات البلاستيكية" href="/assembly/plastic" color="blue" />
                        <QuickAction icon="📦" label="علب وكراتين وأكياس" desc="التعبئة والتغليف" href="/assembly/packaging" color="amber" />
                        <QuickAction icon="🏭" label="الإنتاج" desc="تسجيل الإنتاج في التجميع" href="/assembly/production" color="green" />
                        <QuickAction icon="📋" label="BOM التجميع" desc="قائمة مكونات التجميع" href="/assembly/bom" color="cyan" />
                        <QuickAction icon="✅" label="الحضور والانصراف" desc="تسجيل حضور عمال التجميع" href="/assembly/attendance" color="rose" />
                    </div>
                </GlassPanel>
            </main>
        </div>
    );
}
