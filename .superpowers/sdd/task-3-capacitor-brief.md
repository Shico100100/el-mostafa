# Task 3: Add server IP settings to Settings page

**Files:**
- Modify: `frontend/app/settings/page.tsx`

- [ ] **Step 1: Read the existing Settings page**

Read `frontend/app/settings/page.tsx` to understand its structure.

- [ ] **Step 2: Add server IP input section**

Add after the existing settings sections:

```typescript
import { setApiBaseUrl } from '@/lib/api';
```

Add state and handlers inside the component:
```typescript
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
```

Add JSX before the closing `</div>` of the main container:
```tsx
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
```

- [ ] **Step 3: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add frontend/app/settings/page.tsx
git commit -m "feat(mobile): add server IP configuration to settings"
```
