'use client';

import { useEffect, useState, useCallback } from 'react';
import { api } from '@/lib/api';

export interface Document {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  entityType?: string;
  entityId?: number;
  createdAt: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.fetchWithAuth('/v1/documents');
      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadDocuments(); }, [loadDocuments]);

  const handleUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const data = await api.fetchWithAuth('/v1/documents/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let fetch set multipart boundary
    });
    await loadDocuments();
    return data;
  };

  const handleDelete = async (id: number) => {
    await api.fetchWithAuth(`/v1/documents/${id}`, { method: 'DELETE' });
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return { documents, loading, upload: handleUpload, delete: handleDelete, formatSize };
}
