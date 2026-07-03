'use client';

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DRAFT: 'bg-gray-500/20 text-gray-400',
    SENT: 'bg-blue-500/20 text-blue-400',
    ACCEPTED: 'bg-emerald-500/20 text-emerald-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    CONVERTED: 'bg-purple-500/20 text-purple-400',
  };
  const labels: Record<string, string> = {
    DRAFT: 'مسودة', SENT: 'أرسل للعميل', ACCEPTED: 'مقبول',
    REJECTED: 'مرفوض', CONVERTED: 'تم التحويل',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-gray-500/20 text-gray-400'}`}>
      {labels[status] || status}
    </span>
  );
}
