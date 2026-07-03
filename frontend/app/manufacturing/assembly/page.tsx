'use client';

import { useAssembly } from '@/hooks/manufacturing/useAssembly';
import { AssemblyHeader } from '@/components/manufacturing/assembly/AssemblyHeader';
import { AssemblyTable } from '@/components/manufacturing/assembly/AssemblyTable';
import { AssemblyModal } from '@/components/manufacturing/assembly/AssemblyModal';

export default function AssemblyPage() {
  const h = useAssembly();

  if (h.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <AssemblyHeader onNewOrder={() => h.setShowModal(true)} />
      <main className="container mx-auto px-6 py-8">
        <AssemblyTable orders={h.orders} />
      </main>
      <AssemblyModal show={h.showModal} boms={h.boms}
        selectedBom={h.selectedBom} quantity={h.quantity} date={h.date}
        onBomChange={h.setSelectedBom} onQuantityChange={h.setQuantity}
        onDateChange={h.setDate} onSubmit={h.handleSubmit}
        onClose={() => h.setShowModal(false)} />
    </div>
  );
}
