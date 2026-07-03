'use client';

import { Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { H2 } from '@/components/ui/Typography';
import type { Recipe } from '@/components/assembly/production/types';

interface RecipePreviewProps {
  selectedProduct: number | null;
  loadingRecipe: boolean;
  recipe: Recipe | null;
  quantity: number;
}

export function RecipePreview({ selectedProduct, loadingRecipe, recipe, quantity }: RecipePreviewProps) {
  return (
    <GlassPanel className="p-6 h-full">
      <H2 className="flex items-center gap-2 mb-6 text-xl">
        <CheckCircle className="text-green-400" />
        مراجعة مكونات الخلطة (BOM)
      </H2>

      {!selectedProduct ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Package size={48} className="mb-4 opacity-50" />
          <p>الرجاء اختيار منتج لعرض مكوناته</p>
        </div>
      ) : loadingRecipe ? (
        <div className="text-center py-12 text-gray-400">جاري حساب الكميات وفحص المخزن...</div>
      ) : recipe ? (
        <div className="space-y-4">
          {!recipe.hasBom && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-4 rounded-lg flex items-center gap-3">
              <AlertTriangle />
              <span>تنبيه: هذا المنتج لا يحتوي على خلطة (BOM) معرفة. سيتم تسجيل الإنتاج دون خصم مكونات.</span>
            </div>
          )}
          {recipe.items.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b border-white/10 text-gray-400 text-sm">
                    <th className="pb-3 pr-2">المكون / الخامة</th>
                    <th className="pb-3 text-center">الكمية لكل وحدة</th>
                    <th className="pb-3 text-center">المطلوب للإجمالي</th>
                    <th className="pb-3 text-center">المتوفر بالمخزن</th>
                    <th className="pb-3 text-center">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {recipe.items.map((item, idx) => (
                    <tr key={idx} className="group hover:bg-white/5 transition">
                      <td className="py-4 pr-2 font-medium">{item.name}</td>
                      <td className="py-4 text-center text-gray-400">
                        {(item.required / (quantity || 1)).toFixed(3)} {item.unit}
                      </td>
                      <td className="py-4 text-center font-bold text-white">
                        {item.required.toFixed(2)} {item.unit}
                      </td>
                      <td className={`py-4 text-center ${item.available < item.required ? 'text-red-400' : 'text-green-400'}`}>
                        {item.available.toFixed(2)}
                      </td>
                      <td className="py-4 flex justify-center">
                        {item.status === 'OK' ? (
                          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <CheckCircle size={12} /> متوفر
                          </span>
                        ) : (
                          <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse">
                            <XCircle size={12} /> ناقص
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-red-500">فشل في تحميل بيانات الخلطة</div>
      )}
    </GlassPanel>
  );
}
