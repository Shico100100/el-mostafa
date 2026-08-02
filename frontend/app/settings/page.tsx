'use client';

import { useState } from 'react';
import { useSettings } from '@/hooks/settings/useSettings';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import { SystemInfoCard, UserInfoCard } from '@/components/settings/InfoCards';
import { SettingsActions } from '@/components/settings/SettingsActions';
import { BackupSection } from '@/components/settings/BackupSection';
import { DangerSection } from '@/components/settings/DangerSection';
import { setApiBaseUrl } from '@/lib/api';

export default function SettingsPage() {
  const h = useSettings();
  const [serverUrl, setServerUrl] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('apiBaseUrl') || '' : ''
  );
  const [connectionStatus, setConnectionStatus] = useState('');
  const [connectionOk, setConnectionOk] = useState(false);

  const testConnection = async () => {
    try {
      const res = await fetch(`${serverUrl.replace(/\/+$/, '')}/api/v1/auth/me`);
      if (res.ok) {
        setConnectionStatus('✓ متصل بنجاح');
        setConnectionOk(true);
      } else {
        setConnectionStatus('✗ فشل الاتصال - تحقق من العنوان');
        setConnectionOk(false);
      }
    } catch {
      setConnectionStatus('✗ لا يمكن الوصول للخادم');
      setConnectionOk(false);
    }
  };

  const saveServerUrl = () => {
    setApiBaseUrl(serverUrl);
    setConnectionStatus('✓ تم الحفظ');
    setConnectionOk(true);
  };

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
            currentPassword={h.currentPassword}
            newPassword={h.newPassword}
            confirmPassword={h.confirmPassword}
            syncLoading={h.syncLoading}
            onCurrentPasswordChange={h.setCurrentPassword}
            onPasswordChange={h.setNewPassword}
            onConfirmPasswordChange={h.setConfirmPassword}
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

        {/* Server Settings */}
        <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
          <h3 className="text-lg font-semibold mb-3 text-white">إعدادات الخادم</h3>
          <p className="text-sm text-slate-400 mb-3">عنوان الخادم لتطبيق الجوال</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.1.100:3001"
              dir="ltr"
              className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm font-mono"
            />
            <button
              onClick={testConnection}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm transition"
            >
              اختبار
            </button>
            <button
              onClick={saveServerUrl}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm transition"
            >
              حفظ
            </button>
          </div>
          {connectionStatus && (
            <p className={`mt-2 text-sm ${connectionOk ? 'text-green-400' : 'text-red-400'}`}>
              {connectionStatus}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
