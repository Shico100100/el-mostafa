'use client';

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { api } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { toast } from 'sonner';
import type {
  Machine, Mold, RawMaterial, ProductionRecord, BulkProductionItem,
} from '@/components/manufacturing/types';
import { useProductionStock } from './useProductionStock';
import { useProductionSessions } from './useProductionSessions';

export function useDailyProduction() {
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRecords, setEditingRecords] = useState<Map<number, ProductionRecord>>(new Map());
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [singleMachine, setSingleMachine] = useState<Machine | null>(null);
  const [singleForm, setSingleForm] = useState<BulkProductionItem>({
    machine_id: 0, machine_name: '', mold_id: '', product_id: '',
    total_production_kg: '', hours_worked: 8, notes: '',
  });
  const [showRangeModal, setShowRangeModal] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null);
  const [rangeForm, setRangeForm] = useState({
    machine_id: '', machine_name: '', mold_id: '', product_id: '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    total_production_kg: '', mode: 'distribute' as 'sum' | 'distribute',
    hours_worked: 8, notes: '',
  });

  const fetchedMoldIds = useRef<Set<number>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const weekStart = format(subDays(new Date(date), 29), 'yyyy-MM-dd');
      const [daily, weekly, mach, mol, mat] = await Promise.all([
        api.getDailyProduction(date),
        api.getDailyProduction({ start_date: weekStart, end_date: date }),
        api.getMachinesWithStatus(),
        api.getMolds(),
        api.getRawMaterials(),
      ]);
      const dailyList = daily as ProductionRecord[] | { items?: ProductionRecord[] };
      const weeklyList = weekly as ProductionRecord[] | { items?: ProductionRecord[] };
      const machinesList = mach as Machine[] | { items?: Machine[] };
      const moldsList = mol as Mold[] | { items?: Mold[] };
      const rawMaterialsList = mat as RawMaterial[] | { items?: RawMaterial[] };
      setDailyRecords(Array.isArray(dailyList) ? dailyList : (dailyList.items ?? []));
      setWeeklyRecords(Array.isArray(weeklyList) ? weeklyList : (weeklyList.items ?? []));
      setMachines(Array.isArray(machinesList) ? machinesList.sort((a, b) => a.name.localeCompare(b.name, 'ar')) : machinesList.items?.sort((a, b) => a.name.localeCompare(b.name, 'ar')) ?? []);
      setMolds(Array.isArray(moldsList) ? moldsList.sort((a, b) => a.name.localeCompare(b.name, 'ar')) : moldsList.items?.sort((a, b) => a.name.localeCompare(b.name, 'ar')) ?? []);
      setRawMaterials(Array.isArray(rawMaterialsList) ? rawMaterialsList.sort((a, b) =>
        (a.product?.name || '').localeCompare(b.product?.name || '', 'ar')) : rawMaterialsList.items?.sort((a, b) =>
        (a.product?.name || '').localeCompare(b.product?.name || '', 'ar')) ?? []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, [date]);

  const stock = useProductionStock(date, fetchData, setLoading, {
    onClearEditState: () => {
      setShowModal(false);
      setIsEditMode(false);
      setEditingRecords(new Map());
    },
  });

  const sessions = useProductionSessions(fetchData, {
    onSetShowRangeModal: setShowRangeModal,
    onSetEditingSessionId: setEditingSessionId,
    onSetRangeForm: setRangeForm,
  });

  useEffect(() => { fetchData(); }, [fetchData]);

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

  const fetchMoldStats = (items: BulkProductionItem[]) => {
    items.forEach(item => {
      if (item.mold_id) {
        const mid = Number(item.mold_id);
        if (moldStats[mid] === undefined) {
          api.getMoldStats(mid).then(stats => {
            setMoldStats(prev => ({ ...prev, [mid]: stats.averageDailyProduction }));
          }).catch(() => {});
        }
      }
    });
  };

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
          product_id: existing?.product_id ?? m.last_product_id ?? '',
          total_production_kg: existing?.total_production_kg ?? '',
          hours_worked: existing?.hours_worked ?? 8,
          notes: existing?.notes ?? '',
        };
      });
      setBulkData(editBulkData);
      setShowModal(true);
      fetchMoldStats(editBulkData);
    } else {
      setIsEditMode(false);
      setEditingRecords(new Map());
      const initialBulkData = machines.map(m => ({
        machine_id: m.id,
        machine_name: m.name,
        mold_id: m.last_mold_id || '',
        product_id: m.last_product_id || '',
        total_production_kg: '',
        hours_worked: 8,
        notes: '',
      }));
      setBulkData(initialBulkData);
      setShowModal(true);
      fetchMoldStats(initialBulkData);
    }
  };

  const handleOpenSingleModal = (machine: Machine) => {
    setSingleMachine(machine);
    setSingleForm({
      machine_id: machine.id, machine_name: machine.name,
      mold_id: machine.last_mold_id || '', product_id: machine.last_product_id || '',
      total_production_kg: '', hours_worked: 8, notes: '',
    });
    setShowSingleModal(true);
  };

  const handleSingleFieldChange = (field: keyof BulkProductionItem, value: string | number) => {
    setSingleForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSingle = async () => {
    const moldId = singleForm.mold_id === '' ? undefined : Number(singleForm.mold_id);
    const rawMaterialId = singleForm.product_id === '' ? undefined : Number(singleForm.product_id);
    const totalProductionKg = singleForm.total_production_kg === '' ? undefined : Number(singleForm.total_production_kg);
    const hoursWorked = singleForm.hours_worked === '' ? undefined : Number(singleForm.hours_worked);

    if (!totalProductionKg || totalProductionKg <= 0 || !moldId || !rawMaterialId) {
      toast.error('يرجى إدخال الإسطمبة، الخامة، والكمية');
      return;
    }
    if (hoursWorked !== undefined && (hoursWorked <= 0 || hoursWorked > 24)) {
      toast.error('يرجى التأكد من أن ساعات العمل بين 1 و 24 ساعة');
      return;
    }

    setLoading(true);
    try {
      await api.createProduction({
        machine_id: singleForm.machine_id, machine_name: singleForm.machine_name,
        mold_id: moldId, product_id: rawMaterialId,
        total_production_kg: totalProductionKg, hours_worked: hoursWorked ?? 8,
        notes: singleForm.notes, date: date,
      });
      setShowSingleModal(false);
      toast.success('تم حفظ الإنتاج بنجاح');
      fetchData();
    } catch (error) {
      console.error('Failed to save production:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };

  function getWorkingDays(start: string, end: string): string[] {
    const days: string[] = [];
    const current = new Date(start);
    const endDate = new Date(end);
    while (current <= endDate) {
      if (current.getDay() !== 5) days.push(format(current, 'yyyy-MM-dd'));
      current.setDate(current.getDate() + 1);
    }
    return days;
  }

  const handleSaveRange = async () => {
    const machineId = Number(rangeForm.machine_id);
    const moldId = Number(rangeForm.mold_id);
    const rawMaterialId = Number(rangeForm.product_id);
    const totalKg = Number(rangeForm.total_production_kg);

    if (!machineId || !moldId || !rawMaterialId || !totalKg || totalKg <= 0) {
      toast.error('يرجى استكمال جميع البيانات (الماكينة، الإسطمبة، الخامة، الكمية)');
      return;
    }
    if (rangeForm.start_date > rangeForm.end_date) {
      toast.error('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
      return;
    }
    if (rangeForm.mode === 'distribute') {
      const workingDays = getWorkingDays(rangeForm.start_date, rangeForm.end_date);
      if (workingDays.length === 0) {
        toast.error('لا توجد أيام عمل في هذه الفترة (الجمعة إجازة)');
        return;
      }
    }

    setLoading(true);
    try {
      if (editingSessionId) await api.deleteRangeSession(editingSessionId);

      const result = await api.createRangeProduction({
        machine_id: machineId, mold_id: moldId, product_id: rawMaterialId,
        start_date: rangeForm.start_date, end_date: rangeForm.end_date,
        total_production_kg: totalKg, mode: rangeForm.mode,
        hours_worked: rangeForm.hours_worked, notes: rangeForm.notes,
      });

      if (result.errors?.length > 0) {
        toast.success(`${result.records?.length || 0} يوم بنجاح. فشل ${result.errors.length} يوم.`);
      } else {
        toast.success('تم حفظ إنتاج الفترة بنجاح');
      }

      setShowRangeModal(false);
      setEditingSessionId(null);
      fetchData();
    } catch (error) {
      console.error('Failed to save range production:', error);
      toast.error(error instanceof Error ? error.message : 'حدث خطأ أثناء الحفظ');
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
    const invalidHours = bulkData.filter(
      item => item.total_production_kg && (Number(item.hours_worked) <= 0 || Number(item.hours_worked) > 24));
    if (invalidHours.length > 0) {
      toast.error('يرجى التأكد من أن ساعات العمل بين 1 و 24 ساعة');
      return;
    }

    setLoading(true);
    try {
      const normalizedItems = bulkData
        .map((item) => ({
          mold_id: item.mold_id === '' || item.mold_id == null ? undefined : Number(item.mold_id),
          product_id: item.product_id === '' || item.product_id == null ? undefined : Number(item.product_id),
          total_production_kg: item.total_production_kg === '' || item.total_production_kg == null ? undefined : Number(item.total_production_kg),
          hours_worked: item.hours_worked === '' || item.hours_worked == null ? undefined : Number(item.hours_worked),
          notes: item.notes ?? '',
          machine_id: item.machine_id,
          machine_name: item.machine_name,
        }))
        .filter((i) => Number.isFinite(i.total_production_kg) && (i.total_production_kg as number) > 0 && Number.isFinite(i.mold_id) && Number.isFinite(i.product_id));

      if (normalizedItems.length === 0) {
        toast.error('يرجى إدخال بيانات إنتاج واحدة على الأقل');
        setLoading(false);
        return;
      }

      const itemsToSubmit = normalizedItems.map((item) => ({
        mold_id: item.mold_id!, product_id: item.product_id!,
        total_production_kg: item.total_production_kg!,
        hours_worked: Number.isFinite(item.hours_worked) ? item.hours_worked! : 8,
        notes: item.notes, machine_id: item.machine_id, machine_name: item.machine_name, date: date,
      }));

      let allPromises: Promise<unknown>[];
      if (isEditMode) {
        allPromises = normalizedItems.map((item) => {
          const existingRecord = editingRecords.get(item.machine_id);
          if (existingRecord) {
            return api.updateProduction(existingRecord.id, {
              mold_id: item.mold_id!, product_id: item.product_id!,
              total_production_kg: item.total_production_kg!,
              hours_worked: Number.isFinite(item.hours_worked) ? item.hours_worked! : 8,
              notes: item.notes, machine_id: item.machine_id, date: date,
            });
          }
          return api.createProduction(itemsToSubmit.find(s => s.machine_id === item.machine_id)!);
        });
        for (const [machineId, record] of editingRecords.entries()) {
          if (!normalizedItems.some(i => i.machine_id === machineId)) {
            allPromises.push(api.deleteProduction(record.id));
          }
        }
      } else {
        allPromises = normalizedItems.map((item) =>
          api.createProduction(itemsToSubmit.find(s => s.machine_id === item.machine_id)!));
      }

      const results = await Promise.allSettled(allPromises.map(async (p) => { await p; }));
      const failed = results.map((r, i) => ({ r, i })).filter(({ r }) => r.status === 'rejected') as Array<{ r: PromiseRejectedResult; i: number }>;

      if (failed.length > 0) {
        const stockFailed = failed.filter(({ r }) =>
          r.reason instanceof Error && r.reason.message?.includes('رصيد غير كافٍ للمادة الخام'));
        if (stockFailed.length > 0) {
          stock.triggerStockError(stockFailed.map(({ i }) => ({
            bulkIndex: i, normalized: normalizedItems[i],
            error: stockFailed.find(({ i: fi }) => fi === i)!.r.reason as Error,
          })));
          setLoading(false);
          return;
        }
        const firstError = failed[0].r.reason;
        const errorMsg = firstError instanceof Error ? firstError.message : String(firstError);
        console.error(`Failed to save ${failed.length}/${results.length} items:`, firstError);
        if (failed.length === results.length) {
          toast.error(`فشل حفظ جميع العناصر: ${errorMsg}`);
          setLoading(false);
          return;
        }
        toast.success(`تم حفظ ${results.length - failed.length} عنصر. فشل ${failed.length}.`);
      } else {
        toast.success('تم حفظ الإنتاج بنجاح');
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
      toast.error(`حدث خطأ: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const exportHistory = async () => {
    try {
      await api.exportProductionHistory();
      toast.success('تم التصدير بنجاح');
    } catch { toast.error('فشل التصدير'); }
  };

  const importHistory = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await api.importProductionHistory(file);
      toast.success(`تم الاستيراد: ${result.success} بنجاح، ${result.failed} فشل`);
      fetchData();
    } catch { toast.error('فشل الاستيراد'); }
    e.target.value = '';
  };

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
    for (const [id, s] of Object.entries(sums)) avgs[Number(id)] = s.total / s.count;
    return avgs;
  }, [weeklyRecords]);

  const weeklyMachineKg = useMemo(() => {
    const sums: Record<number, number> = {};
    for (const r of weeklyRecords) sums[r.machine_id] = (sums[r.machine_id] || 0) + Number(r.total_production_kg);
    return sums;
  }, [weeklyRecords]);

  return {
    date, dailyRecords, weeklyRecords, machines, molds, rawMaterials, loading,
    showModal, bulkData, isEditMode, editingRecords,
    showSingleModal, singleMachine, singleForm,
    showRangeModal, editingSessionId, rangeForm,
    showSessionsModal: sessions.showSessionsModal, sessions: sessions.sessions,
    sessionsTotal: sessions.sessionsTotal, sessionsPage: sessions.sessionsPage,
    sessionsLoading: sessions.sessionsLoading,
    selectedSession: sessions.selectedSession, showSessionDetail: sessions.showSessionDetail,
    showRecordHistory: sessions.showRecordHistory, recordHistory: sessions.recordHistory,
    historyRecordId: sessions.historyRecordId,
    stockError: stock.stockError, showStockDialog: stock.showStockDialog,
    showSubstitutePicker: stock.showSubstitutePicker,
    moldStats, weeklyMoldAvg, weeklyMachineKg,
    todayTotalKg, todayTotalPieces, machinesInProduction, activeMachinesCount, avgPerMachine,
    setDate, setShowModal, setBulkData, setIsEditMode, setShowRangeModal,
    setShowSessionsModal: sessions.setShowSessionsModal,
    setShowSessionDetail: sessions.setShowSessionDetail,
    setShowRecordHistory: sessions.setShowRecordHistory,
    setShowSingleModal, setSingleForm, setRangeForm, setEditForm: setSingleForm,
    setShowStockDialog: stock.setShowStockDialog,
    setShowSubstitutePicker: stock.setShowSubstitutePicker,
    setSessionsPage: sessions.setSessionsPage,
    setEditingSessionId,
    handleOpenModal, handleOpenSingleModal, handleSingleFieldChange, handleSaveSingle,
    handleSaveRange, handleBulkChange, handleSaveBulk,
    handleAllowNegativeStock: stock.handleAllowNegativeStock,
    handleOpenSubstitutePicker: stock.handleOpenSubstitutePicker,
    handleSubstituteMaterial: stock.handleSubstituteMaterial,
    handleCancelStockAction: stock.handleCancelStockAction,
    fetchRecordHistory: sessions.fetchRecordHistory,
    openSessionDetail: sessions.openSessionDetail,
    handleEditSession: sessions.handleEditSession,
    handleDeleteSession: sessions.handleDeleteSession,
    fetchSessions: sessions.fetchSessions,
    exportHistory, importHistory, fetchData, getWorkingDays,
  };
}
