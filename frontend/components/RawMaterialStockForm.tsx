'use client';
import React, { useState } from 'react';
import { api } from '@/lib/api';

interface Props {
    rawMaterialId: number;
    onSuccess?: () => void;
}

export const RawMaterialStockForm: React.FC<Props> = ({ rawMaterialId, onSuccess }) => {
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [date, setDate] = useState(() => {
        // default to today in YYYY‑MM‑DD format
        const today = new Date();
        return today.toISOString().split('T')[0];
    });
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await api.addRawMaterialStock(rawMaterialId, {
                quantity: Number(quantity),
                price: price ? Number(price) : undefined,
                supplier_id: supplierId ? Number(supplierId) : undefined,
                date,
                notes,
            });
            // reset fields
            setQuantity('');
            setPrice('');
            setSupplierId('');
            setNotes('');
            setDate(() => {
                const today = new Date();
                return today.toISOString().split('T')[0];
            });
            if (onSuccess) onSuccess();
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'فشل إضافة المخزون';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded">
            <h3 className="text-lg font-medium">إضافة مخزون مادة خام</h3>

            <div>
                <label className="block text-sm font-medium">الكمية</label>
                <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    className="mt-1 block w-full border rounded p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium">السعر (اختياري)</label>
                <input
                    type="number"
                    min="0"
                    step="any"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    className="mt-1 block w-full border rounded p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium">المورد (اختياري)</label>
                <input
                    type="number"
                    min="0"
                    value={supplierId}
                    onChange={e => setSupplierId(e.target.value)}
                    className="mt-1 block w-full border rounded p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium">التاريخ</label>
                <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="mt-1 block w-full border rounded p-2"
                />
            </div>

            <div>
                <label className="block text-sm font-medium">ملاحظات (اختياري)</label>
                <textarea
                    rows={2}
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="mt-1 block w-full border rounded p-2"
                />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
                {loading ? 'جاري الإضافة...' : 'إضافة'}
            </button>
        </form>
    );
};