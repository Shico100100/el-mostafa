'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { useReactToPrint } from 'react-to-print';
import { Search, Plus, Printer, FileSpreadsheet, Trash2, DollarSign, Eye } from 'lucide-react';
import { useSetBackButton } from '@/components/BackButton';
import SearchableSelect from '@/components/ui/SearchableSelect';
import AttachmentSection from '@/components/ui/AttachmentSection';

interface Product {
    id: number;
    name: string;
    selling_price: number;
    stock_quantity: number;
    unit: string;
    type: string;
}

interface Customer {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
}

interface OrderItem {
    id: number;
    product_id: number;
    quantity: number;
    price: number;
    total: number;
    product?: Product;
}

interface Order {
    id: number;
    customer_id: number;
    total_amount: number;
    order_date?: string;
    created_at: string;
    status: string;
    notes?: string;
    customer?: Customer;
    items?: OrderItem[];
}

interface ManufacturingOrder {
    id: number;
    sales_order_id: number;
    product_id: number;
    quantity_required: number;
    quantity_produced: number;
    status: string;
    priority: string;
    product?: Product;
}

interface NewOrderItem {
    product_id: string;
    quantity: number;
    unit_price: number;
    discount: number;
}

export default function SalesOrdersPage() {
    const router = useRouter();
    useSetBackButton('/dashboard');
    const [orders, setOrders] = useState<Order[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    // Filter & Pagination States
    const [filters, setFilters] = useState({
        search: '',
        fromDate: '',
        toDate: '',
        page: 1,
        limit: 10,
    });
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Quick Customer State
    const [showQuickCustomerModal, setShowQuickCustomerModal] = useState(false);
    const [quickCustomerData, setQuickCustomerData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    });

        // Manufacturing Orders State
    const [manufacturingOrdersMap, setManufacturingOrdersMap] = useState<Record<number, ManufacturingOrder[]>>({});

    const handleSendToManufacturing = async (orderId: number) => {
        try {
            const mos = await api.createManufacturingOrdersFromSalesOrder(orderId) as ManufacturingOrder[];
            setManufacturingOrdersMap(prev => ({ ...prev, [orderId]: mos }));
        } catch (error) {
            console.error('Error creating manufacturing orders:', error);
        }
    };

    const loadManufacturingStatus = useCallback(async () => {
        try {
            const mos = await api.getManufacturingOrders() as ManufacturingOrder[];
            const map: Record<number, ManufacturingOrder[]> = {};
            for (const mo of mos) {
                if (!map[mo.sales_order_id]) map[mo.sales_order_id] = [];
                map[mo.sales_order_id].push(mo);
            }
            setManufacturingOrdersMap(map);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (!loading) loadManufacturingStatus();
    }, [loading, loadManufacturingStatus]);

    // New Order State
    const [newOrder, setNewOrder] = useState({
        customer_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [] as NewOrderItem[],
        discount_type: 'none' as 'none' | 'percentage' | 'fixed',
        discount_value: 0,
    });

    // Payment State
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Printing
    const componentRef = useRef<HTMLDivElement>(null);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Sales_Order_${orderToPrint?.id}`,
        onAfterPrint: () => setOrderToPrint(null),
    });

    useEffect(() => {
        if (orderToPrint && componentRef.current) {
            handlePrint();
        }
    }, [orderToPrint, handlePrint]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: filters.page.toString(),
                limit: filters.limit.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.fromDate && { fromDate: filters.fromDate }),
                ...(filters.toDate && { toDate: filters.toDate }),
            });

            const [ordersData, customersData, productsData] = await Promise.all([
                api.fetchWithAuth(`/sales/orders?${queryParams}`),
                api.fetchWithAuth('/sales/customers'),
                api.fetchWithAuth('/inventory/products'),
            ]);

            setOrders(ordersData.items || []);
            setTotalPages(ordersData.totalPages || 1);
            setTotalItems(ordersData.total || 0);

            setCustomers(sortAlphabetically(customersData, 'name'));
            setProducts(sortAlphabetically(productsData.filter((p: Product) => p.type === 'FINISHED' || p.type === 'SEMI'), 'name'));
        } catch (error) {
            console.error('Error loading data:', error);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
            return;
        }
        loadData();
    }, [router, loadData]);

    const handleAddItem = () => {
        setNewOrder({
            ...newOrder,
            items: [...newOrder.items, { product_id: '', quantity: 1, unit_price: 0, discount: 0 }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = newOrder.items.filter((_, i) => i !== index);
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const updatedItems = [...newOrder.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value } as NewOrderItem;

        if (field === 'product_id') {
            const product = products.find(p => p.id === Number(value));
            if (product) {
                updatedItems[index].unit_price = product.selling_price;
            }
        }

        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const calculateTotal = () => {
        const subtotal = newOrder.items.reduce((sum, item) => {
            const itemTotal = Number(item.quantity) * Number(item.unit_price);
            const itemDiscount = Number(item.discount) || 0;
            return sum + (itemTotal - itemDiscount);
        }, 0);

        let discount = 0;
        if (newOrder.discount_type === 'percentage') {
            discount = subtotal * (Number(newOrder.discount_value) / 100);
        } else if (newOrder.discount_type === 'fixed') {
            discount = Number(newOrder.discount_value);
        }

        return Math.max(0, subtotal - discount);
    };

    const handleQuickCustomerSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await api.fetchWithAuth('/sales/customers', {
                method: 'POST',
                body: JSON.stringify(quickCustomerData),
            });
            const customersData = await api.fetchWithAuth('/sales/customers');
            setCustomers(sortAlphabetically(customersData, 'name'));
            setNewOrder({ ...newOrder, customer_id: result.id });
            setShowQuickCustomerModal(false);
            setQuickCustomerData({ name: '', phone: '', email: '', address: '' });
            alert('تم إضافة العميل بنجاح');
        } catch (error) {
            console.error('Error adding customer:', error);
            alert('فشل إضافة العميل');
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderForPayment) return;
        try {
            await api.fetchWithAuth(`/sales/customers/${selectedOrderForPayment.customer_id}/payments`, {
                method: 'POST',
                body: JSON.stringify(paymentData),
            });
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
            setPaymentData({ amount: 0, payment_date: new Date().toISOString().split('T')[0], notes: '' });
            alert('تم تسجيل الدفعة بنجاح');
            loadData();
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('فشل تسجيل الدفعة');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const total_amount = calculateTotal();
        try {
            await api.fetchWithAuth('/sales/orders', {
                method: 'POST',
                body: JSON.stringify({
                    customer_id: parseInt(newOrder.customer_id),
                    total_amount,
                    order_date: newOrder.date,
                    notes: newOrder.notes,
                    items: newOrder.items.map(item => ({
                        product_id: parseInt(item.product_id),
                        quantity: item.quantity.toString(),
                        price: item.unit_price.toString(),
                        total: (item.quantity * item.unit_price).toString()
                    })),
                }),
            });
            setShowModal(false);
            setNewOrder({
                customer_id: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                items: [],
                discount_type: 'none',
                discount_value: 0,
            });

            loadData();
            alert('تم إنشاء أمر البيع بنجاح');
        } catch (error) {
            console.error('Error creating order:', error);
            alert('فشل إنشاء أمر البيع');
        }
    };

    const handleDuplicateOrder = async (order: Order) => {
        try {
            // Fetch order items
            const items = await api.fetchWithAuth(`/sales/orders/${order.id}/items`);

            // Populate the form with the order data
            setNewOrder({
                customer_id: order.customer_id.toString(),
                date: new Date().toISOString().split('T')[0],
                notes: `نسخة من الطلب رقم ${order.id}`,
                items: items.map((item: OrderItem) => ({
                    product_id: item.product_id.toString(),
                    quantity: item.quantity,
                    unit_price: item.price,
                    discount: 0
                })),
                discount_type: 'none',
                discount_value: 0,
            });

            setShowModal(true);
        } catch (error) {
            console.error('Error duplicating order:', error);
            alert('حدث خطأ أثناء نسخ الطلب');
        }
    };

    const handleExport = () => {
        api.exportSalesOrders();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">إدارة أوامر البيع</h1>
                    <div className="flex gap-4">
                        <button
                            onClick={handleExport}
                            className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-4 py-2 rounded-lg border border-emerald-500/30 transition flex items-center gap-2"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                            تصدير Excel
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/40"
                        >
                            <Plus className="w-5 h-5" />
                            أمر بيع جديد
                        </button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Filters */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">بحث بالعميل أو الملاحظات</label>
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="بحث..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">من تاريخ</label>
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value, page: 1 })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-400">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value, page: 1 })}
                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
                            />
                        </div>
                        <button
                            onClick={() => setFilters({ search: '', fromDate: '', toDate: '', page: 1, limit: 10 })}
                            className="bg-gray-700 hover:bg-gray-600 text-white py-2.5 rounded-xl transition text-sm font-medium"
                        >
                            إعادة ضبط
                        </button>
                    </div>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead className="bg-white/5 text-gray-300">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-sm">التاريخ</th>
                                    <th className="px-6 py-4 font-semibold text-sm">العميل</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">المبلغ</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">الحالة</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">التصنيع</th>
                                    <th className="px-6 py-4 font-semibold text-sm text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {loading ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400">جاري التحميل...</td></tr>
                                ) : orders.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium">لا توجد أوامر بيع حالياً</td></tr>
                                ) : (
                                    orders.map((order) => (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 text-gray-300">
                                                {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4 text-white font-medium">{order.customer?.name}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-lg font-bold text-blue-400">
                                                    {Number(order.total_amount).toLocaleString()}
                                                </span>
                                                <span className="text-xs text-gray-500 mr-1">ج.م</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' :
                                                    'bg-amber-500/20 text-amber-400'
                                                    }`}>
                                                    {order.status === 'COMPLETED' ? 'مكتمل' : 'قيد الانتظار'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {(() => {
                                                    const mos = manufacturingOrdersMap[order.id];
                                                    if (!mos || mos.length === 0) {
                                                        return (
                                                            <button
                                                                onClick={() => handleSendToManufacturing(order.id)}
                                                                className="px-3 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-lg hover:bg-indigo-500/30 transition"
                                                            >
                                                                إرسال للتصنيع
                                                            </button>
                                                        );
                                                    }
                                                    const allDone = mos.every((m: ManufacturingOrder) => m.status === 'COMPLETED');
                                                    const inProgress = mos.some((m: ManufacturingOrder) => m.status === 'IN_PROGRESS');
                                                    return (
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${allDone ? 'bg-emerald-500/20 text-emerald-400' : inProgress ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                                                            {allDone ? 'مكتمل' : inProgress ? 'قيد الإنتاج' : 'معلق'}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setShowDetailsModal(true);
                                                        }}
                                                        className="p-2 bg-blue-600/20 text-blue-400 rounded-lg hover:bg-blue-600/40 transition"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <Eye className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDuplicateOrder(order)}
                                                        className="p-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/40 transition"
                                                        title="نسخ الطلب"
                                                    >
                                                        📋
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrderForPayment(order);
                                                            setPaymentData({ ...paymentData, amount: Number(order.total_amount) });
                                                            setShowPaymentModal(true);
                                                        }}
                                                        className="p-2 bg-emerald-600/20 text-emerald-400 rounded-lg hover:bg-emerald-600/40 transition"
                                                        title="تسجيل دفعة"
                                                    >
                                                        <DollarSign className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setOrderToPrint(order);
                                                        }}
                                                        className="p-2 bg-slate-600/20 text-slate-400 rounded-lg hover:bg-slate-600/40 transition"
                                                        title="طباعة"
                                                    >
                                                        <Printer className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white/5 px-6 py-4 border-t border-white/10 flex justify-between items-center">
                        <div className="text-sm text-gray-400">
                            عرض {orders.length} من {totalItems} أمر بيع
                        </div>
                        <div className="flex gap-2">
                            <button
                                disabled={filters.page === 1}
                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50 transition"
                            >
                                السابق
                            </button>
                            <span className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold">{filters.page} / {totalPages}</span>
                            <button
                                disabled={filters.page >= totalPages}
                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-white disabled:opacity-50 transition"
                            >
                                التالي
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modals */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h2 className="text-2xl font-bold text-white">إنشاء أمر بيع جديد</h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white transition text-2xl">✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium text-gray-300">العميل</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowQuickCustomerModal(true)}
                                            className="text-xs text-blue-400 hover:text-blue-300 transition"
                                        >
                                            + إضافة عميل سريع
                                        </button>
                                    </div>
                                    <SearchableSelect
                                        options={customers.map(c => ({ value: c.id, label: c.name }))}
                                        value={newOrder.customer_id}
                                        onChange={(val) => setNewOrder({ ...newOrder, customer_id: val.toString() })}
                                        placeholder="اختر العميل..."
                                        className="w-full"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">تاريخ الطلب</label>
                                    <input
                                        type="date"
                                        value={newOrder.date}
                                        onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                                        required
                                        className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none transition"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300">ملاحظات</label>
                                <textarea
                                    value={newOrder.notes}
                                    onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                                    rows={2}
                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-blue-500 outline-none resize-none transition"
                                    placeholder="أدخل أي ملاحظات إضافية هنا..."
                                />
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/10 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">الأصناف المطلوبة</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 px-4 py-1.5 rounded-lg text-sm font-bold border border-blue-500/30 transition flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        إضافة صنف
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {newOrder.items.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-end">
                                            <div className="flex-1 min-w-[200px] space-y-2">
                                                <label className="text-xs text-gray-400 mr-2">المنتج</label>
                                                <SearchableSelect
                                                    options={products.map(p => ({ value: p.id, label: `${p.name} (متاح: ${p.stock_quantity})` }))}
                                                    value={item.product_id}
                                                    onChange={(val) => handleItemChange(index, 'product_id', val)}
                                                    placeholder="اختر المنتج..."
                                                    className="w-full"
                                                />
                                            </div>
                                            <div className="w-24 space-y-2">
                                                <label className="text-xs text-gray-400 mr-2">الكمية</label>
                                                <input
                                                    type="number"
                                                    value={item.quantity}
                                                    onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))}
                                                    required
                                                    min="1"
                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none text-sm transition"
                                                />
                                            </div>
                                            <div className="w-32 space-y-2">
                                                <label className="text-xs text-gray-400 mr-2">السعر</label>
                                                <input
                                                    type="number"
                                                    value={item.unit_price}
                                                    onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value))}
                                                    required
                                                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-white focus:border-blue-500 outline-none text-sm transition"
                                                />
                                            </div>
                                            <div className="w-32 pb-2 text-left text-blue-300 font-bold text-sm">
                                                {(Number(item.quantity) * Number(item.unit_price)).toLocaleString()}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition mb-1"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    {newOrder.items.length === 0 && (
                                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-white/5 rounded-2xl">
                                            لم يتم إضافة أي أصناف بعد
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center py-6 border-t border-white/10">
                                <div className="text-white">
                                    <span className="text-gray-400 ml-2">الإجمالي المستحق:</span>
                                    <span className="text-3xl font-bold text-blue-400">{calculateTotal().toLocaleString()}</span>
                                    <span className="text-sm text-gray-500 mr-1">ج.م</span>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowModal(false)}
                                        className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-bold"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={newOrder.items.length === 0}
                                        className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-900/40 transition disabled:opacity-50"
                                    >
                                        حفظ الطلب
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showDetailsModal && selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 max-h-[90vh] overflow-y-auto shadow-2xl space-y-8" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white">تفاصيل أمر البيع #{selectedOrder.id}</h2>
                                <p className="text-gray-400">بتاريخ {new Date(selectedOrder.order_date || selectedOrder.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                            <button onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }} className="text-gray-400 hover:text-white transition text-2xl">✕</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-white">بيانات العميل</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-2">
                                    <p className="text-white"><span className="text-gray-500 ml-2">الاسم:</span> {selectedOrder.customer?.name}</p>
                                    <p className="text-white"><span className="text-gray-500 ml-2">الهاتف:</span> {selectedOrder.customer?.phone || 'غير مسجل'}</p>
                                    <p className="text-white"><span className="text-gray-500 ml-2">العنوان:</span> {selectedOrder.customer?.address || 'غير مسجل'}</p>
                                </div>
                            </div>
                            <div className="space-y-4 text-left">
                                <h3 className="text-lg font-semibold text-white">القيم المالية</h3>
                                <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20">
                                    <p className="text-gray-400 text-sm">الإجمالي</p>
                                    <p className="text-3xl font-black text-blue-400">{Number(selectedOrder.total_amount).toLocaleString()} <span className="text-sm">ج.م</span></p>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">الأصناف</h3>
                            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                                <table className="w-full text-right">
                                    <thead className="bg-white/5 text-gray-400 text-xs">
                                        <tr><th className="px-4 py-3">الصنف</th><th className="px-4 py-3 text-center">الكمية</th><th className="px-4 py-3 text-center">السعر</th><th className="px-4 py-3 text-center">الإجمالي</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedOrder.items?.map((item: OrderItem) => (
                                            <tr key={item.id} className="text-sm">
                                                <td className="px-4 py-3 text-white font-medium">{item.product?.name}</td>
                                                <td className="px-4 py-3 text-center text-gray-300">{item.quantity} {item.product?.unit}</td>
                                                <td className="px-4 py-3 text-center text-gray-300">{Number(item.price).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center text-blue-300 font-bold">{Number(item.total).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {selectedOrder.notes && (
                            <div className="space-y-2">
                                <h3 className="text-sm font-semibold text-gray-400">ملاحظات</h3>
                                <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-gray-300 text-sm italic">{selectedOrder.notes}</div>
                            </div>
                        )}
                        <div className="border-t border-white/10 pt-6">
                            <AttachmentSection relatedType="SalesOrder" relatedId={selectedOrder.id} />
                        </div>
                        <div className="flex justify-end pt-4">
                            <button onClick={() => { setShowDetailsModal(false); setSelectedOrder(null); }} className="px-8 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition font-bold">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={() => { setShowPaymentModal(false); setSelectedOrderForPayment(null); }}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-white">تسجيل دفعة نقدية</h2>
                            <button onClick={() => { setShowPaymentModal(false); setSelectedOrderForPayment(null); }} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div><label className="block text-sm text-gray-400 mb-1">العميل</label><div className="text-white font-bold p-3 bg-white/5 rounded-xl border border-white/10">{selectedOrderForPayment?.customer?.name}</div></div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">قيمة الدفعة</label>
                                <input type="number" required value={paymentData.amount} onChange={(e) => setPaymentData({ ...paymentData, amount: parseFloat(e.target.value) })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white text-lg font-bold focus:border-emerald-500 outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">تاريخ التحصيل</label>
                                <input type="date" required value={paymentData.payment_date} onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-400 mb-1">ملاحظات</label>
                                <textarea value={paymentData.notes} onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-white outline-none resize-none transition" rows={2} />
                            </div>
                            <div className="flex gap-4 pt-4"><button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-emerald-900/40">تأكيد التحصيل</button></div>
                        </form>
                    </div>
                </div>
            )}

            {showQuickCustomerModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setShowQuickCustomerModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl animate-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white">إضافة عميل جديد سريع</h2>
                            <button onClick={() => setShowQuickCustomerModal(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <form onSubmit={handleQuickCustomerSubmit} className="space-y-4">
                            <input placeholder="اسم العميل *" required value={quickCustomerData.name} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, name: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition" />
                            <input placeholder="رقم الهاتف" value={quickCustomerData.phone} onChange={(e) => setQuickCustomerData({ ...quickCustomerData, phone: e.target.value })} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-blue-500 transition" />
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-900/40">حفظ العميل</button>
                        </form>
                    </div>
                </div>
            )}

            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="p-12 text-right" dir="rtl">
                    <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
                        <div><h1 className="text-3xl font-black mb-1">المصطفى للإنتاج</h1><p className="text-gray-600 font-bold">لصناعة الأجهزة الكهربائية</p></div>
                        <div className="text-left font-bold">
                            <h2 className="text-2xl font-black mb-2">فاتورة مبيعات</h2>
                            <p>رقم: <span className="font-mono">#{orderToPrint?.id}</span></p>
                            <p>تاريخ: {new Date(orderToPrint?.order_date || orderToPrint?.created_at || '').toLocaleDateString('ar-EG')}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 mb-12">
                        <div className="bg-slate-100 p-6 rounded-2xl"><h3 className="font-black text-gray-500 mb-2 border-b border-slate-300 pb-1">بيانات العميل</h3><p className="text-2xl font-black">{orderToPrint?.customer?.name}</p><p className="mt-1">{orderToPrint?.customer?.phone}</p><p>{orderToPrint?.customer?.address}</p></div>
                        <div className="bg-slate-100 p-6 rounded-2xl flex flex-col justify-center text-center border-R-4 border-slate-900"><p className="text-slate-500 font-bold mb-1">إجمالي الفاتورة</p><p className="text-4xl font-black">{Number(orderToPrint?.total_amount).toLocaleString()} ج.م</p></div>
                    </div>
                    <table className="w-full mb-8 border-collapse">
                        <thead><tr className="bg-slate-900 text-white"><th className="p-4 border border-slate-900">م</th><th className="p-4 border border-slate-900">الصنف / المنتج</th><th className="p-4 border border-slate-900">الكمية</th><th className="p-4 border border-slate-900">السعر</th><th className="p-4 border border-slate-900">الإجمالي</th></tr></thead>
                        <tbody>{orderToPrint?.items?.map((item: OrderItem, idx: number) => (<tr key={item.id}><td className="p-4 border border-slate-300 text-center">{idx + 1}</td><td className="p-4 border border-slate-300 font-bold">{item.product?.name}</td><td className="p-4 border border-slate-300 text-center">{item.quantity} {item.product?.unit || 'قطعة'}</td><td className="p-4 border border-slate-300 text-center">{Number(item.price).toLocaleString()}</td><td className="p-4 border border-slate-300 text-center font-bold">{(item.quantity * item.price).toLocaleString()}</td></tr>))}</tbody>
                    </table>
                    <div className="flex justify-end mt-12"><div className="w-80 space-y-4"><div className="flex justify-between items-center text-xl font-black bg-slate-900 text-white p-6 rounded-2xl"><span>الصافي المطلوب:</span><span>{Number(orderToPrint?.total_amount).toLocaleString()} ج.م</span></div></div></div>
                    {orderToPrint?.notes && (<div className="mt-12 p-6 bg-slate-50 rounded-2xl border-r-4 border-blue-500"><h4 className="font-black text-blue-900 mb-2">ملاحظات الفاتورة:</h4><p className="text-lg">{orderToPrint.notes}</p></div>)}
                    <div className="mt-24 grid grid-cols-2 text-center text-xl font-bold">
                        <div><p className="mb-20 text-slate-400">إمضاء المسؤول</p><div className="w-48 mx-auto border-t-2 border-slate-900 pt-2">ختم الشركة</div></div>
                        <div><p className="mb-20 text-slate-400">إمضاء المستلم</p><div className="w-48 mx-auto border-t-2 border-slate-900 pt-2">توقيع العميل</div></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
