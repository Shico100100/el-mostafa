'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Factory, Package, Target, Cpu, DollarSign, ArrowLeft } from 'lucide-react';
import InfoCard, { DetailRow } from '@/components/inventory/InfoCard';

interface ProductInfo {
  id: number; name: string; cost_price: number; selling_price: number;
  stock_quantity: number; unit: string;
}

interface MoldInfo {
  id: number; name: string; price: number; product_weight: number;
  cavities: number; current_shots: number; max_shots: number;
  status: string; life_cycle_status: string;
}

interface BestMachine {
  id: number; name: string; price: number; useful_life_years: number;
  power_consumption: number; runs: number; total_pieces: number;
}

interface CostBreakdown {
  rawMaterialPrice: number; pieceWeightGrams: number; rawCostPerPiece: number;
  nonElectricHourly: number; machinePowerKw: number;
  electricityPerMachineHour: number; electricityHourly: number;
  machineDepreciationHourly: number; machineHourly: number;
  hoursWorked: number; estimatedPieces: number; fixedPerPiece: number;
  moldAmortizationPerPiece: number; totalPerPiece: number;
  avgTotalFixedCost: number; avgTotalElectricity: number; avgActiveDays: number;
  monthStr: string; monthDetails: { month: string; amount: number }[];
}

interface Details {
  product: ProductInfo; mold: MoldInfo | null;
  bestMachine: BestMachine | null; costBreakdown: CostBreakdown | null;
}

function MoldStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    GOOD: 'text-emerald-400',
    NEEDS_REPAIR: 'text-amber-400',
    BROKEN: 'text-red-400',
    MAINTENANCE: 'text-yellow-400',
  };
  const labels: Record<string, string> = {
    GOOD: 'جيد', NEEDS_REPAIR: 'يحتاج صيانة', BROKEN: 'عطلان', MAINTENANCE: 'صيانة',
  };
  return <span className={`font-bold ${colors[status] || 'text-slate-400'}`}>{labels[status] || status}</span>;
}

function LifeCycleBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    good: 'text-emerald-400', warning: 'text-yellow-400', danger: 'text-red-400',
  };
  const labels: Record<string, string> = { good: 'جيد', warning: 'تحذير', danger: 'خطير' };
  return <span className={`font-bold ${colors[status] || 'text-slate-400'}`}>{labels[status] || status}</span>;
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
        const data = await api.fetchWithAuth<Details>(`/v1/manufacturing/semi-finished-products/${productId}/details`);
        setDetails(data);
      } catch {
        toast.error('فشل تحميل التفاصيل');
      } finally { setLoading(false); }
    };
    fetchDetails();
  }, [productId]);

  if (loading) return <div className="flex items-center justify-center min-h-[50vh] text-white text-xl">جاري التحميل...</div>;
  if (!details) return <div className="flex items-center justify-center min-h-[50vh] text-white text-xl">المنتج غير موجود</div>;

  const { product, mold, bestMachine, costBreakdown } = details;

  return (
    <>
      <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/inventory/semi-finished')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <Factory className="w-7 h-7 text-amber-400" />
            <h1 className="text-2xl font-black text-white">{product.name}</h1>
          </div>
        </div>
      </header>

      <main className="px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <InfoCard title="معلومات المنتج" icon={<Package className="w-5 h-5 text-blue-400" />}>
            <DetailRow label="الاسم" value={product.name} />
            <DetailRow label="الوحدة" value={product.unit} />
            <DetailRow label="متوسط التكلفة" value={`${Number(product.cost_price || 0).toFixed(2)} ج.م`} valueClass="text-green-400" />
            <DetailRow label="سعر البيع" value={`${Number(product.selling_price || 0).toFixed(2)} ج.م`} valueClass="text-blue-400" />
            <DetailRow label="المخزون الحالي" value={`${product.stock_quantity?.toLocaleString() || 0} ${product.unit || 'قطعة'}`} valueClass="text-amber-400" />
          </InfoCard>

          <InfoCard title="معلومات القالب (الإسطمبة)" icon={<Target className="w-5 h-5 text-purple-400" />}>
            {mold ? (
              <>
                <DetailRow label="اسم القالب" value={mold.name} />
                <DetailRow label="وزن القطعة" value={`${mold.product_weight} جرام`} />
                <DetailRow label="عدد التجاويف" value={String(mold.cavities)} />
                <DetailRow label="الحالة" value={<MoldStatusBadge status={mold.status} />} />
                <DetailRow label="دورة الحياة" value={<LifeCycleBadge status={mold.life_cycle_status} />} />
                <DetailRow label="عدد الطلقات" value={`${mold.current_shots?.toLocaleString() || 0} / ${mold.max_shots?.toLocaleString() || '∞'}`} />
              </>
            ) : (
              <p className="text-[#ecfdf5]0">لا يوجد قالب مرتبط</p>
            )}
          </InfoCard>

          <InfoCard title="أفضل ماكينة للتشغيل" icon={<Cpu className="w-5 h-5 text-cyan-400" />}>
            {bestMachine ? (
              <>
                <DetailRow label="اسم الماكينة" value={bestMachine.name} />
                <DetailRow label="قدرة الماكينة" value={`${bestMachine.power_consumption} kW`} />
                <DetailRow label="عدد مرات التشغيل" value={`${bestMachine.runs} مرة`} />
                <DetailRow label="إجمالي القطع المنتجة" value={`${bestMachine.total_pieces?.toLocaleString() || 0} قطعة`} />
              </>
            ) : (
              <p className="text-[#ecfdf5]0">لا توجد بيانات كافية</p>
            )}
          </InfoCard>

          {costBreakdown && (
            <div className="lg:col-span-2">
              <InfoCard title="تحليل التكلفة" icon={<DollarSign className="w-5 h-5 text-emerald-400" />}>
                <div className="space-y-6">
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-blue-200 font-bold mb-2">متوسط آخر {costBreakdown.monthDetails.length} أشهر (قبل {costBreakdown.monthStr}):</p>
                    <div className="flex gap-2 flex-wrap mb-2">
                      {costBreakdown.monthDetails.map((m) => (
                        <span key={m.month} className="bg-emerald-500/20 px-2.5 py-1 rounded-lg text-sm text-slate-300">{m.month}: {m.amount.toFixed(0)} ج.م</span>
                      ))}
                    </div>
                    <div className="text-sm text-slate-400 space-y-0.5">
                      <p>متوسط التكاليف الثابتة: <span className="text-white">{costBreakdown.avgTotalFixedCost.toFixed(0)} ج.م/شهر</span></p>
                      <p>متوسط فاتورة الكهرباء: <span className="text-white">{costBreakdown.avgTotalElectricity.toFixed(0)} ج.م/شهر</span></p>
                      <p>متوسط أيام العمل: <span className="text-white">{costBreakdown.avgActiveDays.toFixed(0)} يوم/شهر</span></p>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-lg font-bold text-blue-300 mb-3">1. تكلفة الخام</h3>
                    <div className="text-slate-300 text-sm space-y-1">
                      <p>سعر المادة الخام: <span className="text-white font-bold">{costBreakdown.rawMaterialPrice.toFixed(2)} ج.م / كجم</span></p>
                      <p>وزن القطعة: <span className="text-white font-bold">{costBreakdown.pieceWeightGrams} جرام</span></p>
                      <div className="bg-black/20 rounded-lg p-3 mt-2 font-mono text-sm text-emerald-300">
                        تكلفة الخام = ({costBreakdown.rawMaterialPrice.toFixed(2)} ÷ 1000) × {costBreakdown.pieceWeightGrams}
                        <br />
                        = <span className="text-yellow-300 font-bold">{costBreakdown.rawCostPerPiece.toFixed(4)} ج.م / قطعة</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <h3 className="text-lg font-bold text-blue-300 mb-3">2. التكاليف الثابتة والكهرباء والإهلاك</h3>
                    <div className="text-slate-300 text-sm space-y-1">
                      <p>معدل ثابت (غير الكهرباء): <span className="text-white font-bold">{costBreakdown.nonElectricHourly.toFixed(4)} ج.م / ساعة</span></p>
                      <p>قدرة الماكينة: <span className="text-white font-bold">{costBreakdown.machinePowerKw} kW</span></p>
                      <p>تكلفة كهرباء/ساعة تشغيل: <span className="text-white font-bold">{costBreakdown.electricityHourly.toFixed(4)} ج.م</span></p>
                      {costBreakdown.machineDepreciationHourly > 0 && (
                        <p>إهلاك الماكينة/ساعة: <span className="text-white font-bold">{costBreakdown.machineDepreciationHourly.toFixed(4)} ج.م</span></p>
                      )}
                      <p>تكلفة الساعة الكلية للماكينة: <span className="text-white font-bold">{costBreakdown.machineHourly.toFixed(4)} ج.م</span></p>
                      <p>ساعات التشغيل: <span className="text-white font-bold">{costBreakdown.hoursWorked} ساعات</span></p>
                      <p>القطع المقدرة: <span className="text-white font-bold">{costBreakdown.estimatedPieces?.toLocaleString() || 0} قطعة</span></p>
                      <div className="bg-black/20 rounded-lg p-3 mt-2 font-mono text-sm text-emerald-300">
                        تكلفة ثابتة للقطعة = ({costBreakdown.machineHourly.toFixed(4)} × {costBreakdown.hoursWorked}) ÷ {costBreakdown.estimatedPieces}
                        <br />
                        = <span className="text-yellow-300 font-bold">{costBreakdown.fixedPerPiece.toFixed(4)} ج.م / قطعة</span>
                      </div>
                    </div>
                  </div>

                  {costBreakdown.moldAmortizationPerPiece > 0 && (
                    <div className="bg-teal-500/5 border border-teal-500/20 rounded-xl p-4">
                      <h3 className="text-lg font-bold text-purple-300 mb-3">3. إهلاك القالب</h3>
                      <div className="text-slate-300 text-sm space-y-1">
                        <p>سعر القالب: <span className="text-white font-bold">{details.mold?.price.toLocaleString()} ج.م</span></p>
                        <p>العمر الافتراضي: <span className="text-white font-bold">{details.mold?.max_shots?.toLocaleString()} شوت</span></p>
                        <div className="bg-black/20 rounded-lg p-3 mt-2 font-mono text-sm text-emerald-300">
                          إهلاك القالب للقطعة = ({details.mold?.price?.toLocaleString()} × 1.5) ÷ {details.mold?.max_shots?.toLocaleString()}
                          <br />
                          = <span className="text-yellow-300 font-bold">{costBreakdown.moldAmortizationPerPiece.toFixed(4)} ج.م / قطعة</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <h3 className="text-lg font-bold text-emerald-300 mb-3">
                      {costBreakdown.moldAmortizationPerPiece > 0 ? '4' : '3'}. إجمالي التكلفة التقديرية للقطعة
                    </h3>
                    <div className="bg-black/20 rounded-lg p-4 font-mono text-sm">
                      <span className="text-slate-400">التكلفة الكلية</span>
                      <br />
                      = {costBreakdown.rawCostPerPiece.toFixed(4)} (خام) + {costBreakdown.fixedPerPiece.toFixed(4)} (ثابت + كهرباء{costBreakdown.machineDepreciationHourly > 0 ? ' + إهلاك ماكينة' : ''}){costBreakdown.moldAmortizationPerPiece > 0 ? ` + ${costBreakdown.moldAmortizationPerPiece.toFixed(4)} (إهلاك قالب)` : ''}
                      <br />
                      = <span className="text-yellow-300 font-bold text-lg">{costBreakdown.totalPerPiece.toFixed(4)} ج.م / قطعة</span>
                    </div>
                    <div className="mt-3 text-[#ecfdf5]0 text-xs">
                      * ملاحظة: متوسط التكلفة الفعلي للمنتج ({Number(product.cost_price || 0).toFixed(2)} ج.م) هو WAC عبر كل دفعات الإنتاج السابقة، وقد يختلف عن التقدير الحالي.
                    </div>
                  </div>
                </div>
              </InfoCard>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
