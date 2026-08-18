'use client';

import { Upload, Download } from 'lucide-react';
import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { useAuthCheck } from '@/lib/useAuthCheck';

interface ExcelActionsProps {
    exportUrl: string;
    importUrl: string;
    fileName: string; // e.g., 'machines.xlsx'
    onImportSuccess: () => void;
}

export default function ExcelActions({ exportUrl, importUrl, fileName, onImportSuccess }: ExcelActionsProps) {
    const ready = useAuthCheck();
    const [importing, setImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const exportPath = exportUrl.startsWith('/v1/') ? exportUrl : `/v1${exportUrl}`;
            const response = await fetch(`/api${exportPath}`, {
                method: 'GET',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            try {
                a.click();
            } finally {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('فشل التصدير. يرجى المحاولة مرة أخرى.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be selected again if needed
        e.target.value = '';

        setImporting(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Need to verify if api.fetchWithAuth handles FormData correctly (removing Content-Type to let browser set boundary)
            // If the codebase's api utility forces 'application/json', this might fail.
            // I'll assume standard fetch behavior for now, but I should probably check api.ts if this fails.

            // For now, I'll use a direct fetch with the token if I suspect api utility issues, 
            // but consistency is better. Let's try passing a custom header if needed, 
            // but usually `body: formData` is enough.

            // NOTE: api.fetchWithAuth assumes JSON response by default.
            // But we need to make sure we don't double-stringify or send wrong headers for FormData.
            // Using direct fetch here to be safe with FormData and handle JSON response properly.

            const token = localStorage.getItem('token');
            const impUrl = importUrl.startsWith('/v1/') ? importUrl : `/v1${importUrl}`;
            const response = await fetch(`/api${impUrl}`, {
                method: 'POST',
                headers: {
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
                body: formData
            });

            if (!response.ok) {
                const errorBody = await response.text().catch(() => '');
                throw new Error(`Import failed (${response.status}): ${errorBody}`);
            }

            const result = await response.json();

            const success = result.success ?? 0;
            const errors = result.errors ?? 0;
            if (errors > 0) {
                toast.success(`تم استيراد ${success} بنجاح. فشل ${errors}. راجع الكونسول للتفاصيل.`);
                console.warn('Failed rows:', result.failedRows);
            } else {
                toast.success(`تم الاستيراد بنجاح! (${success} صنف)`);
            }

            onImportSuccess();
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('فشل الاستيراد. تأكد من صحة الملف.');
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="flex gap-2">
            <button
                onClick={handleExport}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 transition"
            >
                <Upload className="w-4 h-4 inline" /> تصدير Excel
            </button>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
            />
            <button
                onClick={handleImportClick}
                disabled={importing}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition disabled:opacity-50"
            >
                <Download className="w-4 h-4 inline" /> {importing ? 'جاري الاستيراد...' : 'استيراد Excel'}
            </button>
        </div>
    );
}
