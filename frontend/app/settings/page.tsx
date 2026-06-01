'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface User {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role?: {
        id: number;
        name: string;
    };
}

export default function SettingsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');

    const [backupLoading, setBackupLoading] = useState(false);
    const [restoreLoading, setRestoreLoading] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadUser();
    }, [router]);

    const loadUser = async () => {
        try {
            const userData = await api.getMe();
            setUser(userData);
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        if (!confirm('هل تريد إنشاء نسخة احتياطية الآن؟')) return;
        setBackupLoading(true);
        try {
            await api.createBackup();
            alert('تم إنشاء النسخة الاحتياطية بنجاح');
        } catch (error) {
            console.error('Backup failed:', error);
            alert('فشل إنشاء النسخة الاحتياطية');
        } finally {
            setBackupLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (user) {
                await api.updateUser(user.id, { password: newPassword });
                setShowPasswordModal(false);
                setNewPassword('');
                alert('تم تغيير كلمة المرور بنجاح');
            }
        } catch (error) {
            console.error('Password change failed:', error);
            alert('حدث خطأ أثناء تغيير كلمة المرور');
        }
    };

    const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!confirm('هل أنت متأكد أنك تريد استعادة النسخة الاحتياطية؟ سيتم استبدال جميع البيانات الحالية.')) {
            e.target.value = '';
            return;
        }

        setRestoreLoading(true);
        try {
            await api.restoreBackup(file);
            alert('تم استعادة النسخة الاحتياطية بنجاح. سيتم إعادة تحميل الصفحة.');
            window.location.reload();
        } catch (error: unknown) {
            console.error('Restore failed:', error);
            const message = error instanceof Error ? error.message : 'خطأ غير معروف';
            alert('فشل استعادة النسخة الاحتياطية: ' + message);
        } finally {
            setRestoreLoading(false);
            e.target.value = '';
        }
    };

    const handleFactoryReset = async () => {
        if (!confirm('تحذير هام جدًا: هل أنت متأكد أنك تريد حذف جميع البيانات؟\n(العملاء، المنتجات، المبيعات...)\nلا يمكن التراجع عن هذه الخطوة!')) return;
        if (!confirm('تأكيد نهائي: هل أنت متأكد تمامًا؟\nسيتم مسح قاعدة البيانات بالكامل وإعادة النظام للوضع الافتراضي.')) return;

        setResetLoading(true);
        try {
            await api.resetSystem();
            alert('تم إعادة تعيين النظام بنجاح. سيتم تسجيل الخروج.');
            localStorage.removeItem('token');
            window.location.href = '/login';
        } catch (error) {
            console.error('System reset failed:', error);
            alert('فشل إعادة تعيين النظام.');
            setResetLoading(false);
        }
    };

    const handleSyncMolds = async () => {
        if (!confirm('هل تريد مزامنة جميع الإسطمبات مع المخزن الآن؟ سيتم إنشاء أصناف جديدة لأي إسطمبة غير مضافة.')) return;
        setSyncLoading(true);
        try {
            const result = await api.syncMolds();
            alert(`تمت المزامنة بنجاح! تم معالجة ${result.processed_molds} إسطمبة.`);
        } catch (error: unknown) {
            console.error('Sync failed:', error);
            const message = error instanceof Error ? error.message : 'خطأ غير معروف';
            alert('فشل عملية المزامنة: ' + message);
        } finally {
            setSyncLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">معلومات النظام</h3>
                        <div className="space-y-3 text-gray-300">
                            <p><span className="text-white font-semibold">الإصدار:</span> 1.0.0</p>
                            <p><span className="text-white font-semibold">قاعدة البيانات:</span> PostgreSQL</p>
                            <p><span className="text-white font-semibold">الحالة:</span> <span className="text-green-400">نشط</span></p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">معلومات المستخدم</h3>
                        <div className="space-y-3 text-gray-300">
                            <p><span className="text-white font-semibold">الاسم:</span> {user?.firstName} {user?.lastName}</p>
                            <p><span className="text-white font-semibold">البريد الإلكتروني:</span> {user?.email}</p>
                            <p><span className="text-white font-semibold">الدور:</span> {user?.role?.name}</p>
                            <p><span className="text-white font-semibold">الصلاحيات:</span> {user?.role?.id === 1 ? 'كاملة' : 'محدودة'}</p>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">إعدادات عامة</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => setShowPasswordModal(true)}
                                className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition border border-blue-500/50 text-right"
                            >
                                تغيير كلمة المرور
                            </button>
                            <button
                                onClick={handleSyncMolds}
                                disabled={syncLoading}
                                className="w-full px-4 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg transition border border-indigo-500/50 text-right disabled:opacity-50"
                            >
                                {syncLoading ? 'جاري المزامنة...' : 'مزامنة الأصناف مع الإسطمبات'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
                        <h3 className="text-xl font-bold text-white mb-4">النسخ الاحتياطي</h3>
                        <div className="space-y-4">
                            <button
                                onClick={handleBackup}
                                disabled={backupLoading}
                                className="w-full px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition border border-green-500/50 text-right disabled:opacity-50"
                            >
                                {backupLoading ? 'جاري النسخ...' : 'إنشاء نسخة احتياطية'}
                            </button>
                            <label className={`w-full px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-lg transition border border-orange-500/50 text-right flex items-center justify-between cursor-pointer ${restoreLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                                <span>{restoreLoading ? 'جاري الاستعادة...' : 'استعادة نسخة احتياطية'}</span>
                                <input
                                    type="file"
                                    accept=".sql"
                                    onChange={handleRestore}
                                    className="hidden"
                                    disabled={restoreLoading}
                                />
                            </label>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-red-500/30">
                        <h3 className="text-xl font-bold text-red-400 mb-4">منطقة الخطر</h3>
                        <div className="space-y-4">
                            <button
                                onClick={handleFactoryReset}
                                disabled={resetLoading}
                                className="w-full px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-lg transition border border-red-500/50 text-right hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] disabled:opacity-50"
                            >
                                {resetLoading ? 'جاري الحذف...' : '⚠️ حذف جميع البيانات (ضبط المصنع)'}
                            </button>
                            <p className="text-xs text-red-400/60 mt-2 px-2">
                                * هذا الإجراء سيقوم بحذف كافة السجلات وإعادة النظام للبدء من الصفر.
                            </p>
                        </div>
                    </div>
                </div>

            </main >

            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPasswordModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تغيير كلمة المرور</h2>
                        <form onSubmit={handleChangePassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">كلمة المرور الجديدة</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                                >
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }
        </div >
    );
}
