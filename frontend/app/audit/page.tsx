'use client';

import { useRouter } from 'next/navigation';
import { useAuditLog } from '@/hooks/audit/useAuditLog';
import { AuditHeader } from '@/components/audit/AuditHeader';
import { AuditTable } from '@/components/audit/AuditTable';
import { AuditPagination } from '@/components/audit/AuditPagination';

export default function AuditLogPage() {
  const router = useRouter();
  const { logs, loading, page, totalPages, totalItems, setPage, formatAction } = useAuditLog();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0f0d] via-[#0a0f0d] to-[#0a0f0d] text-[#ecfdf5] p-8 pt-24" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <AuditHeader onBack={() => router.push('/dashboard')} />
        <div className="bg-[#121a16] border border-[#1f2d26] rounded-3xl p-6 backdrop-blur-xl shadow-2xl">
          <AuditTable logs={logs} loading={loading} formatAction={formatAction} />
          <AuditPagination page={page} totalPages={totalPages} totalItems={totalItems}
            currentCount={logs.length} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}
