'use client';

import { useRouter } from 'next/navigation';
import { useBOM } from '@/hooks/bom/useBOM';
import { BOMHeader } from '@/components/bom/BOMHeader';
import { BOMTable } from '@/components/bom/BOMTable';
import { BOMCreateDialog } from '@/components/bom/modals/BOMCreateDialog';
import { BOMEditDialog } from '@/components/bom/modals/BOMEditDialog';
import { BOMDeleteConfirm } from '@/components/bom/modals/BOMDeleteConfirm';
import { BOMExplodeDialog } from '@/components/bom/modals/BOMExplodeDialog';

export default function BOMPage() {
  const router = useRouter();
  const bom = useBOM();

  if (bom.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <BOMHeader
        bomsCount={bom.boms.length}
        totalComponents={bom.boms.reduce((s, b) => s + (b.items?.length || 0), 0)}
        bomProductsCount={bom.bomProducts.length}
        productsCount={bom.products.length}
        onBack={() => router.push('/dashboard')}
        onCreate={bom.openCreate}
      />

      <main className="container mx-auto px-6 py-8 space-y-6">
        <BOMTable
          boms={bom.boms}
          search={bom.search}
          onSearchChange={bom.setSearch}
          onExplode={bom.openExplode}
          onEdit={bom.openEdit}
          onDuplicate={bom.handleDuplicate}
          onDelete={bom.setShowDeleteConfirm}
          getProductName={bom.getProductName}
          formatDate={bom.formatDate}
        />
      </main>

      {bom.showCreateDialog && (
        <BOMCreateDialog
          bomProducts={bom.bomProducts}
          products={bom.products}
          productOptions={bom.productOptions}
          formName={bom.formName}
          formDescription={bom.formDescription}
          formProductId={bom.formProductId}
          formPcsPerCarton={bom.formPcsPerCarton}
          formPcsPerBox={bom.formPcsPerBox}
          formCartonProductId={bom.formCartonProductId}
          formBoxProductId={bom.formBoxProductId}
          formItems={bom.formItems}
          onFormNameChange={bom.setFormName}
          onFormDescriptionChange={bom.setFormDescription}
          onFormProductIdChange={bom.setFormProductId}
          onFormPcsPerCartonChange={bom.setFormPcsPerCarton}
          onFormPcsPerBoxChange={bom.setFormPcsPerBox}
          onFormCartonProductIdChange={bom.setFormCartonProductId}
          onFormBoxProductIdChange={bom.setFormBoxProductId}
          onAddItem={bom.addItem}
          onRemoveItem={bom.removeItem}
          onUpdateItem={bom.updateItem}
          onClose={() => bom.setShowCreateDialog(false)}
          onSave={() => bom.handleSave(false)}
        />
      )}

      {bom.showEditDialog && bom.selectedBOM && (
        <BOMEditDialog
          bom={bom.selectedBOM}
          bomProducts={bom.bomProducts}
          products={bom.products}
          productOptions={bom.productOptions}
          formName={bom.formName}
          formDescription={bom.formDescription}
          formProductId={bom.formProductId}
          formPcsPerCarton={bom.formPcsPerCarton}
          formPcsPerBox={bom.formPcsPerBox}
          formCartonProductId={bom.formCartonProductId}
          formBoxProductId={bom.formBoxProductId}
          formItems={bom.formItems}
          onFormNameChange={bom.setFormName}
          onFormDescriptionChange={bom.setFormDescription}
          onFormProductIdChange={bom.setFormProductId}
          onFormPcsPerCartonChange={bom.setFormPcsPerCarton}
          onFormPcsPerBoxChange={bom.setFormPcsPerBox}
          onFormCartonProductIdChange={bom.setFormCartonProductId}
          onFormBoxProductIdChange={bom.setFormBoxProductId}
          onAddItem={bom.addItem}
          onRemoveItem={bom.removeItem}
          onUpdateItem={bom.updateItem}
          onClose={() => bom.setShowEditDialog(false)}
          onSave={() => bom.handleSave(true)}
        />
      )}

      {bom.showDeleteConfirm && (
        <BOMDeleteConfirm
          bom={bom.showDeleteConfirm}
          onClose={() => bom.setShowDeleteConfirm(null)}
          onConfirm={() => bom.handleDelete(bom.showDeleteConfirm!)}
        />
      )}

      {bom.showExplodeDialog && bom.selectedBOM && (
        <BOMExplodeDialog
          bom={bom.selectedBOM}
          getProductName={bom.getProductName}
          explodeQuantity={bom.explodeQuantity}
          onExplodeQuantityChange={bom.setExplodeQuantity}
          exploding={bom.exploding}
          explosionResult={bom.explosionResult}
          costResult={bom.costResult}
          onExplode={bom.handleExplode}
          onGeneratePDF={bom.generatePDF}
          onClose={() => bom.setShowExplodeDialog(false)}
        />
      )}
    </div>
  );
}
