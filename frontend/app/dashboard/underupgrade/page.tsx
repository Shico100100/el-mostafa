'use client';

import { useRouter } from 'next/navigation';

export default function UnderUpgradePage() {
    const router = useRouter();
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🔗 روابط سريعة</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <p className="text-gray-400 mb-8">جميع الصفحات التالية أصبحت جاهزة الآن 🎉</p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div
                        onClick={() => router.push('/manufacturing/planning')}
                        className="bg-green-500/10 border border-green-500/30 backdrop-blur-lg p-6 rounded-2xl hover:bg-green-500/20 transition cursor-pointer group"
                    >
                        <div className="p-3 bg-green-500/20 rounded-xl group-hover:scale-110 transition duration-300 w-fit mb-4">
                            <span className="text-2xl">🗓️</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">تخطيط الإنتاج</h3>
                        <p className="text-gray-400 text-sm">جدولة الإنتاج على الماكينات ← اضغط للدخول</p>
                    </div>

                    <div
                        onClick={() => router.push('/manufacturing/bom')}
                        className="bg-teal-500/10 border border-teal-500/30 backdrop-blur-lg p-6 rounded-2xl hover:bg-teal-500/20 transition cursor-pointer group"
                    >
                        <div className="p-3 bg-teal-500/20 rounded-xl group-hover:scale-110 transition duration-300 w-fit mb-4">
                            <span className="text-2xl">📜</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">معادلات التصنيع (BOM)</h3>
                        <p className="text-gray-400 text-sm">تعريف مكونات المنتجات مع التفجير والـ PDF</p>
                    </div>

                    <div
                        onClick={() => router.push('/manufacturing/mrp')}
                        className="bg-cyan-500/10 border border-cyan-500/30 backdrop-blur-lg p-6 rounded-2xl hover:bg-cyan-500/20 transition cursor-pointer group"
                    >
                        <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:scale-110 transition duration-300 w-fit mb-4">
                            <span className="text-2xl">📊</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">تخطيط الاحتياجات (MRP)</h3>
                        <p className="text-gray-400 text-sm">تحليل المخزون مقابل جداول الإنتاج المعلقة</p>
                    </div>

                    <div
                        onClick={() => router.push('/manufacturing/qc')}
                        className="bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-lg p-6 rounded-2xl hover:bg-emerald-500/20 transition cursor-pointer group"
                    >
                        <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition duration-300 w-fit mb-4">
                            <span className="text-2xl">✅</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">مراقبة الجودة</h3>
                        <p className="text-gray-400 text-sm">نسبة التلف والمنتجات السليمة</p>
                    </div>

                    <div
                        onClick={() => router.push('/assembly')}
                        className="bg-orange-500/10 border border-orange-500/30 backdrop-blur-lg p-6 rounded-2xl hover:bg-orange-500/20 transition cursor-pointer group"
                    >
                        <div className="p-3 bg-orange-500/20 rounded-xl group-hover:scale-110 transition duration-300 w-fit mb-4">
                            <span className="text-2xl">⚙️</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">التجميع</h3>
                        <p className="text-gray-400 text-sm">الملحقات والبلاستيك والتعبئة والإنتاج</p>
                    </div>

                    <div
                        onClick={() => router.push('/assembly/bom')}
                        className="bg-purple-500/10 border border-purple-500/30 backdrop-blur-lg p-6 rounded-2xl hover:bg-purple-500/20 transition cursor-pointer group"
                    >
                        <div className="p-3 bg-purple-500/20 rounded-xl group-hover:scale-110 transition duration-300 w-fit mb-4">
                            <span className="text-2xl">📋</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">BOM التجميع</h3>
                        <p className="text-gray-400 text-sm">قوائم مكونات التجميع والمنتجات النهائية</p>
                    </div>
                </div>
            </main>
        </div>
    );
}
