'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { sortAlphabetically } from '@/lib/sort-utils';
import { useReactToPrint } from 'react-to-print';
import * as XLSX from 'xlsx';

interface Supplier {
    id: number;
    name: string;
    phone?: string;
    address?: string;
}

interface Product {
    id: number;
    name: string;
    unit?: string;
    type: string;
    stock_quantity: number;
    min_stock?: number;
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
    supplier_id: number;
    total_amount: number;
    order_date?: string;
    created_at: string;
    invoice_number?: string;
    notes?: string;
    supplier?: Supplier;
    items?: OrderItem[];
}

interface NewOrderItem {
    product_id: string;
    quantity: number;
    price: number;
}

interface LandedCostBreakdownItem {
    item_id?: number;
    product_name: string;
    quantity: number;
    base_cost_egp: number;
    commission: number;
    customs: number;
    shipping: number;
    unit_landed_cost: number;
    total_landed_cost: number;
}

interface LandedCostData {
    total_landed_cost: number;
    fx_rate: number;
    freight_cost?: number;
    total_weight_kg: number;
    breakdown: LandedCostBreakdownItem[];
}

export default function PurchaseOrdersPage() {
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [selectedOrderForPayment, setSelectedOrderForPayment] = useState<Order | null>(null);

    // Quick Product States
    const [showQuickProductModal, setShowQuickProductModal] = useState(false);
    const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);
    const [quickProductData, setQuickProductData] = useState({
        name: '',
        unit: 'kg',
    });

    // Low stock alert
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [showLowStockAlert, setShowLowStockAlert] = useState(true);

    // Filters & Pagination
    const [filters, setFilters] = useState({
        search: '',
        fromDate: '',
        toDate: '',
        page: 1,
        limit: 10,
    });
    const [totalPages, setTotalPages] = useState(1);

    // States for smooth typing (local cache for inputs)
    const [typingValues, setTypingValues] = useState<{ [key: string]: string }>({});

    // New Order State
    const [newOrder, setNewOrder] = useState({
        supplier_id: '',
        date: new Date().toISOString().split('T')[0],
        invoice_number: '',
        notes: '',
        items: [] as NewOrderItem[],
    });

    // Payment State
    const [paymentData, setPaymentData] = useState({
        amount: 0,
        payment_date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    // Landed Cost State
    const [showLandedCostModal, setShowLandedCostModal] = useState(false);
    const [landedCostOrderId, setLandedCostOrderId] = useState<number | null>(null);
    const [landedCostData, setLandedCostData] = useState<LandedCostData | null>(null);
    const [landedCostForm, setLandedCostForm] = useState({
        freight_cost: 0,
        customs_percent: 0,
        commission_percent: 0,
        total_weight_kg: 0,
    });
    const [calculatingLandedCost, setCalculatingLandedCost] = useState(false);

    // Packing List State
    const [showPackingListModal, setShowPackingListModal] = useState(false);
    const [packingListOrderId, setPackingListOrderId] = useState<number | null>(null);
    const [packingListForm, setPackingListForm] = useState({
        carton_length_cm: '',
        carton_width_cm: '',
        carton_height_cm: '',
        cartons_count: '1',
        actual_net_weight_kg: '',
        actual_gross_weight_kg: '',
        deviation_threshold_percent: '5',
        notes: '',
    });
    const [packingListResult, setPackingListResult] = useState<Record<string, unknown> | null>(null);
    const [savingPackingList, setSavingPackingList] = useState(false);

    // Printing
    const componentRef = useRef<HTMLDivElement>(null);
    const [orderToPrint, setOrderToPrint] = useState<Order | null>(null);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `Puchase_Order_${orderToPrint?.id}`,
        onAfterPrint: () => setOrderToPrint(null),
    });

    // Effect to trigger print when orderToPrint is set
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

            const [ordersData, suppliersData, productsData] = await Promise.all([
                api.fetchWithAuth(`/purchases/orders?${queryParams}`),
                api.fetchWithAuth('/purchases/suppliers'),
                api.fetchWithAuth('/inventory/products'),
            ]);

            setOrders(ordersData.items || []);
            setTotalPages(ordersData.totalPages || 1);

            setSuppliers(sortAlphabetically(suppliersData, 'name'));
            setProducts(sortAlphabetically(productsData.filter((p: Product) => p.type === 'RAW'), 'name')); // Filter for Raw Materials and sort

            // Fetch low stock products
            const lowStockData = await api.fetchWithAuth('/inventory/products?lowStock=true&type=RAW');
            const lowStockList = lowStockData.data || lowStockData || [];
            setLowStockProducts(lowStockList.slice(0, 5)); // Show top 5
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
            items: [...newOrder.items, { product_id: '', quantity: 1, price: 0 }]
        });
    };

    const handleRemoveItem = (index: number) => {
        const updatedItems = newOrder.items.filter((_, i) => i !== index);
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const handleItemChange = (index: number, field: string, value: string | number) => {
        const updatedItems = [...newOrder.items];
        updatedItems[index] = { ...updatedItems[index], [field]: value } as NewOrderItem;
        setNewOrder({ ...newOrder, items: updatedItems });
    };

    const handleItemTotalChange = (index: number, totalValue: string) => {
        const updatedItems = [...newOrder.items];
        const item = updatedItems[index];
        const quantity = Number(item.quantity) || 1;

        const total = totalValue === '' ? 0 : Number(totalValue);

        // Calculate unit price based on total and quantity
        const unitPrice = total / quantity;

        updatedItems[index] = {
            ...item,
            price: unitPrice
        };
        setNewOrder({ ...newOrder, items: updatedItems });

        // Clear typing cache after calculation
        const newTyping = { ...typingValues };
        delete newTyping[`${index}-total`];
        setTypingValues(newTyping);
    };

    const handleTypedChange = (index: number, field: string, value: string) => {
        setTypingValues({ ...typingValues, [`${index}-${field}`]: value });

        // For quantity and price, we still want reactive updates for the total
        // but we'll update the main state without rounding
        if (field === 'quantity' || field === 'price') {
            const updatedItems = [...newOrder.items];
            updatedItems[index] = { ...updatedItems[index], [field]: value };
            setNewOrder({ ...newOrder, items: updatedItems });
        }
    };

    const calculateTotal = () => {
        return newOrder.items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.price)), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const totalAmount = calculateTotal();
            const formattedItems = newOrder.items.map(item => ({
                ...item,
                price: Number(item.price),
                quantity: Number(item.quantity),
                total: Number(item.price) * Number(item.quantity)
            }));

            const payload = {
                supplier_id: Number(newOrder.supplier_id),
                total_amount: totalAmount,
                notes: newOrder.notes,
                invoice_number: newOrder.invoice_number,
                order_date: newOrder.date,
                items: formattedItems,
            };

            if (editingOrder) {
                // Update existing order
                await api.fetchWithAuth(`/purchases/orders/${editingOrder.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
                alert('تم تحديث أمر الشراء بنجاح');
            } else {
                // Create new order
                await api.fetchWithAuth('/purchases/orders', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
                alert('تم حفظ أمر الشراء بنجاح');
            }

            setShowModal(false);
            setEditingOrder(null);
            setNewOrder({
                supplier_id: '',
                date: new Date().toISOString().split('T')[0],
                invoice_number: '',
                notes: '',
                items: [],
            });
            loadData();
        } catch (error) {
            console.error('Error saving order:', error);
            alert('حدث خطأ أثناء حفظ الأمر. تأكد من ملء جميع البيانات.');
        }
    };

    const handleEditOrder = async (order: Order) => {
        try {
            // Fetch order items
            const items = await api.fetchWithAuth(`/purchases/orders/${order.id}/items`);

            setEditingOrder(order);
            setNewOrder({
                supplier_id: order.supplier_id.toString(),
                date: order.order_date ? new Date(order.order_date).toISOString().split('T')[0] : new Date(order.created_at).toISOString().split('T')[0],
                invoice_number: order.invoice_number || '',
                notes: order.notes || '',
                items: items.map((item: OrderItem) => ({
                    product_id: item.product_id.toString(),
                    quantity: item.quantity,
                    price: item.price
                }))
            });
            setShowModal(true);
        } catch (error) {
            console.error('Error loading order details:', error);
            alert('حدث خطأ أثناء تحميل بيانات الأمر');
        }
    };

    const handleDeleteOrder = async (order: Order) => {
        if (!confirm(`هل أنت متأكد من حذف أمر الشراء رقم ${order.id}؟\nسيتم عكس جميع الحركات المخزنية.`)) {
            return;
        }

        try {
            await api.fetchWithAuth(`/purchases/orders/${order.id}`, {
                method: 'DELETE'
            });

            // Send notification to admin
            await api.createNotification({
                title: 'طلب حذف أمر شراء',
                message: `تم طلب حذف أمر الشراء رقم ${order.id} بمبلغ ${order.total_amount} جنيه`,
            });

            alert('تم حذف أمر الشراء بنجاح');
            loadData();
        } catch (error) {
            console.error('Error deleting order:', error);
            alert('حدث خطأ أثناء حذف الأمر');
        }
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrderForPayment) return;
        try {
            await api.fetchWithAuth(`/purchases/suppliers/${selectedOrderForPayment.supplier_id}/payments`, {
                method: 'POST',
                body: JSON.stringify(paymentData)
            });
            alert('تم تسجيل الدفعة بنجاح');
            setShowPaymentModal(false);
            setSelectedOrderForPayment(null);
            setPaymentData({
                amount: 0,
                payment_date: new Date().toISOString().split('T')[0],
                notes: '',
            });
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('حدث خطأ أثناء تسجيل الدفعة');
        }
    };

    const openPaymentModal = (order: Order) => {
        setSelectedOrderForPayment(order);
        setPaymentData({
            ...paymentData,
            amount: Number(order.total_amount),
            notes: `سداد عن أمر شراء رقم ${order.id}${order.invoice_number ? ' - فاتورة رقم ' + order.invoice_number : ''}`
        });
        setShowPaymentModal(true);
    };

    const openPackingList = async (order: Order) => {
        setPackingListOrderId(order.id);
        setPackingListForm({
            carton_length_cm: '',
            carton_width_cm: '',
            carton_height_cm: '',
            cartons_count: '1',
            actual_net_weight_kg: '',
            actual_gross_weight_kg: '',
            deviation_threshold_percent: '5',
            notes: '',
        });
        setPackingListResult(null);
        try {
            const data = await api.getPackingList(order.id);
            if (data) {
                setPackingListForm({
                    carton_length_cm: String(data.carton_length_cm || ''),
                    carton_width_cm: String(data.carton_width_cm || ''),
                    carton_height_cm: String(data.carton_height_cm || ''),
                    cartons_count: String(data.cartons_count || '1'),
                    actual_net_weight_kg: String(data.actual_net_weight_kg || ''),
                    actual_gross_weight_kg: String(data.actual_gross_weight_kg || ''),
                    deviation_threshold_percent: String(data.deviation_threshold_percent || '5'),
                    notes: data.notes || '',
                });
            }
        } catch {
            // No existing packing list
        }
        setShowPackingListModal(true);
    };

    const handleSavePackingList = async () => {
        if (!packingListOrderId) return;
        setSavingPackingList(true);
        try {
            const result = await api.savePackingList(packingListOrderId, {
                carton_length_cm: Number(packingListForm.carton_length_cm),
                carton_width_cm: Number(packingListForm.carton_width_cm),
                carton_height_cm: Number(packingListForm.carton_height_cm),
                cartons_count: Number(packingListForm.cartons_count),
                actual_net_weight_kg: packingListForm.actual_net_weight_kg ? Number(packingListForm.actual_net_weight_kg) : undefined,
                actual_gross_weight_kg: packingListForm.actual_gross_weight_kg ? Number(packingListForm.actual_gross_weight_kg) : undefined,
                deviation_threshold_percent: Number(packingListForm.deviation_threshold_percent),
                notes: packingListForm.notes || undefined,
            });
            setPackingListResult(result);
        } catch (error) {
            console.error('Failed to save packing list:', error);
        } finally {
            setSavingPackingList(false);
        }
    };

    const openLandedCost = async (order: Order) => {
        setLandedCostOrderId(order.id);
        setLandedCostForm({
            freight_cost: 0,
            customs_percent: 0,
            commission_percent: 0,
            total_weight_kg: 0,
        });
        setLandedCostData(null);
        try {
            const data = await api.getLandedCost(order.id);
            setLandedCostData(data);
            setLandedCostForm({
                freight_cost: data.freight_cost || 0,
                customs_percent: data.customs_percent || 0,
                commission_percent: data.commission_percent || 0,
                total_weight_kg: data.total_weight_kg || 0,
            });
        } catch {
            // No landed cost data yet
        }
        setShowLandedCostModal(true);
    };

    const handleUpdateLandedCost = async () => {
        if (!landedCostOrderId) return;
        setCalculatingLandedCost(true);
        try {
            const result = await api.updateLandedCost(landedCostOrderId, landedCostForm);
            setLandedCostData(result);
        } catch (error) {
            console.error('Failed to update landed cost:', error);
        } finally {
            setCalculatingLandedCost(false);
        }
    };

    const preparePrint = async (order: Order) => {
        try {
            const items = await api.fetchWithAuth(`/purchases/orders/${order.id}/items`);
            setOrderToPrint({ ...order, items });
        } catch (error) {
            console.error("Error fetching items for print:", error);
            alert("حدث خطأ أثناء تجهيز الطباعة");
        }
    };

    const handleQuickProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const newProduct = await api.fetchWithAuth('/inventory/products', {
                method: 'POST',
                body: JSON.stringify({
                    ...quickProductData,
                    type: 'RAW',
                    cost_price: 0,
                    selling_price: 0,
                }),
            });

            // Reload products and sort
            const productsData = await api.fetchWithAuth('/inventory/products') as Product[];
            const sortedProducts = sortAlphabetically(productsData.filter((p) => p.type === 'RAW'), 'name');
            setProducts(sortedProducts);

            // Automatically select the new product for the active row
            if (activeItemIndex !== null) {
                handleItemChange(activeItemIndex, 'product_id', newProduct.id.toString());
            }

            setShowQuickProductModal(false);
            setQuickProductData({ name: '', unit: 'kg' });
            setActiveItemIndex(null);
        } catch (error) {
            console.error('Error creating quick product:', error);
            alert('حدث خطأ أثناء إضافة الصنف');
        }
    };
    const exportToExcel = () => {
        const exportData = orders.map(order => ({
            'رقم الأمر': order.id,
            'رقم الفاتورة': order.invoice_number || '-',
            'التاريخ': new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG'),
            'المورد': order.supplier?.name || 'غير معروف',
            'الإجمالي': Number(order.total_amount),
            'ملاحظات': order.notes || '',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Purchase Orders");
        XLSX.writeFile(wb, `Purchase_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
            <header className="bg-white/10 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-white">أوامر الشراء</h1>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                    >
                        العودة للرئيسية
                    </button>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8">
                {/* Search and Filter Section */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-end">
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                        <div className="flex-1">
                            <label className="block text-gray-300 text-sm mb-1">بحث (المورد أو رقم الفاتورة)</label>
                            <input
                                type="text"
                                placeholder="بحث..."
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm mb-1">من تاريخ</label>
                            <input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value, page: 1 })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-gray-300 text-sm mb-1">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => setFilters({ ...filters, toDate: e.target.value, page: 1 })}
                                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={exportToExcel}
                            className="px-6 py-2 h-[42px] bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition flex items-center gap-2"
                        >
                            📊 تصدير Excel
                        </button>
                        <button
                            onClick={() => {
                                setEditingOrder(null);
                                setNewOrder({
                                    supplier_id: '',
                                    date: new Date().toISOString().split('T')[0],
                                    invoice_number: '',
                                    notes: '',
                                    items: [],
                                });
                                setShowModal(true);
                            }}
                            className="px-6 py-2 h-[42px] bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-teal-700 transition"
                        >
                            + أمر شراء جديد
                        </button>
                    </div>
                </div>

                {/* Low Stock Alert */}
                {lowStockProducts.length > 0 && showLowStockAlert && (
                    <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/30 rounded-2xl p-6 mb-6 relative">
                        <button
                            onClick={() => setShowLowStockAlert(false)}
                            className="absolute top-4 left-4 text-gray-400 hover:text-white transition"
                        >
                            ✕
                        </button>
                        <div className="flex items-start gap-4">
                            <div className="text-4xl">⚠️</div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-400 mb-2">تنبيه: نقص في المخزون!</h3>
                                <p className="text-gray-300 mb-3">الخامات التالية وصلت للحد الأدنى وتحتاج إعادة طلب:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {lowStockProducts.map((product) => (
                                        <div key={product.id} className="bg-white/5 p-3 rounded-lg border border-red-500/20">
                                            <div className="font-bold text-white">{product.name}</div>
                                            <div className="text-sm text-red-300">
                                                المتوفر: {product.stock_quantity} {product.unit || 'قطعة'}
                                                {product.min_stock && ` (الحد الأدنى: ${product.min_stock})`}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5">
                                <tr>
                                    <th className="px-6 py-4 text-right text-white font-semibold">رقم الأمر</th>
                                    <th className="px-6 py-4 text-right text-white font-semibold">رقم الفاتورة</th>
                                    <th className="px-6 py-4 text-right text-white font-semibold">التاريخ</th>
                                    <th className="px-6 py-4 text-right text-white font-semibold">المورد</th>
                                    <th className="px-6 py-4 text-right text-white font-semibold">الإجمالي</th>
                                    <th className="px-6 py-4 text-center text-white font-semibold">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-8 text-white">جاري التحميل...</td>
                                    </tr>
                                ) : orders.length > 0 ? (
                                    orders.map((order) => (
                                        <tr key={order.id} className="border-t border-white/10 hover:bg-white/5 transition">
                                            <td className="px-6 py-4 text-gray-200">#{order.id}</td>
                                            <td className="px-6 py-4 text-gray-300">{order.invoice_number || '-'}</td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {new Date(order.order_date || order.created_at).toLocaleDateString('ar-EG')}
                                            </td>
                                            <td className="px-6 py-4 text-gray-300">
                                                {order.supplier?.name || suppliers.find(s => s.id === order.supplier_id)?.name || 'غير معروف'}
                                            </td>
                                            <td className="px-6 py-4 text-green-400 font-bold">{Number(order.total_amount).toLocaleString()} جنيه</td>
                                            <td className="px-6 py-4 flex justify-center gap-2">
                                                <button
                                                    onClick={() => openPaymentModal(order)}
                                                    className="p-2 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded tooltip"
                                                    title="تسجيل دفعة"
                                                >
                                                    💰
                                                </button>
                                                <button
                                                    onClick={() => preparePrint(order)}
                                                    className="p-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded tooltip"
                                                    title="طباعة"
                                                >
                                                    🖨️
                                                </button>
                                                <button
                                                    onClick={() => handleEditOrder(order)}
                                                    className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded tooltip"
                                                    title="تعديل"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    onClick={() => openLandedCost(order)}
                                                    className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded tooltip"
                                                    title="حساب التكلفة الكلية"
                                                >
                                                    📊
                                                </button>
                                                <button
                                                    onClick={() => openPackingList(order)}
                                                    className="p-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 rounded tooltip"
                                                    title="قائمة التعبئة"
                                                >
                                                    📋
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteOrder(order)}
                                                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-200 rounded tooltip"
                                                    title="حذف"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-400">
                                            لا توجد أوامر شراء مطابقة للبحث.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-white/10 flex justify-center items-center gap-4">
                            <button
                                onClick={() => setFilters({ ...filters, page: Math.max(1, filters.page - 1) })}
                                disabled={filters.page === 1}
                                className="px-4 py-2 bg-white/5 rounded-lg text-white disabled:opacity-30 hover:bg-white/10"
                            >
                                السابق
                            </button>
                            <span className="text-gray-300">
                                صفحة {filters.page} من {totalPages}
                            </span>
                            <button
                                onClick={() => setFilters({ ...filters, page: Math.min(totalPages, filters.page + 1) })}
                                disabled={filters.page === totalPages}
                                className="px-4 py-2 bg-white/5 rounded-lg text-white disabled:opacity-30 hover:bg-white/10"
                            >
                                التالي
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 overflow-y-auto" onClick={() => { setShowModal(false); setEditingOrder(null); }}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-4xl border border-white/20 my-8" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">{editingOrder ? 'تعديل أمر الشراء' : 'أمر شراء جديد'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">المورد</label>
                                    <select
                                        value={newOrder.supplier_id}
                                        onChange={(e) => setNewOrder({ ...newOrder, supplier_id: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    >
                                        <option value="">اختر المورد</option>
                                        {suppliers.map((s) => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
                                    <input
                                        type="date"
                                        value={newOrder.date}
                                        onChange={(e) => setNewOrder({ ...newOrder, date: e.target.value })}
                                        required
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">رقم فاتورة المورد</label>
                                    <input
                                        type="text"
                                        value={newOrder.invoice_number}
                                        onChange={(e) => setNewOrder({ ...newOrder, invoice_number: e.target.value })}
                                        placeholder="(اختياري)"
                                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                    />
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-white">الأصناف</h3>
                                    <button
                                        type="button"
                                        onClick={handleAddItem}
                                        className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded text-sm"
                                    >
                                        + إضافة صنف
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {newOrder.items.map((item, index) => (
                                        <div key={index} className="flex gap-2 items-end">
                                            <div className="flex-1">
                                                <label className="block text-xs text-gray-400 mb-1">المنتج (خامة)</label>
                                                <select
                                                    value={item.product_id}
                                                    onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                                                    required
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                                                >
                                                    <option value="">اختر الخامة</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setActiveItemIndex(index);
                                                    setShowQuickProductModal(true);
                                                }}
                                                className="mb-1 p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded text-sm h-[38px] flex items-center justify-center"
                                                title="إضافة صنف جديد"
                                            >
                                                +
                                            </button>
                                            <div className="w-24">
                                                <label className="block text-xs text-gray-400 mb-1">الكمية</label>
                                                <input
                                                    type="number"
                                                    value={typingValues[`${index}-quantity`] ?? item.quantity}
                                                    onChange={(e) => handleTypedChange(index, 'quantity', e.target.value)}
                                                    onBlur={() => {
                                                        const newTyping = { ...typingValues };
                                                        delete newTyping[`${index}-quantity`];
                                                        setTypingValues(newTyping);
                                                    }}
                                                    required
                                                    min="0.001"
                                                    step="any"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs text-gray-400 mb-1">سعر الوحدة</label>
                                                <input
                                                    type="number"
                                                    value={typingValues[`${index}-price`] ?? item.price}
                                                    onChange={(e) => handleTypedChange(index, 'price', e.target.value)}
                                                    onBlur={() => {
                                                        const newTyping = { ...typingValues };
                                                        delete newTyping[`${index}-price`];
                                                        setTypingValues(newTyping);
                                                    }}
                                                    required
                                                    min="0"
                                                    step="any"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm"
                                                />
                                            </div>
                                            <div className="w-32">
                                                <label className="block text-xs text-gray-400 mb-1">الإجمالي</label>
                                                <input
                                                    type="number"
                                                    value={typingValues[`${index}-total`] ?? (item.quantity && item.price ? (Number(item.quantity) * Number(item.price)) : '')}
                                                    onChange={(e) => setTypingValues({ ...typingValues, [`${index}-total`]: e.target.value })}
                                                    onBlur={(e) => handleItemTotalChange(index, e.target.value)}
                                                    required
                                                    min="0"
                                                    step="any"
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white text-sm font-mono"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveItem(index)}
                                                className="pb-2 text-red-400 hover:text-red-300"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                    {newOrder.items.length === 0 && (
                                        <div className="text-center text-gray-500 py-4">
                                            أضف أصناف للأمر
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-between items-center border-t border-white/10 pt-4">
                                <div className="text-xl font-bold text-white">
                                    الإجمالي: <span className="text-green-400">{calculateTotal().toLocaleString()} جنيه</span>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingOrder(null);
                                            setNewOrder({
                                                supplier_id: '',
                                                date: new Date().toISOString().split('T')[0],
                                                invoice_number: '',
                                                notes: '',
                                                items: [],
                                            });
                                        }}
                                        className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                    >
                                        إلغاء
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={newOrder.items.length === 0}
                                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        حفظ الأمر
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedOrderForPayment && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowPaymentModal(false)}>
                    <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-2xl font-bold text-white mb-6">تسجيل دفعة للمورد</h2>
                        <div className="mb-4 text-gray-300 text-sm">
                            <p>المورد: <span className="text-white font-semibold">{selectedOrderForPayment.supplier?.name}</span></p>
                            <p>إجمالي الأمر: <span className="text-green-400 font-semibold">{Number(selectedOrderForPayment.total_amount).toLocaleString()} جنيه</span></p>
                        </div>
                        <form onSubmit={handlePaymentSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">المبلغ</label>
                                <input
                                    type="number"
                                    value={paymentData.amount}
                                    onChange={(e) => setPaymentData({ ...paymentData, amount: Number(e.target.value) })}
                                    required
                                    min="1"
                                    step="0.01"
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">التاريخ</label>
                                <input
                                    type="date"
                                    value={paymentData.payment_date}
                                    onChange={(e) => setPaymentData({ ...paymentData, payment_date: e.target.value })}
                                    required
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-200 mb-2">ملاحظات</label>
                                <textarea
                                    value={paymentData.notes}
                                    onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                                />
                            </div>
                            <div className="flex gap-4 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setShowPaymentModal(false)}
                                    className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700"
                                >
                                    تسجيل الدفعة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Hidden Print Component */}
            <div style={{ display: 'none' }}>
                <div ref={componentRef} className="p-8 bg-white text-black" dir="rtl">
                    {orderToPrint && (
                        <div>
                            <div className="text-center mb-8 border-b pb-4">
                                <h1 className="text-3xl font-bold mb-2">أمر شراء</h1>
                                <p className="text-gray-600">رقم: #{orderToPrint.id}</p>
                                {orderToPrint.invoice_number && <p className="text-gray-600">مرجع المورد: {orderToPrint.invoice_number}</p>}
                                <p className="text-gray-600">التاريخ: {new Date(orderToPrint.order_date || orderToPrint.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>

                            <div className="mb-8">
                                <h3 className="text-xl font-bold mb-2">بيانات المورد:</h3>
                                <p>الاسم: {orderToPrint.supplier?.name}</p>
                                <p>الهاتف: {orderToPrint.supplier?.phone || '-'}</p>
                                <p>العنوان: {orderToPrint.supplier?.address || '-'}</p>
                            </div>

                            <table className="w-full border-collapse border border-gray-300 mb-8">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border border-gray-300 p-2 text-right">م</th>
                                        <th className="border border-gray-300 p-2 text-right">الصنف</th>
                                        <th className="border border-gray-300 p-2 text-center">الكمية</th>
                                        <th className="border border-gray-300 p-2 text-center">السعر</th>
                                        <th className="border border-gray-300 p-2 text-center">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orderToPrint.items?.map((item: OrderItem, idx: number) => (
                                        <tr key={idx}>
                                            <td className="border border-gray-300 p-2 text-center">{idx + 1}</td>
                                            <td className="border border-gray-300 p-2">{item.product?.name || item.product_id}</td>
                                            <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                                            <td className="border border-gray-300 p-2 text-center">{Number(item.price).toLocaleString()}</td>
                                            <td className="border border-gray-300 p-2 text-center">{Number(item.total).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colSpan={4} className="border border-gray-300 p-2 text-left font-bold">الإجمالي</td>
                                        <td className="border border-gray-300 p-2 text-center font-bold">{Number(orderToPrint.total_amount).toLocaleString()}</td>
                                    </tr>
                                </tfoot>
                            </table>

                            <div className="mt-12 pt-8 border-t flex justify-between">
                                <div>
                                    <p className="font-bold mb-2">توقيع المستلم</p>
                                    <p>..................</p>
                                </div>
                                <div>
                                    <p className="font-bold mb-2">توقيع المدير</p>
                                    <p>..................</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Quick Product Modal */}
            {showQuickProductModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]" onClick={() => setShowQuickProductModal(false)}>
                    <div className="bg-slate-800 p-6 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-xl font-bold text-white mb-4">إضافة صنف جديد سريع</h2>
                        <form onSubmit={handleQuickProductSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">اسم الصنف</label>
                                <input
                                    type="text"
                                    value={quickProductData.name}
                                    onChange={(e) => setQuickProductData({ ...quickProductData, name: e.target.value })}
                                    required
                                    autoFocus
                                    className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white focus:border-blue-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">وحدة القياس</label>
                                <select
                                    value={quickProductData.unit}
                                    onChange={(e) => setQuickProductData({ ...quickProductData, unit: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-900 border border-white/20 rounded-lg text-white focus:border-blue-500 outline-none"
                                >
                                    <option value="kg">كيلوجرام</option>
                                    <option value="piece">قطعة</option>
                                    <option value="meter">متر</option>
                                    <option value="box">علبة</option>
                                </select>
                            </div>
                            <div className="flex gap-3 justify-end pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowQuickProductModal(false)}
                                    className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg transition"
                                >
                                    إلغاء
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
                                >
                                    إضافة
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Landed Cost Modal */}
            {showLandedCostModal && landedCostOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">📊 حساب التكلفة الكلية (Landed Cost)</h2>
                            <button onClick={() => setShowLandedCostModal(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">تكلفة الشحن (EGP)</label>
                                    <input
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        type="number"
                                        value={landedCostForm.freight_cost}
                                        onChange={e => setLandedCostForm({ ...landedCostForm, freight_cost: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">نسبة الجمارك (%)</label>
                                    <input
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        type="number"
                                        step="0.01"
                                        value={landedCostForm.customs_percent}
                                        onChange={e => setLandedCostForm({ ...landedCostForm, customs_percent: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">نسبة العمولة (%)</label>
                                    <input
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        type="number"
                                        step="0.01"
                                        value={landedCostForm.commission_percent}
                                        onChange={e => setLandedCostForm({ ...landedCostForm, commission_percent: Number(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">الوزن الإجمالي (كجم)</label>
                                    <input
                                        className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                                        type="number"
                                        step="0.001"
                                        value={landedCostForm.total_weight_kg}
                                        onChange={e => setLandedCostForm({ ...landedCostForm, total_weight_kg: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleUpdateLandedCost}
                                    disabled={calculatingLandedCost}
                                    className="px-6 py-3 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 hover:bg-amber-500/30 transition disabled:opacity-50"
                                >
                                    {calculatingLandedCost ? 'جاري الحساب...' : 'حساب التكلفة الكلية'}
                                </button>
                            </div>

                            {landedCostData && landedCostData.breakdown && (
                                <div className="bg-white/5 rounded-xl p-4 space-y-2">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-amber-400">{Number(landedCostData.total_landed_cost).toLocaleString()}</div>
                                            <div className="text-sm text-gray-400">إجمالي التكلفة الكلية (EGP)</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-400">{landedCostData.fx_rate}</div>
                                            <div className="text-sm text-gray-400">سعر الصرف</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-400">{landedCostData.freight_cost?.toLocaleString() || 0}</div>
                                            <div className="text-sm text-gray-400">تكلفة الشحن</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-400">{landedCostData.total_weight_kg}</div>
                                            <div className="text-sm text-gray-400">الوزن (كجم)</div>
                                        </div>
                                    </div>

                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                                <th className="text-right px-4 py-3">المنتج</th>
                                                <th className="text-center px-4 py-3">الكمية</th>
                                                <th className="text-center px-4 py-3">السعر الأساسي (EGP)</th>
                                                <th className="text-center px-4 py-3">العمولة</th>
                                                <th className="text-center px-4 py-3">الجمارك</th>
                                                <th className="text-center px-4 py-3">الشحن</th>
                                                <th className="text-center px-4 py-3">تكلفة الوحدة الكلية</th>
                                                <th className="text-center px-4 py-3">الإجمالي</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(landedCostData.breakdown).map((b, idx: number) => (
                                                <tr key={b.item_id || idx} className="border-b border-white/5 hover:bg-white/5 transition">
                                                    <td className="px-4 py-3 text-gray-300">{b.product_name}</td>
                                                    <td className="px-4 py-3 text-center text-gray-300">{b.quantity}</td>
                                                    <td className="px-4 py-3 text-center text-gray-300">{b.base_cost_egp.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center text-gray-300">{b.commission.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center text-gray-300">{b.customs.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center text-gray-300">{b.shipping.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center text-white font-bold">{b.unit_landed_cost.toFixed(2)}</td>
                                                    <td className="px-4 py-3 text-center text-amber-400 font-bold">{b.total_landed_cost.toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot>
                                            <tr className="border-t border-white/20">
                                                <td colSpan={7} className="px-4 py-3 text-left text-white font-bold">الإجمالي النهائي</td>
                                                <td className="px-4 py-3 text-center text-amber-400 font-bold text-lg">
                                                    {Number(landedCostData.total_landed_cost).toLocaleString()}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
                            <button onClick={() => setShowLandedCostModal(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Packing List Modal */}
            {showPackingListModal && packingListOrderId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4">
                        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">📋 قائمة التعبئة (Packing List)</h2>
                            <button onClick={() => setShowPackingListModal(false)} className="text-gray-400 hover:text-white transition">✕</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">طول الكرتونة (سم)</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" value={packingListForm.carton_length_cm} onChange={e => setPackingListForm({ ...packingListForm, carton_length_cm: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">عرض الكرتونة (سم)</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" value={packingListForm.carton_width_cm} onChange={e => setPackingListForm({ ...packingListForm, carton_width_cm: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">ارتفاع الكرتونة (سم)</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" value={packingListForm.carton_height_cm} onChange={e => setPackingListForm({ ...packingListForm, carton_height_cm: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">عدد الكراتين</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" value={packingListForm.cartons_count} onChange={e => setPackingListForm({ ...packingListForm, cartons_count: e.target.value })} min="1" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">حد الانحراف (%)</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" step="0.1" value={packingListForm.deviation_threshold_percent} onChange={e => setPackingListForm({ ...packingListForm, deviation_threshold_percent: e.target.value })} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">الوزن الصافي الفعلي (كجم) — Net Weight</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" step="0.01" value={packingListForm.actual_net_weight_kg} onChange={e => setPackingListForm({ ...packingListForm, actual_net_weight_kg: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-1">الوزن الإجمالي الفعلي (كجم) — Gross Weight</label>
                                    <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" type="number" step="0.01" value={packingListForm.actual_gross_weight_kg} onChange={e => setPackingListForm({ ...packingListForm, actual_gross_weight_kg: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">ملاحظات</label>
                                <input className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500" value={packingListForm.notes} onChange={e => setPackingListForm({ ...packingListForm, notes: e.target.value })} />
                            </div>
                            <div className="flex justify-end">
                                <button
                                    onClick={handleSavePackingList}
                                    disabled={savingPackingList}
                                    className="px-6 py-3 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/30 hover:bg-purple-500/30 transition disabled:opacity-50"
                                >
                                    {savingPackingList ? 'جاري الحفظ...' : 'حساب وتحليل'}
                                </button>
                            </div>

                            {packingListResult && (() => {
                                const pl = packingListResult.packing_list as Record<string, unknown> | undefined;
                                const cbm = packingListResult.cbm_analysis as Record<string, unknown> | undefined;
                                const alert = packingListResult.deviation_alert as Record<string, unknown> | undefined;
                                return (
                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-purple-400">
                                                {pl?.total_cbm ? Number(pl.total_cbm).toFixed(3) : '—'}
                                            </div>
                                            <div className="text-sm text-gray-400">إجمالي CBM</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-blue-400">
                                                {String(pl?.cartons_count || 0)}
                                            </div>
                                            <div className="text-sm text-gray-400">عدد الكراتين</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-green-400">
                                                {pl?.actual_net_weight_kg ? `${Number(pl.actual_net_weight_kg).toFixed(2)}` : '—'}
                                            </div>
                                            <div className="text-sm text-gray-400">الوزن الصافي (كجم)</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-amber-400">
                                                {pl?.actual_gross_weight_kg ? `${Number(pl.actual_gross_weight_kg).toFixed(2)}` : '—'}
                                            </div>
                                            <div className="text-sm text-gray-400">الوزن الإجمالي (كجم)</div>
                                        </div>
                                    </div>

                                    {(cbm?.container_suggestions as Array<Record<string, unknown>> | undefined) && (
                                        <div>
                                            <h3 className="text-white font-bold mb-3">مقارنة الحاويات</h3>
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                                                        <th className="text-right px-4 py-3">الحاوية</th>
                                                        <th className="text-center px-4 py-3">السعة (CBM)</th>
                                                        <th className="text-center px-4 py-3">الاستخدام %</th>
                                                        <th className="text-center px-4 py-3">المساحة المتبقية</th>
                                                        <th className="text-center px-4 py-3">تناسب؟</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(cbm?.container_suggestions as Array<Record<string, unknown>>).map((s: Record<string, unknown>) => (
                                                        <tr key={String(s.id)} className={`border-b border-white/5 ${s.fits ? 'bg-green-500/5' : ''}`}>
                                                            <td className="px-4 py-3 text-gray-300">{String(s.name)}</td>
                                                            <td className="px-4 py-3 text-center text-gray-300">{Number(s.max_cbm).toFixed(3)}</td>
                                                            <td className="px-4 py-3 text-center">{Number(s.utilization_pct).toFixed(1)}%</td>
                                                            <td className="px-4 py-3 text-center text-gray-300">{Number(s.remaining_cbm).toFixed(3)}</td>
                                                            <td className="px-4 py-3 text-center">{s.fits ? <span className="text-green-400 font-bold">✓</span> : <span className="text-red-400">✗</span>}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}

                                    {alert && (
                                        <div className={`rounded-xl p-4 ${String(alert.severity) === 'HIGH' ? 'bg-red-500/20 border border-red-500/30' : 'bg-amber-500/20 border border-amber-500/30'}`}>
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{String(alert.severity) === 'HIGH' ? '🔴' : '🟡'}</span>
                                                <div>
                                                    <div className="text-white font-bold">{String(alert.type) === 'WEIGHT_DEVIATION' ? 'تنبيه انحراف الوزن' : 'تنبيه'}</div>
                                                    <div className="text-gray-300 text-sm">{String(alert.message)}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })()}
                        </div>
                        <div className="px-6 py-4 border-t border-white/10 flex justify-end">
                            <button onClick={() => setShowPackingListModal(false)} className="px-4 py-2 bg-gray-500/20 text-gray-300 rounded-lg hover:bg-gray-500/30 transition">إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
