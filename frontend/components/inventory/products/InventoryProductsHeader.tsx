'use client';

import type { ReactNode } from 'react';

interface Props {
  totalItems: number;
  page: number;
  totalPages: number;
  onImportClick: () => void;
  onExport: () => void;
  onBulkPrice: () => void;
  onSmartAssign: () => void;
  onSemiFinished: () => void;
  onAddProduct: () => void;
  children?: ReactNode;
}

export function InventoryProductsHeader({
  totalItems, page, totalPages,
  onImportClick, onExport, onBulkPrice, onSmartAssign, onSemiFinished, onAddProduct,
  children,
}: Props) {
  return (
    <header className="bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
      <div className="px-8 py-5 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-white">المنتجات</h1>
          <p className="text-sm text-slate-400 mt-1">{totalItems} منتج | الصفحة {page} من {totalPages}</p>
        </div>
        <div className="flex gap-3">
          {children}
          <button onClick={onImportClick}
            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 px-4 py-2.5 rounded-xl border border-emerald-500/20 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>استيراد
          </button>
          <button onClick={onExport}
            className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 px-4 py-2.5 rounded-xl border border-emerald-500/20 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>تصدير
          </button>
          <button onClick={onBulkPrice}
            className="bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 px-4 py-2.5 rounded-xl border border-teal-500/20 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>أسعار
          </button>
          <button onClick={onSmartAssign}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-purple-900/30 hover:from-purple-700 hover:to-pink-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>توزيع ذكي
          </button>
          <button onClick={onSemiFinished}
            className="bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 px-4 py-2.5 rounded-xl border border-amber-500/20 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>بلاستيك
          </button>
          <button onClick={onAddProduct}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-5 py-2.5 rounded-xl font-bold transition flex items-center gap-2 shadow-lg shadow-blue-900/30">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>إضافة
          </button>
        </div>
      </div>
    </header>
  );
}
