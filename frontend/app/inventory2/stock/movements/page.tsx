'use client';

import { useRouter } from 'next/navigation';
import { useMovements } from '@/hooks/inventory2/useMovements';
import { MovementsHeader } from '@/components/inventory2/movements/MovementsHeader';
import { MovementsSummary } from '@/components/inventory2/movements/MovementsSummary';
import { MovementsFilters } from '@/components/inventory2/movements/MovementsFilters';
import { MovementItem } from '@/components/inventory2/movements/MovementItem';
import { ArrowRightLeft } from 'lucide-react';

export default function MovementsPage() {
  const router = useRouter();
  const h = useMovements();

  return (
    <>
      <MovementsHeader onBack={() => router.push('/inventory2/stock')} onRefresh={h.loadData} />
      <div className="px-8 py-8">
        <MovementsSummary inCount={h.inCount} outCount={h.outCount} adjCount={h.adjCount} />
        <MovementsFilters search={h.search} typeFilter={h.typeFilter} total={h.filtered.length}
          onSearchChange={h.setSearch} onTypeFilterChange={h.setTypeFilter} />
        <div className="space-y-3">
          {h.loading ? (
            <div className="text-center text-[#6b8378] py-20">جاري التحميل...</div>
          ) : (
            <>
              {h.filtered.map((m) => <MovementItem key={m.id} movement={m} />)}
              {h.filtered.length === 0 && (
                <div className="text-center text-[#6b8378] py-16">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-3 text-[#1f2d26]" />
                  <p>لا توجد حركات</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
