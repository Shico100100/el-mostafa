'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { confirmDialog } from '@/lib/confirm-dialog';

interface Product {
    id: number;
    name: string;
    stock_quantity: number;
    selling_price: number;
}

interface Movement {
    id: number;
    date: string;
    type: string;
    quantity: number;
    notes?: string;
    warehouse?: {
        name: string;
    };
}

export default function ProductMovementsPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
    const [editData, setEditData] = useState({
        quantity: 0,
        type: '',
        notes: ''
    });

    const loadData = useCallback(async () => {
        try {
            const [productData, movementsData] = await Promise.all([
                api.fetchWithAuth(`/inventory/products/${productId}`),
                api.fetchWithAuth(`/inventory/products/${productId}/movements`)
            ]);
            setProduct(productData);
            setMovements(movementsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadData();
    }, [loadData, router]);

    const handleEditClick = (movement: Movement) => {
        setEditingMovement(movement);
        setEditData({
            quantity: movement.quantity,
            type: movement.type,
            notes: movement.notes || ''
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (!editingMovement) return;
            await api.fetchWithAuth(`/inventory/stock/movements/${editingMovement.id}`, {
                method: 'PUT',
                body: JSON.stringify(editData)
            });

            // Send notification to admin
            await api.createNotification({
                title: 'طلب الموافقة على تعديل حركة مخزون',
                message: `تم طلب تعديل حركة المخزون رقم ${editingMovement.id} للمنتج ${product?.name}`
            });

            toast.success('تم إرسال طلب التعديل للمدير');
            setShowEditModal(false);
            loadData();
        } catch (error) {
            console.error('Error updating movement:', error);
            toast.error('حدث خطأ أثناء التعديل');
        }
    };

    const handleDeleteMovement = async (movement: Movement) => {
        const typeLabel = movement.type === 'IN' ? 'إدخال' : movement.type === 'OUT' ? 'إخراج' : 'تعديل';
        confirmDialog({
            message: 'هل أنت متأكد من حذف حركة المخزون؟',
            description: `النوع: ${typeLabel}\nالكمية: ${movement.quantity}`,
            confirmLabel: 'حذف',
            danger: true,
            onConfirm: async () => {
                try {
                    if (!product) return;
                    // Send notification to admin for approval
                    await api.createNotification({
                        title: 'طلب حذف حركة مخزون',
                        message: `تم طلب حذف حركة المخزون رقم ${movement.id} للمنتج ${product.name} - الكمية: ${movement.quantity}`,
                        actionType: 'delete_movement',
                        actionData: { movementId: movement.id, productId: product.id }
                    });

                    toast.success('تم إرسال طلب الحذف للمدير للموافقة عليه');
                } catch (error) {
                    console.error('Error requesting deletion:', error);
                    toast.error('حدث خطأ أثناء إرسال الطلب');
                }
            },
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="text-white text-xl">جاري التحميل...</div>
            </div>
        );
    }

    return (
        <>
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">سجل حركات: {product?.name}</h1>
                    <button
                        onClick={() => router.push('/inventory/products')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl">
                        <h3 className="text-blue-200 mb-2">الكمية الحالية</h3>
                        <p className="text-3xl font-bold text-white">{product?.stock_quantity || 0}</p>
                    </div>
                    <div className="bg-purple-500/10 border border-purple-500/20 p-6 rounded-2xl">
                        <h3 className="text-purple-200 mb-2">إجمالي الحركات</h3>
                        <p className="text-3xl font-bold text-white">{movements.length}</p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-2xl">
                        <h3 className="text-green-200 mb-2">سعر البيع</h3>
                        <p className="text-3xl font-bold text-white">{product?.selling_price} ج.م</p>
                    </div>
                </div>

                {/* Movements Table */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-white/5">
                            <tr>
                                <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">النوع</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الكمية</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">المخزن</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">ملاحظات</th>
                                <th className="px-6 py-4 text-right text-white font-semibold">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movements.map((movement) => (
                                <tr key={movement.id} className="border-t border-white/10 hover:bg-white/5">
                                    <td className="px-6 py-4 text-gray-200">
                                        {new Date(movement.date).toLocaleDateString('ar-EG')}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-3 py-1 rounded-full text-sm ${movement.type === 'IN' ? 'bg-green-500/20 text-green-200' :
                                            movement.type === 'OUT' ? 'bg-red-500/20 text-red-200' :
                                                'bg-yellow-500/20 text-yellow-200'
                                            }`}>
                                            {movement.type === 'IN' ? 'إدخال' :
                                                movement.type === 'OUT' ? 'إخراج' : 'تعديل'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-200 font-semibold">{movement.quantity}</td>
                                    <td className="px-6 py-4 text-gray-300">{movement.warehouse?.name}</td>
                                    <td className="px-6 py-4 text-gray-300">{movement.notes || '-'}</td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => handleEditClick(movement)}
                                            className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded mr-2"
                                        >
                                            تعديل
                                        </button>
                                        <button
                                            onClick={() => handleDeleteMovement(movement)}
                                            className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded"
                                        >
                                            حذف
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {movements.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                        لا توجد حركات لهذا المنتج
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowEditModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تعديل حركة المخزون</h2>
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">الكمية</label>
                                <input
                                    type="number"
                                    value={editData.quantity}
                                    onChange={(e) => setEditData({ ...editData, quantity: Number(e.target.value) })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">النوع</label>
                                <select
                                    value={editData.type}
                                    onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                >
                                    <option value="IN">إدخال</option>
                                    <option value="OUT">إخراج</option>
                                    <option value="ADJUST">تعديل</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
                                <textarea
                                    value={editData.notes}
                                    onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700"
                                >
                                    حفظ التعديل
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
