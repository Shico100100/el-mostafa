'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload, Trash2, FileText, Download } from 'lucide-react';
import { useDocuments } from '@/hooks/useDocuments';
import { toast } from 'sonner';

export default function DocumentsPage() {
  const router = useRouter();
  const { documents, loading, upload, delete: deleteDoc, formatSize } = useDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('الملف كبير جدًا. الحد الأقصى 10 ميجابايت');
      return;
    }
    setUploading(true);
    try {
      await upload(file);
      toast.success('تم رفع الملف بنجاح');
    } catch {
      toast.error('فشل رفع الملف');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (id: number, name: string) => {
    try {
      await deleteDoc(id);
      toast.success(`تم حذف ${name}`);
    } catch {
      toast.error('فشل حذف الملف');
    }
  };

  if (loading) return <div className="text-white text-center mt-20">جاري التحميل...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100" dir="rtl">
      <header className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full text-white transition">
              <ArrowRight className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6" /> المستندات
            </h1>
          </div>
          <div>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 rounded-xl transition text-sm font-bold"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'جاري الرفع...' : 'رفع مستند'}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {documents.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
            لا توجد مستندات
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map(doc => (
              <div key={doc.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-400" />
                    <div>
                      <p className="font-medium text-sm truncate max-w-[200px]">{doc.originalName}</p>
                      <p className="text-xs text-slate-500">{formatSize(doc.size)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <a
                    href={`/api/v1/documents/${doc.id}`}
                    target="_blank"
                    className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id, doc.originalName)}
                    className="p-2 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
