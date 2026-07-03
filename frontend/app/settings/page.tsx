'use client';

import { useSettings } from '@/hooks/settings/useSettings';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SystemInfoCard, UserInfoCard } from '@/components/settings/InfoCards';
import { SettingsActions } from '@/components/settings/SettingsActions';
import { BackupSection } from '@/components/settings/BackupSection';
import { DangerSection } from '@/components/settings/DangerSection';

export default function SettingsPage() {
  const h = useSettings();

  if (h.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-xl">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" dir="rtl">
      <SettingsHeader />

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SystemInfoCard />
          <UserInfoCard user={h.user} />

          <SettingsActions
            showPasswordModal={h.showPasswordModal}
            newPassword={h.newPassword}
            syncLoading={h.syncLoading}
            onPasswordChange={h.setNewPassword}
            onPasswordSubmit={h.handleChangePassword}
            onPasswordClose={() => h.setShowPasswordModal(false)}
            onSyncMolds={h.handleSyncMolds}
            onSetShowPasswordModal={h.setShowPasswordModal}
          />

          <BackupSection
            backupLoading={h.backupLoading}
            restoreLoading={h.restoreLoading}
            onBackup={h.handleBackup}
            onRestore={h.handleRestore}
          />

          <DangerSection resetLoading={h.resetLoading} onFactoryReset={h.handleFactoryReset} />
        </div>
      </main>
    </div>
  );
}
