'use client';

import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useProduction } from '@/hooks/assembly/useProduction';
import { ProductionForm } from '@/components/assembly/production/ProductionForm';
import { RecipePreview } from '@/components/assembly/production/RecipePreview';
import { ProductionHistory } from '@/components/assembly/production/ProductionHistory';

export default function ProductionPage() {
  const h = useProduction();

  return (
    <div className="space-y-6 direction-rtl" dir="rtl">
      <div className="flex items-center gap-2 text-gray-400 mb-4">
        <Link href="/assembly" className="hover:text-white transition">التجميع</Link>
        <ChevronRight size={16} />
        <span className="text-white">تسجيل الإنتاج</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ProductionForm
            products={h.products}
            selectedProduct={h.selectedProduct}
            quantity={h.quantity}
            date={h.date}
            notes={h.notes}
            submitting={h.submitting}
            isReady={h.isReady}
            onProductChange={h.setSelectedProduct}
            onQuantityChange={h.setQuantity}
            onDateChange={h.setDate}
            onNotesChange={h.setNotes}
            onSubmit={h.handleSubmit}
          />
        </div>

        <div className="lg:col-span-2">
          <RecipePreview
            selectedProduct={h.selectedProduct}
            loadingRecipe={h.loadingRecipe}
            recipe={h.recipe}
            quantity={h.quantity}
          />
        </div>
      </div>

      <ProductionHistory history={h.history} loading={h.loadingHistory} />
    </div>
  );
}
