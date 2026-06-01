'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { format, subDays } from 'date-fns';

interface ProductionRecord {
    id: number;
    date: string;
    machine_id: number;
    machine?: Machine;
    mold_id: number;
    mold?: Mold;
    raw_material_id: number;
    raw_material?: RawMaterial;
    total_production_kg: number;
    hours_worked: number;
    pieces_produced: number;
    notes?: string;
}

interface Machine {
    id: number;
    name: string;
    status: string;
    last_mold_id?: number;
    last_raw_material_id?: number;
}

interface Mold {
    id: number;
    name: string;
    product_weight?: number;
}

interface RawMaterial {
    id: number;
    product?: {
        name: string;
    };
}

interface BulkProductionItem {
    machine_id: number;
    machine_name: string;
    mold_id: string | number;
    raw_material_id: string | number;
    total_production_kg: string | number;
    hours_worked: string | number;
    notes: string;
}

const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-500',
    INACTIVE: 'bg-slate-500',
    MAINTENANCE: 'bg-yellow-500',
    BROKEN: 'bg-red-500',
};

const statusLabels: Record<string, string> = {
    ACTIVE: 'نشطة',
    INACTIVE: 'متوقفة',
    MAINTENANCE: 'صيانة',
    BROKEN: 'عاطلة',
};

export default function DailyProductionPage() {
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dailyRecords, setDailyRecords] = useState<ProductionRecord[]>([]);
    const [weeklyRecords, setWeeklyRecords] = useState<ProductionRecord[]>([]);
    const [machines, setMachines] = useState<Machine[]>([]);
    const [molds, setMolds] = useState<Mold[]>([]);
    const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [bulkData, setBulkData] = useState<BulkProductionItem[]>([]);
    const [moldStats, setMoldStats] = useState<Record<number, number>>({});
    const router = useRouter();
    const [isEditMode, setIsEditMode] = useState(false);
    const [editingRecords, setEditingRecords] = useState<Map<number, ProductionRecord>>(new Map());
    const [showSingleModal, setShowSingleModal] = useState(false);
    const [singleMachine, setSingleMachine] = useState<Machine | null>(null);
    const [singleForm, setSingleForm] = useState<BulkProductionItem>({
        machine_id: 0, machine_name: '', mold_id: '', raw_material_id: '', total_production_kg: '', hours_worked: 8, notes: ''
    });

    const todayTotalKg = useMemo(() =>
        dailyRecords.reduce((sum, r) => sum + Number(r.total_production_kg), 0), [dailyRecords]);
    const todayTotalPieces = useMemo(() =>
        dailyRecords.reduce((sum, r) => sum + Number(r.pieces_produced), 0), [dailyRecords]);
    const machinesInProduction = useMemo(() =>
        new Set(dailyRecords.map(r => r.machine_id)).size, [dailyRecords]);
    const activeMachinesCount = useMemo(() =>
        machines.filter(m => m.status === 'ACTIVE').length, [machines]);
    const avgPerMachine = useMemo(() =>
        machinesInProduction > 0 ? todayTotalKg / machinesInProduction : 0, [todayTotalKg, machinesInProduction]);

    const weeklyMoldAvg = useMemo(() => {
        const sums: Record<number, { total: number; count: number }> = {};
        for (const r of weeklyRecords) {
            if (!sums[r.mold_id]) sums[r.mold_id] = { total: 0, count: 0 };
            sums[r.mold_id].total += Number(r.total_production_kg);
            sums[r.mold_id].count++;
        }
        const avgs: Record<number, number> = {};
        for (const [id, s] of Object.entries(sums)) {
            avgs[Number(id)] = s.total / s.count;
        }
        return avgs;
    }, [weeklyRecords]);

    const weeklyMachineKg = useMemo(() => {
        const sums: Record<number, number> = {};
        for (const r of weeklyRecords) {
            sums[r.machine_id] = (sums[r.machine_id] || 0) + Number(r.total_production_kg);
        }
        return sums;
    }, [weeklyRecords]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const weekStart = format(subDays(new Date(date), 6), 'yyyy-MM-dd');
            const [daily, weekly, mach, mol, mat] = await Promise.all([
                api.getDailyProduction(date),
                api.getDailyProduction({ start_date: weekStart, end_date: date }),
                api.getMachinesWithStatus(),
                api.getMolds(),
                api.getRawMaterials()
            ]);
            setDailyRecords(daily);
            setWeeklyRecords(weekly);
            setMachines(mach.sort((a: Machine, b: Machine) => a.name.localeCompare(b.name, 'ar')));
            setMolds(mol.sort((a: Mold, b: Mold) => a.name.localeCompare(b.name, 'ar')));
            setRawMaterials(mat.sort((a: RawMaterial, b: RawMaterial) => (a.product?.name || '').localeCompare(b.product?.name || '', 'ar')));
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    }, [date]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchedMoldIds = useRef<Set<number>>(new Set());
    useEffect(() => {
        const ids = new Set<number>();
        dailyRecords.forEach(r => ids.add(r.mold_id));
        machines.forEach(m => { if (m.last_mold_id) ids.add(m.last_mold_id); });
        ids.forEach(id => {
            if (!fetchedMoldIds.current.has(id)) {
                fetchedMoldIds.current.add(id);
                api.getMoldStats(id).then(stats => {
                    setMoldStats(prev => ({ ...prev, [id]: stats.averageDailyProduction }));
                }).catch(() => {});
            }
        });
    }, [dailyRecords, machines]);

    const handleOpenModal = () => {
        if (dailyRecords.length > 0) {
            const recordMap = new Map(dailyRecords.map(r => [r.machine_id, r]));
            setEditingRecords(recordMap);
            setIsEditMode(true);
            const editBulkData = machines.map(m => {
                const existing = recordMap.get(m.id);
                return {
                    machine_id: m.id,
                    machine_name: m.name,
                    mold_id: existing?.mold_id ?? m.last_mold_id ?? '',
                    raw_material_id: existing?.raw_material_id ?? m.last_raw_material_id ?? '',
                    total_production_kg: existing?.total_production_kg ?? '',
                    hours_worked: existing?.hours_worked ?? 8,
                    notes: existing?.notes ?? ''
                };
            });
            setBulkData(editBulkData);
            setShowModal(true);
            editBulkData.forEach(item => {
                if (item.mold_id) {
                    const mid = Number(item.mold_id);
                    if (moldStats[mid] === undefined) {
                        api.getMoldStats(mid).then(stats => {
                            setMoldStats(prev => ({ ...prev, [mid]: stats.averageDailyProduction }));
                        }).catch(() => {});
                    }
                }
            });
        } else {
            setIsEditMode(false);
            setEditingRecords(new Map());
            const initialBulkData = machines.map(m => ({
                machine_id: m.id,
                machine_name: m.name,
                mold_id: m.last_mold_id || '',
                raw_material_id: m.last_raw_material_id || '',
                total_production_kg: '',
                hours_worked: 8,
                notes: ''
            }));
            setBulkData(initialBulkData);
            setShowModal(true);
            initialBulkData.forEach(item => {
                if (item.mold_id) {
                    const mid = Number(item.mold_id);
                    if (moldStats[mid] === undefined) {
                        api.getMoldStats(mid).then(stats => {
                            setMoldStats(prev => ({ ...prev, [mid]: stats.averageDailyProduction }));
                        }).catch(() => {});
                    }
                }
            });
        }
    };

    const handleOpenSingleModal = (machine: Machine) => {
        setSingleMachine(machine);
        setSingleForm({
            machine_id: machine.id,
            machine_name: machine.name,
            mold_id: machine.last_mold_id || '',
            raw_material_id: machine.last_raw_material_id || '',
            total_production_kg: '',
            hours_worked: 8,
            notes: ''
        });
        setShowSingleModal(true);
    };

    const handleSingleFieldChange = (field: keyof BulkProductionItem, value: string | number) => {
        setSingleForm(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveSingle = async () => {
        const moldId = singleForm.mold_id === '' ? undefined : Number(singleForm.mold_id);
        const rawMaterialId = singleForm.raw_material_id === '' ? undefined : Number(singleForm.raw_material_id);
        const totalProductionKg = singleForm.total_production_kg === '' ? undefined : Number(singleForm.total_production_kg);
        const hoursWorked = singleForm.hours_worked === '' ? undefined : Number(singleForm.hours_worked);

        if (!totalProductionKg || totalProductionKg <= 0 || !moldId || !rawMaterialId) {
            alert('يرجى إدخال الإسطمبة، الخامة، والكمية');
            return;
        }
        if (hoursWorked !== undefined && (hoursWorked <= 0 || hoursWorked > 24)) {
            alert('يرجى التأكد من أن ساعات العمل بين 1 و 24 ساعة');
            return;
        }

        setLoading(true);
        try {
            await api.createProduction({
                machine_id: singleForm.machine_id,
                machine_name: singleForm.machine_name,
                mold_id: moldId,
                raw_material_id: rawMaterialId,
                total_production_kg: totalProductionKg,
                hours_worked: hoursWorked ?? 8,
                notes: singleForm.notes,
                date: date,
            });
            setShowSingleModal(false);
            fetchData();
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to save production:', error);
            alert(`حدث خطأ أثناء الحفظ: ${errorMsg}\nيرجى التأكد من استكمال البيانات (الإسطمبة، الخامة، والكمية).`);
        } finally {
            setLoading(false);
        }
    };

    const handleBulkChange = (index: number, field: keyof BulkProductionItem, value: string | number) => {
        const newData = [...bulkData];
        newData[index] = { ...newData[index], [field]: value };
        setBulkData(newData);
        if (field === 'mold_id' && value) {
            const mid = Number(value);
            if (moldStats[mid] === undefined) {
                api.getMoldStats(mid).then(stats => {
                    setMoldStats(prev => ({ ...prev, [mid]: stats.averageDailyProduction }));
                }).catch(() => {});
            }
        }
    };

    const handleSaveBulk = async (goToNextDay = false) => {
        const invalidHours = bulkData.filter(item => item.total_production_kg && (Number(item.hours_worked) <= 0 || Number(item.hours_worked) > 24));
        if (invalidHours.length > 0) {
            alert('يرجى التأكد من أن ساعات العمل بين 1 و 24 ساعة');
            return;
        }

        setLoading(true);
        try {
            const normalizedItems = bulkData
                .map((item) => {
                    const moldId = item?.mold_id === '' || item?.mold_id == null ? undefined : Number(item.mold_id);
                    const rawMaterialId = item?.raw_material_id === '' || item?.raw_material_id == null ? undefined : Number(item.raw_material_id);
                    const totalProductionKg = item?.total_production_kg === '' || item?.total_production_kg == null ? undefined : Number(item.total_production_kg);
                    const hoursWorked = item?.hours_worked === '' || item?.hours_worked == null ? undefined : Number(item.hours_worked);
                    return {
                        mold_id: moldId,
                        raw_material_id: rawMaterialId,
                        total_production_kg: totalProductionKg,
                        hours_worked: hoursWorked,
                        notes: item?.notes ?? '',
                        machine_id: item?.machine_id,
                        machine_name: item?.machine_name,
                    };
                })
                .filter((i) => Number.isFinite(i.total_production_kg) && (i.total_production_kg as number) > 0 && Number.isFinite(i.mold_id) && Number.isFinite(i.raw_material_id));

            if (normalizedItems.length === 0) {
                alert('يرجى إدخال بيانات إنتاج واحدة على الأقل');
                setLoading(false);
                return;
            }

            let allPromises: Promise<unknown>[];

            if (isEditMode) {
                allPromises = normalizedItems.map((item) => {
                    const existingRecord = editingRecords.get(item.machine_id);
                    if (existingRecord) {
                        return api.updateProduction(existingRecord.id, {
                            mold_id: item.mold_id!,
                            raw_material_id: item.raw_material_id!,
                            total_production_kg: item.total_production_kg!,
                            hours_worked: Number.isFinite(item.hours_worked) ? item.hours_worked! : 8,
                            notes: item.notes,
                            machine_id: item.machine_id,
                            date: date,
                        });
                    }
                    return api.createProduction({
                        machine_id: item.machine_id,
                        machine_name: item.machine_name,
                        mold_id: item.mold_id!,
                        raw_material_id: item.raw_material_id!,
                        total_production_kg: item.total_production_kg!,
                        hours_worked: Number.isFinite(item.hours_worked) ? item.hours_worked! : 8,
                        notes: item.notes,
                        date: date,
                    });
                });
                for (const [machineId, record] of editingRecords.entries()) {
                    if (!normalizedItems.some(i => i.machine_id === machineId)) {
                        allPromises.push(api.deleteProduction(record.id));
                    }
                }
            } else {
                allPromises = normalizedItems.map((item) =>
                    api.createProduction({
                        machine_id: item.machine_id,
                        machine_name: item.machine_name,
                        mold_id: item.mold_id!,
                        raw_material_id: item.raw_material_id!,
                        total_production_kg: item.total_production_kg!,
                        hours_worked: Number.isFinite(item.hours_worked) ? item.hours_worked! : 8,
                        notes: item.notes,
                        date: date,
                    })
                );
            }

            const results = await Promise.allSettled(allPromises.map(async (p) => { await p; }));
            const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');

            if (failed.length > 0) {
                const firstError = failed[0].reason;
                const errorMsg = firstError instanceof Error ? firstError.message : String(firstError);
                console.error(`Failed to save ${failed.length}/${results.length} production items. First error:`, firstError);
                if (failed.length === results.length) {
                    alert(`فشل حفظ جميع العناصر (${failed.length}/${results.length}).\nالخطأ: ${errorMsg}`);
                    setLoading(false);
                    return;
                }
                alert(`تم حفظ ${results.length - failed.length} عنصر بنجاح.\nفشل ${failed.length} عنصر.\nالخطأ الأول: ${errorMsg}`);
            }

            setShowModal(false);
            setIsEditMode(false);
            setEditingRecords(new Map());

            if (goToNextDay) {
                const nextDate = new Date(date);
                nextDate.setDate(nextDate.getDate() + 1);
                setDate(format(nextDate, 'yyyy-MM-dd'));
            } else {
                fetchData();
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error('Failed to save production:', error);
            alert(`حدث خطأ أثناء الحفظ: ${errorMsg}\nيرجى التأكد من استكمال البيانات (الإسطمبة، الخامة، والكمية).`);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !showModal) {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-6 flex items-center justify-center" dir="rtl">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">جاري تحميل البيانات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-4 md:p-6" dir="rtl">
            <div className="max-w-7xl mx-auto">

                {/* ===== HEADER ===== */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-slate-700/50 rounded-lg transition text-slate-400 hover:text-white"
                            title="رجوع"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">تسجيل الإنتاج اليومي</h1>
                            <p className="text-slate-400 mt-1">متابعة وتسجيل إنتاج الماكينات — {date}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                        />
                        <button
                            onClick={handleOpenModal}
                            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 whitespace-nowrap"
                        >
                            <span>➕</span> تسجيل إنتاج جديد
                        </button>
                    </div>
                </div>

                {/* ===== STATS CARDS ===== */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-2xl p-4 md:p-5">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">إجمالي الإنتاج</p>
                        <p className="text-xl md:text-2xl font-bold text-blue-400">{todayTotalKg.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">كجم</p>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border border-emerald-500/20 rounded-2xl p-4 md:p-5">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">إجمالي القطع</p>
                        <p className="text-xl md:text-2xl font-bold text-emerald-400">{todayTotalPieces.toLocaleString()}</p>
                        <p className="text-xs text-slate-500">قطعة</p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-2xl p-4 md:p-5">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">الماكينات النشطة</p>
                        <p className="text-xl md:text-2xl font-bold text-purple-400">{activeMachinesCount}<span className="text-lg text-slate-500"> / {machines.length}</span></p>
                        <p className="text-xs text-slate-500">ماكينة</p>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 border border-amber-500/20 rounded-2xl p-4 md:p-5">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">مشغولة اليوم</p>
                        <p className="text-xl md:text-2xl font-bold text-amber-400">{machinesInProduction}</p>
                        <p className="text-xs text-slate-500">ماكينة</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-500/10 to-indigo-600/10 border border-indigo-500/20 rounded-2xl p-4 md:p-5">
                        <p className="text-slate-400 text-xs md:text-sm font-medium mb-1">متوسط / ماكينة</p>
                        <p className="text-xl md:text-2xl font-bold text-indigo-400">{avgPerMachine.toFixed(1)}</p>
                        <p className="text-xs text-slate-500">كجم</p>
                    </div>
                </div>

                {/* ===== ALL MACHINES GRID ===== */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>🏭</span> جميع الماكينات
                    </h2>
                    {machines.length === 0 ? (
                        <p className="text-slate-500 text-center py-8">لا توجد ماكينات مسجلة</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {machines.map(machine => {
                                const record = dailyRecords.find(r => r.machine_id === machine.id);
                                const mold = molds.find(m => m.id === (record?.mold_id || machine.last_mold_id));
                                const rawMat = rawMaterials.find(rm => rm.id === (record?.raw_material_id || machine.last_raw_material_id));
                                const avg = weeklyMoldAvg[mold?.id ?? -1] ?? moldStats[mold?.id ?? -1];
                                const weekKg = weeklyMachineKg[machine.id] ?? 0;

                                return (
                                    <div key={machine.id} className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-slate-700/50 transition group">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-3 h-3 rounded-full ${statusColors[machine.status] || 'bg-slate-500'}`} title={statusLabels[machine.status]}></span>
                                                <h3 className="font-bold text-lg">{machine.name}</h3>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenSingleModal(machine); }}
                                                    className="mr-2 w-6 h-6 flex items-center justify-center rounded-full bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 text-sm font-bold transition"
                                                    title="إضافة إنتاج"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <span className="text-[10px] text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">{statusLabels[machine.status] || machine.status}</span>
                                        </div>

                                        <div className="text-sm text-slate-400 space-y-1 mb-3">
                                            <p><span className="text-slate-500">الإسطمبة:</span> {mold?.name || '---'}</p>
                                            <p><span className="text-slate-500">الخامة:</span> {rawMat?.product?.name || '---'}</p>
                                        </div>

                                        {record ? (
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-blue-400 font-bold text-lg">{Number(record.total_production_kg).toFixed(1)} كجم</span>
                                                    <span className="text-emerald-400 font-bold">{record.pieces_produced} ق</span>
                                                </div>
                                                {avg > 0 && (
                                                    <div>
                                                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                                                            <span>الأداء</span>
                                                            <span className={Number(record.total_production_kg) >= avg ? 'text-green-400' : 'text-red-400'}>
                                                                {((Number(record.total_production_kg) / avg) * 100).toFixed(0)}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-700 rounded-full h-2">
                                                            <div
                                                                className={`h-2 rounded-full transition-all duration-500 ${Number(record.total_production_kg) >= avg ? 'bg-gradient-to-l from-green-500 to-emerald-400' : 'bg-gradient-to-l from-red-500 to-rose-400'}`}
                                                                style={{ width: `${Math.min(100, (Number(record.total_production_kg) / avg) * 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                )}
                                                {weekKg > 0 && (
                                                    <p className="text-[11px] text-slate-500">آخر 7 أيام: <span className="text-slate-300 font-medium">{weekKg.toFixed(1)} كجم</span></p>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-slate-600 text-sm mb-2">لا يوجد إنتاج اليوم</p>
                                                {weekKg > 0 && (
                                                    <p className="text-[11px] text-slate-500">آخر 7 أيام: <span className="text-slate-300 font-medium">{weekKg.toFixed(1)} كجم</span></p>
                                                )}
                                                {avg > 0 && (
                                                    <p className="text-[11px] text-slate-500">متوسط الإنتاج: <span className="text-slate-300">{avg.toFixed(1)} كجم</span></p>
                                                )}
                                            </div>
                                        )}

                                        <button
                                            onClick={handleOpenModal}
                                            className="mt-3 w-full text-sm bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 px-3 py-1.5 rounded-xl transition font-medium"
                                        >
                                            {record ? 'تعديل الإنتاج' : 'تسجيل إنتاج'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ===== WEEKLY PRODUCTION TABLE ===== */}
                <div>
                    <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <span>📊</span> إنتاج آخر 7 أيام
                        <span className="text-sm font-normal text-slate-500">
                            ({format(subDays(new Date(date), 6), 'yyyy-MM-dd')} — {date})
                        </span>
                    </h2>
                    {weeklyRecords.length === 0 ? (
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl py-10 text-center">
                            <p className="text-slate-500">لا توجد سجلات إنتاج في هذه الفترة</p>
                        </div>
                    ) : (
                        <div className="bg-slate-800/50 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-700/50 text-slate-300">
                                        <tr>
                                            <th className="px-4 py-3 whitespace-nowrap">التاريخ</th>
                                            <th className="px-4 py-3 whitespace-nowrap">الماكينة</th>
                                            <th className="px-4 py-3 whitespace-nowrap">الإسطمبة</th>
                                            <th className="px-4 py-3 whitespace-nowrap">الخامة</th>
                                            <th className="px-4 py-3 whitespace-nowrap">ساعات العمل</th>
                                            <th className="px-4 py-3 whitespace-nowrap">الإنتاج (كجم)</th>
                                            <th className="px-4 py-3 whitespace-nowrap">القطع</th>
                                            <th className="px-4 py-3 whitespace-nowrap">الأداء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {weeklyRecords
                                            .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
                                            .map((record) => {
                                                const moldAvg = weeklyMoldAvg[record.mold_id] ?? moldStats[record.mold_id] ?? 0;
                                                const isGood = moldAvg === 0 || Number(record.total_production_kg) >= moldAvg;
                                                return (
                                                    <tr key={`${record.id}-${record.date}`} className="hover:bg-white/5 transition">
                                                        <td className="px-4 py-3 text-slate-400 text-sm whitespace-nowrap">{record.date}</td>
                                                        <td className="px-4 py-3 font-medium whitespace-nowrap">{record.machine?.name}</td>
                                                        <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">{record.mold?.name}</td>
                                                        <td className="px-4 py-3 text-slate-300 text-sm whitespace-nowrap">{record.raw_material?.product?.name}</td>
                                                        <td className="px-4 py-3 text-slate-300 whitespace-nowrap">{record.hours_worked} س</td>
                                                        <td className={`px-4 py-3 font-bold whitespace-nowrap ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                                                            {Number(record.total_production_kg).toFixed(1)} كجم
                                                        </td>
                                                        <td className="px-4 py-3 text-blue-400 font-bold whitespace-nowrap">{record.pieces_produced} ق</td>
                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                            {moldAvg > 0 ? (
                                                                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isGood ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                                    {((Number(record.total_production_kg) / moldAvg) * 100).toFixed(0)}%
                                                                </span>
                                                            ) : (
                                                                <span className="text-xs text-slate-600">---</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                    </tbody>
                                    <tfoot className="bg-slate-700/30">
                                        <tr>
                                            <td colSpan={5} className="px-4 py-3 font-bold text-slate-300 text-left">الإجمالي</td>
                                            <td className="px-4 py-3 font-bold text-emerald-400">
                                                {weeklyRecords.reduce((s, r) => s + Number(r.total_production_kg), 0).toFixed(1)} كجم
                                            </td>
                                            <td className="px-4 py-3 font-bold text-blue-400">
                                                {weeklyRecords.reduce((s, r) => s + Number(r.pieces_produced), 0).toLocaleString()} ق
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            {/* ===== BULK ENTRY MODAL ===== */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-slate-800 border border-slate-700 w-full max-w-6xl rounded-2xl shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">{isEditMode ? `تعديل إنتاج الماكينات - ${date}` : `تسجيل إنتاج الماكينات - ${date}`}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">✕</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            <table className="w-full text-right">
                                <thead className="text-slate-400 text-sm">
                                    <tr>
                                        <th className="pb-4 px-2">الماكينة</th>
                                        <th className="pb-4 px-2">الإسطمبة</th>
                                        <th className="pb-4 px-2">الخامة</th>
                                        <th className="pb-4 px-2">ساعات العمل</th>
                                        <th className="pb-4 px-2">الإنتاج (كجم)</th>
                                        <th className="pb-4 px-2">المتوسط</th>
                                        <th className="pb-4 px-2">ملاحظات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulkData.map((item, index) => (
                                        <tr key={item.machine_id} className="border-t border-slate-700/50">
                                            <td className="py-4 px-2 font-bold">{item.machine_name}</td>
                                            <td className="py-4 px-2">
                                                <select
                                                    value={item.mold_id}
                                                    onChange={(e) => handleBulkChange(index, 'mold_id', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="">اختر إسطمبة</option>
                                                    {molds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-4 px-2">
                                                <select
                                                    value={item.raw_material_id}
                                                    onChange={(e) => handleBulkChange(index, 'raw_material_id', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value="">اختر خامة</option>
                                                    {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.product?.name}</option>)}
                                                </select>
                                            </td>
                                            <td className="py-4 px-2">
                                                <input
                                                    type="number"
                                                    value={item.hours_worked}
                                                    onChange={(e) => handleBulkChange(index, 'hours_worked', e.target.value)}
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-20 text-center outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                            <td className="py-4 px-2">
                                                <div className="flex flex-col gap-1">
                                                    <input
                                                        type="number"
                                                        value={item.total_production_kg}
                                                        onChange={(e) => handleBulkChange(index, 'total_production_kg', e.target.value)}
                                                        placeholder="0.0"
                                                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-24 text-center outline-none focus:ring-1 focus:ring-blue-500 font-bold text-blue-400"
                                                    />
                                                    {item.mold_id && item.total_production_kg && (
                                                        <span className="text-[10px] text-green-400 text-center font-bold">
                                                            ~ {Math.floor((Number(item.total_production_kg) * 1000) / Number(molds.find(m => m.id === Number(item.mold_id))?.product_weight || 1))} ق
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-2 text-xs text-slate-400">
                                                {item.mold_id && (weeklyMoldAvg[Number(item.mold_id)] !== undefined || moldStats[Number(item.mold_id)] !== undefined) ? (
                                                    <div className="flex flex-col items-center gap-1">
                                                        <span className={`px-1.5 py-0.5 rounded ${Number(item.total_production_kg) >= Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]) ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                                            {(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]).toFixed(1)} كجم
                                                        </span>
                                                        {item.total_production_kg && (
                                                            <span className={`text-[10px] font-bold ${Number(item.total_production_kg) >= Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]) ? 'text-green-500' : 'text-red-500'}`} dir="ltr">
                                                                {((Number(item.total_production_kg) - Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)])) / Number(weeklyMoldAvg[Number(item.mold_id)] ?? moldStats[Number(item.mold_id)]) * 100).toFixed(1)}%
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : '-'}
                                            </td>
                                            <td className="py-4 px-2">
                                                <input
                                                    type="text"
                                                    value={item.notes}
                                                    onChange={(e) => handleBulkChange(index, 'notes', e.target.value)}
                                                    placeholder="..."
                                                    className="bg-slate-900 border border-slate-700 rounded px-2 py-1 w-full text-xs outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 border-t border-slate-700 flex justify-end gap-4 bg-slate-800/50">
                            <button
                                onClick={() => handleSaveBulk(false)}
                                disabled={loading}
                                className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-bold transition disabled:opacity-50"
                            >
                                حفظ فقط
                            </button>
                            <button
                                onClick={() => handleSaveBulk(true)}
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading && <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>}
                                حفظ والذهاب لليوم التالي ➔
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ===== SINGLE MACHINE ENTRY MODAL ===== */}
            {showSingleModal && singleMachine && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowSingleModal(false)}></div>
                    <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl relative z-10">
                        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                            <h2 className="text-xl font-bold">إضافة إنتاج — {singleMachine.name}</h2>
                            <button onClick={() => setShowSingleModal(false)} className="p-2 hover:bg-slate-700 rounded-lg">✕</button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الإسطمبة</label>
                                <select
                                    value={singleForm.mold_id}
                                    onChange={(e) => handleSingleFieldChange('mold_id', e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
                                >
                                    <option value="">اختر إسطمبة</option>
                                    {molds.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الخامة</label>
                                <select
                                    value={singleForm.raw_material_id}
                                    onChange={(e) => handleSingleFieldChange('raw_material_id', e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
                                >
                                    <option value="">اختر خامة</option>
                                    {rawMaterials.map(rm => <option key={rm.id} value={rm.id}>{rm.product?.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ساعات العمل</label>
                                <input
                                    type="number"
                                    value={singleForm.hours_worked}
                                    onChange={(e) => handleSingleFieldChange('hours_worked', e.target.value)}
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
                                />
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">الإنتاج (كجم)</label>
                                <input
                                    type="number"
                                    value={singleForm.total_production_kg}
                                    onChange={(e) => handleSingleFieldChange('total_production_kg', e.target.value)}
                                    placeholder="0.0"
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white font-bold text-blue-400"
                                />
                                {singleForm.mold_id && singleForm.total_production_kg && (
                                    <span className="text-xs text-green-400 mt-1 block">
                                        ~ {Math.floor((Number(singleForm.total_production_kg) * 1000) / Number(molds.find(m => m.id === Number(singleForm.mold_id))?.product_weight || 1))} ق
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm text-slate-400 mb-1">ملاحظات</label>
                                <input
                                    type="text"
                                    value={singleForm.notes}
                                    onChange={(e) => handleSingleFieldChange('notes', e.target.value)}
                                    placeholder="..."
                                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 w-full outline-none focus:ring-1 focus:ring-blue-500 text-white"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-700 flex justify-end gap-4">
                            <button
                                onClick={() => setShowSingleModal(false)}
                                className="bg-slate-700 hover:bg-slate-600 px-6 py-2 rounded-lg font-bold transition"
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSaveSingle}
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 disabled:opacity-50"
                            >
                                {loading && <div className="animate-spin h-4 w-4 border-2 border-white/20 border-t-white rounded-full"></div>}
                                حفظ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
