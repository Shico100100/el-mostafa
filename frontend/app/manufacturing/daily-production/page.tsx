'use client';

import { useRouter } from 'next/navigation';
import { useDailyProduction } from '@/hooks/manufacturing/useDailyProduction';
import StatsCards from '@/components/manufacturing/StatsCards';
import MachineGrid from '@/components/manufacturing/MachineGrid';
import WeeklyProductionTable from '@/components/manufacturing/WeeklyProductionTable';
import dynamic from 'next/dynamic';
import { Plus, Calendar, FileText, FolderOpen, Download, Upload, Factory, BarChart3 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const BulkProductionModal = dynamic(() => import('@/components/manufacturing/modals/BulkProductionModal'), { ssr: false });
const SingleProductionModal = dynamic(() => import('@/components/manufacturing/modals/SingleProductionModal'), { ssr: false });
const RangeProductionModal = dynamic(() => import('@/components/manufacturing/modals/RangeProductionModal'), { ssr: false });
const SessionsModal = dynamic(() => import('@/components/manufacturing/modals/SessionsModal'), { ssr: false });
const SessionDetailModal = dynamic(() => import('@/components/manufacturing/modals/SessionDetailModal'), { ssr: false });
const RecordHistoryModal = dynamic(() => import('@/components/manufacturing/modals/RecordHistoryModal'), { ssr: false });
const StockErrorDialog = dynamic(() => import('@/components/manufacturing/modals/StockErrorDialog'), { ssr: false });
const SubstitutePicker = dynamic(() => import('@/components/manufacturing/modals/SubstitutePicker'), { ssr: false });

export default function DailyProductionPage() {
  const router = useRouter();
  const h = useDailyProduction();

  const rawMaterialNames: Record<number, string> = {};
  h.rawMaterials.forEach(rm => {
    if (rm.id) rawMaterialNames[rm.id] = rm.product?.name || `خامة #${rm.id}`;
  });

  if (h.loading && !h.showModal && !h.showSingleModal && !h.showRangeModal) {
    return (
      <div className="min-h-screen bg-[#0a0f0d] text-white p-6 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500 mx-auto mb-4" />
          <p className="text-[#6b8378]">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0f1714] to-[#0a0f0d] text-white p-4 md:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-[#16241d]/50 rounded-lg transition text-[#6b8378] hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>
            </button>
            <div>
              <h1 className="text-3xl font-bold">تسجيل الإنتاج اليومي</h1>
              <p className="text-[#6b8378] mt-1">متابعة وتسجيل إنتاج الماكينات — {h.date}</p>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto flex-wrap">
            <input
              type="date"
              value={h.date}
              onChange={(e) => h.setDate(e.target.value)}
              className="bg-[#0f1714] border border-[#1f2d26] rounded-lg px-4 py-2 text-white outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-auto"
            />
            <button onClick={h.handleOpenModal} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 whitespace-nowrap">
              <span><Plus /></span> تسجيل إنتاج جديد
            </button>
            <button onClick={() => h.setShowRangeModal(true)} className="bg-emerald-600 hover:bg-emerald-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 whitespace-nowrap">
              <span><Calendar /></span> إنتاج فترة
            </button>
            <button onClick={() => { h.fetchSessions(); h.setShowSessionsModal(true); }} className="bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg font-bold transition flex items-center gap-2 whitespace-nowrap">
              <span><FileText /></span> سجل الفترات
            </button>
            <div className="relative group">
              <button className="bg-[#16241d] hover:bg-[#1f2d26] px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 whitespace-nowrap">
                <span><FolderOpen /></span> تصدير/استيراد
              </button>
              <div className="absolute left-0 top-full mt-2 bg-[#0f1714] border border-[#1f2d26] rounded-xl shadow-2xl z-50 hidden group-hover:block min-w-[200px]">
                <button onClick={h.exportHistory} className="w-full text-right px-4 py-3 hover:bg-[#16241d] rounded-t-xl transition flex items-center gap-2">
                  <span><Download /></span> تصدير إلى Excel
                </button>
                <label className="w-full text-right px-4 py-3 hover:bg-[#16241d] rounded-b-xl transition flex items-center gap-2 cursor-pointer">
                  <span><Upload /></span> استيراد من Excel
                  <input type="file" accept=".xlsx" className="hidden" onChange={h.importHistory} />
                </label>
              </div>
            </div>
          </div>
        </div>

        <StatsCards
          todayTotalKg={h.todayTotalKg}
          todayTotalPieces={h.todayTotalPieces}
          activeMachinesCount={h.activeMachinesCount}
          totalMachines={h.machines.length}
          machinesInProduction={h.machinesInProduction}
          avgPerMachine={h.avgPerMachine}
        />

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span><Factory /></span> جميع الماكينات</h2>
          <MachineGrid
            machines={h.machines}
            molds={h.molds}
            rawMaterials={h.rawMaterials}
            dailyRecords={h.dailyRecords}
            weeklyMoldAvg={h.weeklyMoldAvg}
            weeklyMachineKg={h.weeklyMachineKg}
            moldStats={h.moldStats}
            onOpenModal={h.handleOpenModal}
            onOpenSingleModal={h.handleOpenSingleModal}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><span><BarChart3 /></span> إنتاج آخر 30 يوم</h2>
          <WeeklyProductionTable
            records={h.weeklyRecords}
            weeklyMoldAvg={h.weeklyMoldAvg}
            moldStats={h.moldStats}
            onShowHistory={h.fetchRecordHistory}
          />
        </div>
      </div>

      <BulkProductionModal
        show={h.showModal}
        isEditMode={h.isEditMode}
        date={h.date}
        bulkData={h.bulkData}
        molds={h.molds}
        rawMaterials={h.rawMaterials}
        weeklyMoldAvg={h.weeklyMoldAvg}
        moldStats={h.moldStats}
        loading={h.loading}
        onClose={() => { h.setShowModal(false); h.setIsEditMode(false); }}
        onBulkChange={h.handleBulkChange}
        onSave={h.handleSaveBulk}
      />

      <SingleProductionModal
        show={h.showSingleModal}
        machine={h.singleMachine}
        form={h.singleForm}
        molds={h.molds}
        rawMaterials={h.rawMaterials}
        loading={h.loading}
        onClose={() => h.setShowSingleModal(false)}
        onFieldChange={h.handleSingleFieldChange}
        onSave={h.handleSaveSingle}
      />

      <RangeProductionModal
        show={h.showRangeModal}
        editingSessionId={h.editingSessionId}
        rangeForm={h.rangeForm}
        machines={h.machines}
        molds={h.molds}
        rawMaterials={h.rawMaterials}
        loading={h.loading}
        getWorkingDays={h.getWorkingDays}
        onClose={() => { h.setShowRangeModal(false); h.setEditingSessionId(null); }}
        onFormChange={h.setRangeForm}
        onSave={h.handleSaveRange}
      />

      <SessionsModal
        show={h.showSessionsModal}
        sessions={h.sessions}
        sessionsTotal={h.sessionsTotal}
        sessionsPage={h.sessionsPage}
        sessionsLoading={h.sessionsLoading}
        onClose={() => h.setShowSessionsModal(false)}
        onSessionClick={h.openSessionDetail}
        onPageChange={(page) => h.fetchSessions(page)}
      />

      <SessionDetailModal
        show={h.showSessionDetail}
        detail={h.selectedSession}
        onClose={() => h.setShowSessionDetail(false)}
        onEdit={h.handleEditSession}
        onDelete={h.handleDeleteSession}
        onShowHistory={h.fetchRecordHistory}
      />

      <RecordHistoryModal
        show={h.showRecordHistory}
        entries={h.recordHistory}
        recordId={h.historyRecordId}
        onClose={() => h.setShowRecordHistory(false)}
      />

      <StockErrorDialog
        show={h.showStockDialog}
        error={h.stockError}
        rawMaterialNames={rawMaterialNames}
        onAllowNegative={h.handleAllowNegativeStock}
        onSubstitute={h.handleOpenSubstitutePicker}
        onCancel={h.handleCancelStockAction}
      />

      <SubstitutePicker
        show={h.showSubstitutePicker}
        rawMaterials={h.rawMaterials}
        stockError={h.stockError}
        onSelect={h.handleSubstituteMaterial}
        onClose={() => h.setShowSubstitutePicker(false)}
      />
    </div>
    </ErrorBoundary>
  );
}
