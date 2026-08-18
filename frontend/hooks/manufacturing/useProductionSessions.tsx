'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import type { RangeSession, SessionDetail, RecordHistoryEntry } from '@/components/manufacturing/types';

interface RangeForm {
  machine_id: string;
  machine_name: string;
  mold_id: string;
  product_id: string;
  start_date: string;
  end_date: string;
  total_production_kg: string;
  mode: 'sum' | 'distribute';
  hours_worked: number;
  notes: string;
}

interface SessionCallbacks {
  onSetShowRangeModal: (v: boolean) => void;
  onSetEditingSessionId: (v: number | null) => void;
  onSetRangeForm: (v: RangeForm) => void;
}

export function useProductionSessions(
  fetchData: () => Promise<void>,
  callbacks: SessionCallbacks,
) {
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [sessions, setSessions] = useState<RangeSession[]>([]);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(1);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(null);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [showRecordHistory, setShowRecordHistory] = useState(false);
  const [recordHistory, setRecordHistory] = useState<RecordHistoryEntry[]>([]);
  const [historyRecordId, setHistoryRecordId] = useState<number | null>(null);

  const fetchSessions = async (page = 1) => {
    setSessionsLoading(true);
    try {
      const result = await api.getRangeSessions(page, 20);
      setSessions(result.sessions || []);
      setSessionsTotal(result.total || 0);
      setSessionsPage(result.page || 1);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleEditSession = (session: RangeSession) => {
    callbacks.onSetEditingSessionId(session.id);
    callbacks.onSetRangeForm({
      machine_id: String(session.machine_id), machine_name: session.machine?.name || '',
      mold_id: String(session.mold_id), product_id: String(session.product_id),
      start_date: session.start_date?.split('T')[0] ?? '',
      end_date: session.end_date?.split('T')[0] ?? '',
      total_production_kg: String(Number(session.total_production_kg)),
      mode: (session.mode as 'distribute' | 'sum') || 'distribute',
      hours_worked: Number(session.hours_worked) || 8, notes: session.notes || '',
    });
    setShowSessionDetail(false);
    setShowSessionsModal(false);
    callbacks.onSetShowRangeModal(true);
  };

  const handleDeleteSession = async (sessionId: number) => {
    toast.custom((t) => (
      <div className="bg-slate-800 border border-white/20 rounded-xl p-6 shadow-2xl max-w-sm" dir="rtl">
        <p className="text-white text-lg font-semibold mb-4">
          هل أنت متأكد من حذف هذه الفترة بالكامل؟ سيتم حذف جميع سجلات الإنتاج المرتبطة بها وعكس حركات المخزن.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={() => toast.dismiss(t)} className="px-4 py-2 bg-gray-500/20 text-gray-200 rounded-lg hover:bg-gray-500/30 transition">إلغاء</button>
          <button onClick={async () => {
            toast.dismiss(t);
            try {
              const result = await api.deleteRangeSession(sessionId);
              toast.success(`تم حذف ${result.deletedRecords || 0} سجل بنجاح`);
              setShowSessionDetail(false);
              fetchSessions(sessionsPage);
              fetchData();
            } catch { toast.error('فشل حذف الفترة'); }
          }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">حذف</button>
        </div>
      </div>
    ), { duration: Infinity });
  };

  const openSessionDetail = async (session: RangeSession) => {
    try {
      const detail = await api.getRangeSession(session.id);
      setSelectedSession(detail);
      setShowSessionDetail(true);
    } catch (error) {
      console.error('Failed to fetch session detail:', error);
    }
  };

  const fetchRecordHistory = async (productionId: number) => {
    try {
      const history = await api.getProductionRecordHistory(productionId);
      setRecordHistory(history || []);
      setHistoryRecordId(productionId);
      setShowRecordHistory(true);
    } catch (error) {
      console.error('Failed to fetch record history:', error);
    }
  };

  return {
    showSessionsModal, sessions, sessionsTotal, sessionsPage, sessionsLoading,
    selectedSession, showSessionDetail,
    showRecordHistory, recordHistory, historyRecordId,
    setShowSessionsModal, setShowSessionDetail, setShowRecordHistory,
    setSessionsPage,
    fetchSessions, handleEditSession, handleDeleteSession,
    openSessionDetail, fetchRecordHistory,
  };
}
