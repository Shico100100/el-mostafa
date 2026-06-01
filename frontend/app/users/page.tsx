'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { usePermission } from '@/lib/usePermission';
import { sortAlphabetically } from '@/lib/sort-utils';
import { UserPlus, ArrowLeft, Edit, Trash2 } from 'lucide-react';

interface User {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: {
        id: number;
        name: string;
    };
    status: {
        id: number;
        name: string;
    };
}

export default function UsersPage() {
    const router = useRouter();
    const { isAdmin } = usePermission();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showRegisterDialog, setShowRegisterDialog] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: { id: 2 }, // Default to User
        status: { id: 1 } // Default to Active
    });
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const roles = sortAlphabetically([
        { id: 1, name: 'Admin', label: 'مدير نظام' },
        { id: 3, name: 'Manager', label: 'مدير' },
        { id: 4, name: 'Accountant', label: 'محاسب' },
        { id: 5, name: 'Storekeeper', label: 'أمين مخزن' },
        { id: 6, name: 'Worker', label: 'عامل' },
        { id: 2, name: 'User', label: 'مستخدم' },
    ], 'label');

    const loadUsers = useCallback(async () => {
        try {
            const data = await api.getUsers();
            setUsers(Array.isArray(data.data) ? data.data : []);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!loading && !isAdmin) {
            router.push('/dashboard');
            return;
        }
        loadUsers();
    }, [isAdmin, loading, router, loadUsers]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingUser) {
                await api.updateUser(editingUser.id, formData);
            } else {
                await api.createUser(formData);
            }
            setShowRegisterDialog(false);
            setEditingUser(null);
            setFormData({ email: '', password: '', firstName: '', lastName: '', role: { id: 2 }, status: { id: 1 } });
            loadUsers();
        } catch {
            alert('خطأ في حفظ البيانات');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟')) return;
        try {
            await api.deleteUser(id);
            loadUsers();
        } catch {
            alert('خطأ في الحذف');
        }
    };

    if (loading) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100" dir="rtl">
            <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => router.push('/dashboard')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                        <h1 className="text-2xl font-black text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">إدارة المستخدمين والصلاحيات</h1>
                    </div>
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({ email: '', password: '', firstName: '', lastName: '', role: { id: 2 }, status: { id: 1 } });
                            setShowRegisterDialog(true);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40"
                    >
                        <UserPlus className="w-5 h-5" />
                        إضافة مستخدم
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                <div className="glass rounded-2xl border border-white/10 overflow-hidden">
                    <table className="w-full text-right">
                        <thead className="bg-white/5 text-slate-300">
                            <tr>
                                <th className="px-6 py-4">الاسم</th>
                                <th className="px-6 py-4">البريد الإلكتروني</th>
                                <th className="px-6 py-4">الصلاحية</th>
                                <th className="px-6 py-4">الحالة</th>
                                <th className="px-6 py-4">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-white/5 transition">
                                    <td className="px-6 py-4 font-medium">{u.firstName} {u.lastName}</td>
                                    <td className="px-6 py-4 text-slate-400">{u.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${u.role.id === 1 ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                                            u.role.id === 3 ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                                'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                                            }`}>
                                            {roles.find(r => r.id === u.role.id)?.label || u.role.name}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`w-2 h-2 rounded-full inline-block ml-2 ${u.status.id === 1 ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        {u.status.id === 1 ? 'نشط' : 'معطل'}
                                    </td>
                                    <td className="px-6 py-4 flex gap-2">
                                        <button
                                            onClick={() => {
                                                setEditingUser(u);
                                                setFormData({
                                                    email: u.email,
                                                    password: '',
                                                    firstName: u.firstName,
                                                    lastName: u.lastName || '',
                                                    role: { id: u.role.id },
                                                    status: { id: u.status.id }
                                                });
                                                setShowRegisterDialog(true);
                                            }}
                                            className="p-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(u.id)}
                                            className="p-2 bg-rose-500/10 text-rose-400 rounded-lg hover:bg-rose-500/20 transition"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </main>

            {showRegisterDialog && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="glass p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6">
                            {editingUser ? 'تعديل بيانات المستخدم' : 'إنشاء مستخدم جديد'}
                        </h2>
                        <form onSubmit={handleSave} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-400">الاسم الأول</label>
                                    <input
                                        className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 transition outline-none"
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm text-slate-400">اسم العائلة</label>
                                    <input
                                        className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 transition outline-none"
                                        value={formData.lastName}
                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 transition outline-none"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">كلمة المرور {editingUser && '(اتركها فارغة لعدم التغيير)'}</label>
                                <input
                                    type="password"
                                    className="w-full p-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:border-blue-500/50 transition outline-none"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-sm text-slate-400">الصلاحية</label>
                                <select
                                    className="w-full p-2.5 bg-slate-800 border border-white/10 rounded-xl text-white focus:border-blue-500/50 transition outline-none"
                                    value={formData.role.id}
                                    onChange={e => setFormData({ ...formData, role: { id: parseInt(e.target.value) } })}
                                >
                                    {roles.map(r => (
                                        <option key={r.id} value={r.id}>{r.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-3 justify-end mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowRegisterDialog(false)}
                                    className="px-6 py-2.5 text-slate-300 hover:bg-white/5 rounded-xl transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20"
                                >
                                    حفظ
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
