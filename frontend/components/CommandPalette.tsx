'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { Search, Package, Users, ShoppingCart, FileText } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResult {
    id: number | string;
    type: 'product' | 'customer' | 'supplier' | 'order';
    name: string;
    description?: string;
}

export function CommandPalette() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    // Toggle with Ctrl+K or Cmd+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    // Search API
    useEffect(() => {
        if (search.length < 2) {
            setResults([]);
            return;
        }

        const searchTimeout = setTimeout(async () => {
            setLoading(true);
            try {
                const data = await api.fetchWithAuth(`/v1/search/global?q=${encodeURIComponent(search)}`);
                setResults(data || []);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(searchTimeout);
    }, [search]);

    const handleSelect = (item: SearchResult) => {
        setOpen(false);
        setSearch('');

        // Navigate based on type
        switch (item.type) {
            case 'product':
                router.push(`/inventory/products`);
                break;
            case 'customer':
                router.push(`/sales/customers`);
                break;
            case 'supplier':
                router.push(`/purchases/suppliers`);
                break;
            case 'order':
                router.push(`/sales/orders`);
                break;
            default:
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'product': return <Package className="w-4 h-4" />;
            case 'customer': return <Users className="w-4 h-4" />;
            case 'supplier': return <Users className="w-4 h-4" />;
            case 'order': return <ShoppingCart className="w-4 h-4" />;
            default: return <FileText className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            product: 'منتج',
            customer: 'عميل',
            supplier: 'مورد',
            order: 'طلب',
        };
        return labels[type] || type;
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[20vh]">
            <Command className="bg-slate-800 rounded-2xl border border-white/20 shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="flex items-center border-b border-white/10 px-4">
                    <Search className="w-5 h-5 text-gray-400 mr-3" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder="ابحث في المنتجات، العملاء، الطلبات..."
                        className="w-full bg-transparent border-none outline-none py-4 text-white placeholder-gray-400"
                        dir="rtl"
                    />
                    <kbd className="px-2 py-1 text-xs bg-white/10 rounded text-gray-400">ESC</kbd>
                </div>

                <Command.List className="max-h-96 overflow-y-auto p-2">
                    {loading && (
                        <div className="py-8 text-center text-gray-400">
                            <div className="animate-spin w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-2 text-sm">جاري البحث...</p>
                        </div>
                    )}

                    {!loading && search.length >= 2 && results.length === 0 && (
                        <Command.Empty className="py-8 text-center text-gray-400">
                            لا توجد نتائج
                        </Command.Empty>
                    )}

                    {!loading && results.length > 0 && (
                        <Command.Group heading="النتائج" className="text-gray-400 text-xs px-2 py-2">
                            {results.map((item, index) => (
                                <Command.Item
                                    key={`${item.type}-${item.id || index}`}
                                    onSelect={() => handleSelect(item)}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/10 cursor-pointer transition text-white mb-1"
                                >
                                    <div className="text-blue-400">{getIcon(item.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{item.name}</div>
                                        {item.description && (
                                            <div className="text-xs text-gray-400 truncate">{item.description}</div>
                                        )}
                                    </div>
                                    <span className="text-xs px-2 py-1 bg-emerald-500/20 text-blue-300 rounded">
                                        {getTypeLabel(item.type)}
                                    </span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    {search.length === 0 && (
                        <div className="py-8 text-center">
                            <Search className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                            <p className="text-gray-400 text-sm">ابدأ الكتابة للبحث...</p>
                            <p className="text-[#ecfdf5]0 text-xs mt-2">يمكنك البحث في المنتجات، العملاء، الموردين، والمزيد</p>
                        </div>
                    )}
                </Command.List>

                <div className="border-t border-white/10 px-4 py-2 flex items-center justify-between text-xs text-gray-400">
                    <div className="flex gap-4">
                        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">↑↓</kbd> للتنقل</span>
                        <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">Enter</kbd> للاختيار</span>
                    </div>
                    <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded">ESC</kbd> للإغلاق</span>
                </div>
            </Command>

            {/* Backdrop */}
            <div className="fixed inset-0 -z-10" onClick={() => setOpen(false)} />
        </div>
    );
}
