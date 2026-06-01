'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useSetBackButton } from '@/components/BackButton';
import ExcelActions from '@/components/ExcelActions';

interface Machine {
    id: number;
    name: string;
    serial_number: string;
    status: string;
    total_hours: number;
    power_consumption: number;
    notes: string;
    purchase_date?: string;
    last_maintenance?: string;
    next_maintenance?: string;
}

interface OverviewResponse {
    machines: Machine[];
    pagination: { total: number; page: number; limit: number };
}

export default function MachinesPage() {
    const router = useRouter();
    useSetBackButton('/manufacturing');
    const [machines, setMachines] = useState<Machine[]>([]);
    const [totalMachines, setTotalMachines] = useState(0);
    const [overdueCount, setOverdueCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
    const [formError, setFormError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    const loadMachines = useCallback(async (search?: string, status?: string, page?: number) => {
        try {
            const params = new URLSearchParams();
            if (search) params.set('search', search);
            if (status) params.set('status', status);
            if (page) params.set('page', String(page));
            params.set('limit', String(ITEMS_PER_PAGE));
            const qs = params.toString();
            const data = await api.fetchWithAuth<OverviewResponse & { stats: { overdueCount: number } }>(`/manufacturing/machines/overview${qs ? '?' + qs : ''}`);
            setMachines(data.machines);
            setTotalMachines(data.pagination.total);
            setOverdueCount(data.stats.overdueCount);
        } catch (error) {
            toast.error('فشل تحميل الماكينات');
            console.error('Error loading machines:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadMachines(searchQuery, statusFilter, currentPage);
    }, [router, loadMachines, searchQuery, statusFilter, currentPage]);

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (value: string) => {
        setStatusFilter(value);
        setCurrentPage(1);
    };

    const totalPages = Math.ceil(totalMachines / ITEMS_PER_PAGE);

    const validateForm = (data: Record<string, FormDataEntryValue | null>): Record<string, string> => {
        const errors: Record<string, string> = {};
        const name = data.name?.toString().trim();
        const serial_number = data.serial_number?.toString().trim();
        const power_consumption = data.power_consumption?.toString();
        const status = data.status?.toString();

        if (!name) {
            errors.name = 'اسم الماكينة مطلوب';
        } else if (name.length < 2) {
            errors.name = 'اسم الماكينة يجب أن يكون حرفين على الأقل';
        }

        if (!serial_number) {
            errors.serial_number = 'الرقم التسلسلي مطلوب';
        }

        if (power_consumption && isNaN(Number(power_consumption))) {
            errors.power_consumption = 'الطاقة يجب أن تكون رقماً';
        }

        if (!status) {
            errors.status = 'الحالة مطلوبة';
        }

        return errors;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        setFormErrors({});

        const formData = new FormData(e.currentTarget);
        const data = {
            name: formData.get('name'),
            serial_number: formData.get('serial_number'),
            purchase_date: formData.get('purchase_date'),
            status: formData.get('status'),
            power_consumption: formData.get('power_consumption'),
            notes: formData.get('notes'),
        };

        const errors = validateForm(data);
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (editingMachine) {
                const updated = await api.fetchWithAuth<Machine>(`/manufacturing/machines/${editingMachine.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(data),
                });
                setMachines(prev => prev.map(m => m.id === editingMachine.id ? { ...m, ...updated } : m));
            } else {
                const created = await api.fetchWithAuth<Machine>('/manufacturing/machines', {
                    method: 'POST',
                    body: JSON.stringify(data),
                });
                setMachines(prev => [created, ...prev]);
                setTotalMachines(prev => prev + 1);
            }
            setShowModal(false);
            setEditingMachine(null);
            setFormError(null);
            setFormErrors({});
            toast.success(editingMachine ? 'تم تحديث الماكينة بنجاح' : 'تم إضافة الماكينة بنجاح');
        } catch (error: unknown) {
            const err = error as Error & { data?: unknown; status?: number };
            const errorData = err.data;
            let errorMessage = 'حدث خطأ أثناء حفظ الماكينة. تأكد من الاتصال بالخادم.';

            if (errorData && typeof errorData === 'object') {
                const payload = errorData as { message?: string; error?: string };
                if (payload.message) {
                    errorMessage = payload.message;
                } else if (payload.error) {
                    errorMessage = payload.error;
                }
            }

            setFormError(errorMessage);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-500/20 text-green-200';
            case 'MAINTENANCE': return 'bg-yellow-500/20 text-yellow-200';
            case 'BROKEN': return 'bg-red-500/20 text-red-200';
            default: return 'bg-gray-500/20 text-gray-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'نشطة';
            case 'MAINTENANCE': return 'صيانة';
            case 'BROKEN': return 'معطلة';
            case 'INACTIVE': return 'غير نشطة';
            default: return status;
        }
    };

    const getMaintenanceDays = (m: Machine): { days: number; isOverdue: boolean } | null => {
        if (!m.next_maintenance) return null;
        const nextDate = new Date(m.next_maintenance);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        nextDate.setHours(0, 0, 0, 0);
        const diffTime = nextDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            return { days: Math.abs(diffDays), isOverdue: true };
        }
        return { days: diffDays, isOverdue: false };
    };

    const overdueMachines = machines.filter(m => {
        const st = getMaintenanceDays(m);
        return st && st.isOverdue;
    });

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">🏭 إدارة الماكينات</h1>
                    <div className="flex gap-3 items-center">
                        <ExcelActions
                            exportUrl="/manufacturing/export/machines"
                            importUrl="/manufacturing/import/machines"
                            fileName="machines.xlsx"
                            onImportSuccess={loadMachines}
                        />
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder="بحث بالاسم أو الرقم التسلسلي..."
                            value={searchQuery}
                            onChange={(e) => handleSearchChange(e.target.value)}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                    >
                        <option value="">كل الحالات</option>
                        <option value="ACTIVE">نشطة</option>
                        <option value="INACTIVE">غير نشطة</option>
                        <option value="MAINTENANCE">صيانة</option>
                        <option value="BROKEN">معطلة</option>
                    </select>
                    <button
                        onClick={() => {
                            setEditingMachine(null);
                            setFormError(null);
                            setFormErrors({});
                            setShowModal(true);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition"
                    >
                        + إضافة ماكينة
                    </button>
                </div>

                {overdueCount > 0 && (
                    <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">⚠️</span>
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-200 mb-2">تنبيه: ماكينات تحتاج صيانة عاجلة!</h3>
                                <p className="text-red-300 mb-3">يوجد {overdueCount} ماكينة متأخرة في الصيانة:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {overdueMachines.slice(0, 4).map(m => (
                                        <div key={m.id} className="bg-red-500/10 rounded-lg p-3 flex justify-between items-center">
                                            <div>
                                                <span className="text-white font-medium">{m.name}</span>
                                                <span className="text-red-300 text-sm mr-2">متأخر {getMaintenanceDays(m)?.days} يوم</span>
                                            </div>
                                            <button
                                                onClick={() => router.push(`/manufacturing/machines/${m.id}/maintenance`)}
                                                className="px-3 py-1 bg-red-500/30 hover:bg-red-500/50 text-red-200 text-sm rounded-lg transition"
                                            >
                                                صيانة
                                            </button>
                                        </div>
                                    ))}
                                    {overdueCount > 4 && (
                                        <div className="col-span-full text-center text-red-300 text-sm">
                                            + {overdueCount - 4} ماكينات أخرى
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {machines.map((machine) => {
                        const maintenanceStatus = getMaintenanceDays(machine);
                        return (
                            <div key={machine.id} className={`bg-white/10 backdrop-blur-lg p-6 rounded-2xl border ${maintenanceStatus?.isOverdue ? 'border-red-500/50' : 'border-white/20'} relative`}>
                                {maintenanceStatus?.isOverdue && (
                                    <div className="absolute -top-2 -right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                        صيانة متأخرة {maintenanceStatus.days} يوم
                                    </div>
                                )}
                                {!maintenanceStatus?.isOverdue && maintenanceStatus && maintenanceStatus.days <= 7 && !maintenanceStatus.isOverdue && (
                                    <div className="absolute -top-2 -right-2 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                                        مستحقة خلال {maintenanceStatus.days} يوم
                                    </div>
                                )}
                                <h3 className="text-xl font-bold text-white mb-3">{machine.name}</h3>
                                <div className="space-y-2 mb-4">
                                    <p className="text-gray-300 text-sm">الرقم التسلسلي: {machine.serial_number || '-'}</p>
                                    <p className="text-gray-300 text-sm">ساعات التشغيل: {machine.total_hours || 0} ساعة</p>
                                    <span className={`inline-block px-3 py-1 rounded-full text-sm ${getStatusColor(machine.status)}`}>
                                        {getStatusText(machine.status)}
                                    </span>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3 mb-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-gray-400 text-xs">آخر صيانة:</span>
                                        <span className="text-gray-200 text-sm">{machine.last_maintenance ? new Date(machine.last_maintenance).toLocaleDateString('ar-EG') : 'غير محدد'}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400 text-xs">الصيانة القادمة:</span>
                                        <span className={`text-sm ${maintenanceStatus?.isOverdue ? 'text-red-400 font-medium' : maintenanceStatus && maintenanceStatus.days <= 7 ? 'text-yellow-400 font-medium' : 'text-gray-200'}`}>
                                            {machine.next_maintenance ? new Date(machine.next_maintenance).toLocaleDateString('ar-EG') : 'غير محدد'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            setEditingMachine(machine);
                                            setFormError(null);
                                            setFormErrors({});
                                            setShowModal(true);
                                        }}
                                        className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded"
                                    >
                                        تعديل
                                    </button>
                                    <button
                                        onClick={() => router.push(`/manufacturing/machines/${machine.id}`)}
                                        className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded"
                                    >
                                        السجل
                                    </button>
                                    <button
                                        onClick={() => router.push(`/manufacturing/machines/${machine.id}/maintenance`)}
                                        className="flex-1 px-3 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 rounded"
                                    >
                                        الصيانة
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {machines.length === 0 && (
                        <div className="col-span-full text-center text-gray-400 py-12">
                            {searchQuery || statusFilter ? 'لا توجد نتائج للبحث' : 'لا توجد ماكينات. قم بإضافة ماكينة جديدة.'}
                        </div>
                    )}
                </div>
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            السابق
                        </button>
                        <span className="text-white">
                            صفحة {currentPage} من {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            التالي
                        </button>
                    </div>
                )}
            </main>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => { setShowModal(false); setFormError(null); setFormErrors({}); }}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingMachine ? 'تعديل ماكينة' : 'إضافة ماكينة جديدة'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {formError && (
                                <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg text-sm">
                                    {formError}
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">اسم الماكينة</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={editingMachine?.name}
                                    required
                                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.name ? 'border-red-500' : 'border-white/20'}`}
                                />
                                {formErrors.name && (
                                    <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الرقم التسلسلي</label>
                                <input
                                    name="serial_number"
                                    type="text"
                                    defaultValue={editingMachine?.serial_number}
                                    required
                                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.serial_number ? 'border-red-500' : 'border-white/20'}`}
                                />
                                {formErrors.serial_number && (
                                    <p className="text-red-400 text-xs mt-1">{formErrors.serial_number}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الطاقة (كيلو وات/ساعة)</label>
                                <input
                                    name="power_consumption"
                                    type="number"
                                    step="0.01"
                                    defaultValue={editingMachine?.power_consumption}
                                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.power_consumption ? 'border-red-500' : 'border-white/20'}`}
                                />
                                {formErrors.power_consumption && (
                                    <p className="text-red-400 text-xs mt-1">{formErrors.power_consumption}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الحالة</label>
                                <select
                                    name="status"
                                    defaultValue={editingMachine?.status || 'ACTIVE'}
                                    className={`w-full px-4 py-2 bg-white/10 border rounded-lg text-white ${formErrors.status ? 'border-red-500' : 'border-white/20'}`}
                                >
                                    <option value="ACTIVE">نشطة</option>
                                    <option value="INACTIVE">غير نشطة</option>
                                    <option value="MAINTENANCE">صيانة</option>
                                    <option value="BROKEN">معطلة</option>
                                </select>
                                {formErrors.status && (
                                    <p className="text-red-400 text-xs mt-1">{formErrors.status}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">تاريخ الشراء</label>
                                <input
                                    name="purchase_date"
                                    type="date"
                                    defaultValue={editingMachine?.purchase_date?.split('T')[0] || ''}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
                                <textarea
                                    name="notes"
                                    defaultValue={editingMachine?.notes}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingMachine(null);
                                        setFormError(null);
                                        setFormErrors({});
                                    }}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700"
                                >
                                    {editingMachine ? 'تحديث' : 'إضافة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
