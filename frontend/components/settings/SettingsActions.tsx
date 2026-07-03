'use client';

interface Props {
  showPasswordModal: boolean;
  newPassword: string;
  syncLoading: boolean;
  onPasswordChange: (v: string) => void;
  onPasswordSubmit: (e: React.FormEvent) => void;
  onPasswordClose: () => void;
  onSyncMolds: () => void;
  onSetShowPasswordModal: (v: boolean) => void;
}

export function SettingsActions({
  showPasswordModal, newPassword, syncLoading,
  onPasswordChange, onPasswordSubmit, onPasswordClose,
  onSyncMolds, onSetShowPasswordModal,
}: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-lg p-6 rounded-2xl border border-white/20">
      <h3 className="text-xl font-bold text-white mb-4">إعدادات عامة</h3>
      <div className="space-y-4">
        <button onClick={() => onSetShowPasswordModal(true)}
          className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 rounded-lg transition border border-blue-500/50 text-right">
          تغيير كلمة المرور
        </button>
        <button onClick={onSyncMolds} disabled={syncLoading}
          className="w-full px-4 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 rounded-lg transition border border-indigo-500/50 text-right disabled:opacity-50">
          {syncLoading ? 'جاري المزامنة...' : 'مزامنة الأصناف مع الإسطمبات'}
        </button>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50" onClick={onPasswordClose}>
          <div className="bg-slate-800 p-8 rounded-2xl w-full max-w-md border border-white/20" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-6">تغيير كلمة المرور</h2>
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">كلمة المرور الجديدة</label>
                <input type="password" value={newPassword} onChange={(e) => onPasswordChange(e.target.value)} required
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white" />
              </div>
              <div className="flex gap-4 justify-end mt-6">
                <button type="button" onClick={onPasswordClose} className="px-6 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-200 rounded-lg">إلغاء</button>
                <button type="submit" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700">حفظ</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
