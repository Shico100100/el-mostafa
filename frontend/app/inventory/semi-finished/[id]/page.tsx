'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';

interface ProductInfo {
    id: number;
    name: string;
    cost_price: number;
    selling_price: number;
    stock_quantity: number;
    unit: string;
}

interface MoldInfo {
    id: number;
    name: string;
    product_weight: number;
    cavities: number;
    current_shots: number;
    max_shots: number;
    status: string;
    life_cycle_status: string;
}

interface BestMachine {
    id: number;
    name: string;
    power_consumption: number;
    runs: number;
    total_pieces: number;
}

interface CostBreakdown {
    rawMaterialPrice: number;
    pieceWeightGrams: number;
    rawCostPerPiece: number;
    nonElectricHourly: number;
    machinePowerKw: number;
    actualKwhRate: number;
    electricityHourly: number;
    machineHourly: number;
    hoursWorked: number;
    estimatedPieces: number;
    fixedPerPiece: number;
    totalPerPiece: number;
    avgTotalFixedCost: number;
    avgTotalElectricity: number;
    avgActiveDays: number;
    monthStr: string;
    monthDetails: { month: string; amount: number }[];
}

interface Details {
    product: ProductInfo;
    mold: MoldInfo | null;
    bestMachine: BestMachine | null;
    costBreakdown: CostBreakdown | null;
}

export default function SemiFinishedDetailPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [details, setDetails] = useState<Details | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const data = await api.fetchWithAuth(`/v1/manufacturing/semi-finished-products/${productId}/details`);
                setDetails(data);
            } catch (error) {
                console.error('Error loading details:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [productId]);

    if (loading) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white text-xl">جاري التحميل...</div>;

    if (!details) return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-white text-xl">المنتج غير موجود</div>;

    const { product, mold, bestMachine, costBreakdown } = details;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                        🏭 {product.name}
                    </h1>
                    <button
                        onClick={() => router.push('/inventory/semi-finished')}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
                    >
                        العودة
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Product Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            📦 معلومات المنتج
                        </h2>
                        <div className="space-y-3 text-gray-300">
                            <div className="flex justify-between">
                                <span>الاسم</span>
                                <span className="text-white font-bold">{product.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>الوحدة</span>
                                <span className="text-white">{product.unit}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>متوسط التكلفة</span>
                                <span className="text-green-400 font-bold">{Number(product.cost_price).toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span>سعر البيع</span>
                                <span className="text-blue-400 font-bold">{Number(product.selling_price).toFixed(2)} ج.م</span>
                            </div>
                            <div className="flex justify-between">
                                <span>المخزون الحالي</span>
                                <span className="text-amber-400 font-bold">{product.stock_quantity?.toLocaleString() || 0} قطعة</span>
                            </div>
                        </div>
                    </div>

                    {/* Mold Info */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            🎯 معلومات القالب (الإسطمبة)
                        </h2>
                        {mold ? (
                            <div className="space-y-3 text-gray-300">
                                <div className="flex justify-between">
                                    <span>اسم القالب</span>
                                    <span className="text-white font-bold">{mold.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>وزن القطعة</span>
                                    <span className="text-white font-bold">{mold.product_weight} جرام</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>عدد التجاويف (Cavities)</span>
                                    <span className="text-white font-bold">{mold.cavities}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>الحالة</span>
                                    <span className={`font-bold ${mold.status === 'GOOD' ? 'text-green-400' : 'text-red-400'}`}>
                                        {mold.status === 'GOOD' ? 'جيد' : mold.status === 'NEEDS_REPAIR' ? 'يحتاج صيانة' : mold.status === 'BROKEN' ? 'عطلان' : 'صيانة'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>دورة الحياة</span>
                                    <span className={`font-bold ${mold.life_cycle_status === 'good' ? 'text-green-400' : mold.life_cycle_status === 'warning' ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {mold.life_cycle_status === 'good' ? 'جيد' : mold.life_cycle_status === 'warning' ? 'تحذير' : 'خطير'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span>عدد الطلقات</span>
                                    <span className="text-white font-bold">{mold.current_shots?.toLocaleString() || 0} / {mold.max_shots?.toLocaleString() || '∞'}</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">لا يوجد قالب مرتبط</p>
                        )}
                    </div>

                    {/* Best Machine */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            ⚙️ أفضل ماكينة للتشغيل
                        </h2>
                        {bestMachine ? (
                            <div className="space-y-3 text-gray-300">
                                <div className="flex justify-between">
                                    <span>اسم الماكينة</span>
                                    <span className="text-white font-bold">{bestMachine.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>قدرة الماكينة</span>
                                    <span className="text-white font-bold">{bestMachine.power_consumption} kW</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>عدد مرات التشغيل</span>
                                    <span className="text-white font-bold">{bestMachine.runs} مرة</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>إجمالي القطع المنتجة</span>
                                    <span className="text-white font-bold">{bestMachine.total_pieces?.toLocaleString() || 0} قطعة</span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">لا توجد بيانات كافية</p>
                        )}
                    </div>

                    {/* Cost Breakdown */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 backdrop-blur-md lg:col-span-2">
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            💰 تحليل التكلفة
                        </h2>
                                {costBreakdown ? (
                                    <div className="space-y-6">
                                        {/* Months Info */}
                                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-gray-300">
                                            <p className="mb-1 text-blue-200 font-bold">📊 متوسط آخر {costBreakdown.monthDetails.length} أشهر (قبل {costBreakdown.monthStr}):</p>
                                            <div className="flex gap-4 flex-wrap">
                                                {costBreakdown.monthDetails.map((m) => (
                                                    <span key={m.month} className="bg-blue-500/20 px-2 py-1 rounded">
                                                        {m.month}: {m.amount.toFixed(0)} ج.م
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-2 border-t border-blue-500/20 pt-2">
                                                <span className="text-blue-200">متوسط التكاليف الثابتة:</span> {costBreakdown.avgTotalFixedCost.toFixed(0)} ج.م/شهر<br />
                                                <span className="text-blue-200">متوسط فاتورة الكهرباء:</span> {costBreakdown.avgTotalElectricity.toFixed(0)} ج.م/شهر<br />
                                                <span className="text-blue-200">متوسط أيام العمل:</span> {costBreakdown.avgActiveDays.toFixed(0)} يوم/شهر
                                            </div>
                                        </div>

                                {/* Raw Material Cost */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <h3 className="text-lg font-bold text-blue-300 mb-2">1. تكلفة الخام</h3>
                                    <div className="text-gray-300 text-sm space-y-1">
                                        <p>سعر المادة الخام: <span className="text-white font-bold">{costBreakdown.rawMaterialPrice.toFixed(2)} ج.م / كجم</span></p>
                                        <p>وزن القطعة: <span className="text-white font-bold">{costBreakdown.pieceWeightGrams} جرام</span></p>
                                        <div className="bg-black/20 rounded p-3 mt-2 font-mono text-sm text-green-300">
                                            تكلفة الخام = ({costBreakdown.rawMaterialPrice.toFixed(2)} ÷ 1000) × {costBreakdown.pieceWeightGrams}
                                            <br />
                                            = <span className="text-yellow-300 font-bold">{costBreakdown.rawCostPerPiece.toFixed(4)} ج.م / قطعة</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Fixed + Electricity Cost */}
                                <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                                    <h3 className="text-lg font-bold text-blue-300 mb-2">2. التكاليف الثابتة والكهرباء</h3>
                                    <div className="text-gray-300 text-sm space-y-1">
                                        <p>معدل ثابت (غير الكهرباء): <span className="text-white font-bold">{costBreakdown.nonElectricHourly.toFixed(4)} ج.م / ساعة</span></p>
                                        <p>قدرة الماكينة: <span className="text-white font-bold">{costBreakdown.machinePowerKw} kW</span></p>
                                        <p>سعر kWh الفعلي: <span className="text-white font-bold">{costBreakdown.actualKwhRate.toFixed(4)} ج.م</span></p>
                                        <p>تكلفة كهرباء الماكينة/ساعة: <span className="text-white font-bold">{costBreakdown.electricityHourly.toFixed(4)} ج.م</span></p>
                                        <p>تكلفة الساعة الكلية للماكينة: <span className="text-white font-bold">{costBreakdown.machineHourly.toFixed(4)} ج.م</span></p>
                                        <p>ساعات التشغيل: <span className="text-white font-bold">{costBreakdown.hoursWorked} ساعات</span></p>
                                        <p>القطع المقدرة: <span className="text-white font-bold">{costBreakdown.estimatedPieces?.toLocaleString() || 0} قطعة</span></p>

                                        <div className="bg-black/20 rounded p-3 mt-2 font-mono text-sm text-green-300">
                                            تكلفة ثابتة للقطعة = ({costBreakdown.machineHourly.toFixed(4)} × {costBreakdown.hoursWorked}) ÷ {costBreakdown.estimatedPieces}
                                            <br />
                                            = <span className="text-yellow-300 font-bold">{costBreakdown.fixedPerPiece.toFixed(4)} ج.م / قطعة</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                                    <h3 className="text-lg font-bold text-green-300 mb-2">3. إجمالي التكلفة التقديرية للقطعة</h3>
                                    <div className="bg-black/20 rounded p-3 font-mono text-sm">
                                        <span className="text-gray-400">التكلفة الكلية</span>
                                        <br />
                                        = {costBreakdown.rawCostPerPiece.toFixed(4)} (خام) + {costBreakdown.fixedPerPiece.toFixed(4)} (ثابت + كهرباء)
                                        <br />
                                        = <span className="text-yellow-300 font-bold text-lg">{costBreakdown.totalPerPiece.toFixed(4)} ج.م / قطعة</span>
                                    </div>
                                    <div className="mt-3 text-gray-400 text-xs">
                                        * ملاحظة: متوسط التكلفة الفعلي للمنتج ({Number(product.cost_price).toFixed(2)} ج.م) هو WAC (Weighted Average Cost) 
                                        عبر كل دفعات الإنتاج السابقة، وقد يختلف عن التقدير الحالي.
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-gray-500">لا توجد بيانات كافية لحساب التكلفة. تأكد من إدخال بيانات القالب والماكينة والتكاليف الثابتة.</p>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
