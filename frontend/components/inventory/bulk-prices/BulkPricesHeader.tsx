'use client';

import { ArrowLeft, Percent } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  selectedCount: number;
  saving: boolean;
  onApply: () => void;
}

export function BulkPricesHeader({ selectedCount, saving, onApply }: Props) {
  const router = useRouter();

  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/inventory/products')} className="p-2 hover:bg-white/5 rounded-full transition text-white/50 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white">تحديث الأسعار</h1>
            <p className="text-sm text-slate-400 mt-1">تحديث أسعار عدة منتجات دفعة واحدة</p>
          </div>
        </div>
        <button
          onClick={onApply}
          disabled={saving || selectedCount === 0}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-xl font-bold transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-900/20"
        >
          <Percent className="w-5 h-5" />
          {saving ? 'جاري التطبيق...' : `تطبيق على ${selectedCount} منتج`}
        </button>
      </div>
    </header>
  );
}
