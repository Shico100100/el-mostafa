'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { FileUp, File, ExternalLink } from 'lucide-react';

interface Attachment {
    id: number;
    filename: string;
    path: string;
    mimetype: string;
    created_at: string;
}

interface AttachmentSectionProps {
    relatedType: 'SalesOrder' | 'PurchaseOrder' | 'JournalEntry';
    relatedId: number;
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({ relatedType, relatedId }) => {
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const fetchAttachments = useCallback(async () => {
        if (!relatedId) return;
        setLoading(true);
        try {
            const data = await api.fetchWithAuth(`/v1/files/attachments?relatedType=${relatedType}&relatedId=${relatedId}`);
            setAttachments(data);
        } catch (error) {
            console.error('Error fetching attachments:', error);
        } finally {
            setLoading(false);
        }
    }, [relatedId, relatedType]);

    useEffect(() => {
        fetchAttachments();
    }, [fetchAttachments]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !relatedId) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            await api.fetchWithAuth(`/v1/files/upload?relatedType=${relatedType}&relatedId=${relatedId}`, {
                method: 'POST',
                body: formData,
            });
            fetchAttachments();
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('فشل رفع الملف');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">المستندات المرفقة</h3>
                <label className={`cursor-pointer bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2 ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <FileUp className="w-4 h-4" />
                    {uploading ? 'جاري الرفع...' : 'إرفاق ملف'}
                    <input type="file" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
            </div>

            {loading ? (
                <div className="text-center py-4 text-gray-400">جاري التحميل...</div>
            ) : attachments.length === 0 ? (
                <div className="text-center py-8 bg-white/5 border border-dashed border-white/10 rounded-xl text-gray-500">
                    لا توجد مستندات مرفقة
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {attachments.map((file) => (
                        <div key={file.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between group hover:bg-white/10 transition">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                                    <File className="w-5 h-5" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-medium text-white truncate" title={file.filename}>
                                        {file.filename}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(file.created_at).toLocaleDateString('ar-EG')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                                <a
                                    href={file.path}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AttachmentSection;
