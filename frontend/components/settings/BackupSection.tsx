'use client';

interface Props {
  backupLoading: boolean;
  restoreLoading: boolean;
  onBackup: () => void;
  onRestore: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BackupSection({ backupLoading, restoreLoading, onBackup, onRestore }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">النسخ الاحتياطي</h3>
      <div className="space-y-4">
        <button onClick={onBackup} disabled={backupLoading}
          className="w-full px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-200 rounded-lg transition border border-green-500/50 text-right disabled:opacity-50">
          {backupLoading ? 'جاري النسخ...' : 'إنشاء نسخة احتياطية'}
        </button>
        <label className={`w-full px-4 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-200 rounded-lg transition border border-orange-500/50 text-right flex items-center justify-between cursor-pointer ${restoreLoading ? 'opacity-50 pointer-events-none' : ''}`}>
          <span>{restoreLoading ? 'جاري الاستعادة...' : 'استعادة نسخة احتياطية'}</span>
          <input type="file" accept=".sql" onChange={onRestore} className="hidden" disabled={restoreLoading} />
        </label>
      </div>
    </div>
  );
}
