'use client';

import { X } from 'lucide-react';
import { BOMFormFields } from '../BOMFormFields';
import type { BOM, Product } from '../types';
import type { BOMFormItem } from '@/components/bom/types';

interface BOMEditDialogProps {
  bom: BOM;
  bomProducts: Product[];
  products: Product[];
  productOptions: { value: number; label: string }[];
  formName: string;
  formDescription: string;
  formProductId: string;
  formPcsPerCarton: string;
  formPcsPerBox: string;
  formCartonProductId: string;
  formBoxProductId: string;
  formItems: BOMFormItem[];
  onFormNameChange: (v: string) => void;
  onFormDescriptionChange: (v: string) => void;
  onFormProductIdChange: (v: string) => void;
  onFormPcsPerCartonChange: (v: string) => void;
  onFormPcsPerBoxChange: (v: string) => void;
  onFormCartonProductIdChange: (v: string) => void;
  onFormBoxProductIdChange: (v: string) => void;
  onAddItem: () => void;
  onRemoveItem: (idx: number) => void;
  onUpdateItem: (idx: number, field: 'product_id' | 'quantity', value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export function BOMEditDialog(props: BOMEditDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-800 border border-white/20 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">تعديل BOM: {props.bom.name}</h2>
          <button onClick={props.onClose} className="text-gray-400 hover:text-white transition"><X className="w-5 h-5" /></button>
        </div>
        <BOMFormFields
          products={props.products}
          bomProducts={props.bomProducts}
          productOptions={props.productOptions}
          formName={props.formName}
          formDescription={props.formDescription}
          formProductId={props.formProductId}
          formPcsPerCarton={props.formPcsPerCarton}
          formPcsPerBox={props.formPcsPerBox}
          formCartonProductId={props.formCartonProductId}
          formBoxProductId={props.formBoxProductId}
          formItems={props.formItems}
          onFormNameChange={props.onFormNameChange}
          onFormDescriptionChange={props.onFormDescriptionChange}
          onFormProductIdChange={props.onFormProductIdChange}
          onFormPcsPerCartonChange={props.onFormPcsPerCartonChange}
          onFormPcsPerBoxChange={props.onFormPcsPerBoxChange}
          onFormCartonProductIdChange={props.onFormCartonProductIdChange}
          onFormBoxProductIdChange={props.onFormBoxProductIdChange}
          onAddItem={props.onAddItem}
          onRemoveItem={props.onRemoveItem}
          onUpdateItem={props.onUpdateItem}
        />
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          <button onClick={props.onClose} className="px-4 py-2 bg-[#ecfdf5]0/20 text-gray-300 rounded-lg hover:bg-[#ecfdf5]0/30 transition">إلغاء</button>
          <button onClick={props.onSave} className="px-4 py-2 bg-emerald-500/20 text-blue-300 rounded-lg border border-emerald-500/30 hover:bg-emerald-500/30 transition">تحديث</button>
        </div>
      </div>
    </div>
  );
}
