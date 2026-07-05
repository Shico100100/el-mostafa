# Capacitor Android APK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wrap the existing Next.js ERP frontend into an Android APK using Capacitor, talking to the same NestJS backend.

**Architecture:** Next.js static export (`output: 'export'`) → Capacitor WebView → calls NestJS API at user-configurable server IP. The API base URL is stored in localStorage so the user can change it from Settings without rebuilding the APK.

**Tech Stack:** Capacitor 6, Next.js 14 static export, TypeScript, Android SDK 34+

## Global Constraints

- All frontend files in `frontend/` directory
- Capacitor config file at `frontend/capacitor.config.ts` (alongside next.config.ts so npm scripts see it)
- `API_URL` in `lib/api.ts` must fall back to localStorage → env var → default `/api`
- Next.js must use `output: 'export'`, `images.unoptimized: true`, `trailingSlash: true`
- Android APK must be buildable on this machine
- All existing tests must pass after changes
- No breaking changes to existing web app behavior

---
### Task 1: Update `next.config.ts` for static export

**Files:**
- Modify: `frontend/next.config.ts`

**Interfaces:**
- Consumes: nothing (standalone config file)
- Produces: Static-export-compatible config that generates `out/` directory

- [ ] **Step 1: Update `next.config.ts`**

Read the existing file, then write:

```typescript
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  reactStrictMode: true,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
```

Key changes:
- `output: 'standalone'` → `output: 'export'` (static HTML generation, no Node.js server needed)
- `trailingSlash: true` ensures `/sales/` not `/sales` — Capacitor WebView resolves relative paths correctly with trailing slashes
- `images: { unoptimized: true }` — Next.js Image Optimization requires a server; static export needs this
- Removed `rewrites()`, `turbopack`, `experimental`, `allowedDevOrigins` — none work in static export

- [ ] **Step 2: Verify build**

Run: `cd frontend; npx next build`
Expected: Generates `out/` directory with index.html, no errors

- [ ] **Step 3: Verify existing tests still pass**

Run: `cd frontend; npx vitest run --reporter=verbose`
Expected: All tests passing

- [ ] **Step 4: Commit**

```bash
git add frontend/next.config.ts
git commit -m "feat(mobile): switch to static export for Capacitor"
```

### Task 2: Make API URL configurable via localStorage

**Files:**
- Modify: `frontend/lib/api.ts`

**Interfaces:**
- Consumes: nothing (standalone utility module)
- Produces: `API_BASE` resolved from localStorage → env var → `/api` fallback, `setApiBaseUrl(url)` for Settings page

- [ ] **Step 1: Update `API_URL` resolution**

Change line 32 from:
```typescript
const API_URL = '/api';
```
to:
```typescript
function getApiUrl(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('apiBaseUrl');
    if (stored) return stored.replace(/\/+$/, '');
  }
  return '/api';
}

let API_URL = getApiUrl();
```

- [ ] **Step 2: Add `setApiBaseUrl` export**

Add before the `export const api` block:
```typescript
export function setApiBaseUrl(url: string): void {
  localStorage.setItem('apiBaseUrl', url.replace(/\/+$/, ''));
  API_URL = url.replace(/\/+$/, '');
}
```

- [ ] **Step 3: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 4: Verify existing tests pass**

Run: `cd frontend; npx vitest run --reporter=verbose`
Expected: All 14 tests passing

- [ ] **Step 5: Commit**

```bash
git add frontend/lib/api.ts
git commit -m "feat(mobile): make API base URL configurable via localStorage"
```

### Task 3: Add server IP settings to Settings page

**Files:**
- Modify: `frontend/app/settings/page.tsx`

- [ ] **Step 1: Add server IP input**

Read the existing Settings page. Add a section with:
- Text input for server IP (default loads from localStorage)
- "Test Connection" button that hits `${url}/api/v1/auth/me`
- "Save" button that calls `setApiBaseUrl()`
- Success/error feedback

The implementation should be minimal (~30 lines added). Example:

```typescript
// After existing settings sections, add:
<div className="mt-6">
  <h3 className="text-lg font-semibold mb-3">إعدادات الخادم</h3>
  <div className="flex gap-2">
    <input
      type="text"
      value={serverUrl}
      onChange={(e) => setServerUrl(e.target.value)}
      placeholder="http://192.168.1.100:3001"
      className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white"
    />
    <button
      onClick={testConnection}
      className="px-4 py-2 bg-blue-600 rounded-lg text-white text-sm"
    >
      اختبار الاتصال
    </button>
    <button
      onClick={saveServerUrl}
      className="px-4 py-2 bg-green-600 rounded-lg text-white text-sm"
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

With state:
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

Import `setApiBaseUrl`:
```typescript
import { setApiBaseUrl } from '@/lib/api';
```

- [ ] **Step 2: Verify**

Run: `cd frontend; npx tsc --noEmit`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add frontend/app/settings/page.tsx
git commit -m "feat(mobile): add server IP configuration to Settings"
```

### Task 4: Initialize Capacitor and add Android platform

**Files:**
- Create: `frontend/capacitor.config.ts`
- Modify: `frontend/package.json` (add dependency scripts)

- [ ] **Step 1: Install Capacitor packages**

```bash
cd frontend
npm install @capacitor/core @capacitor/cli @capacitor/android
```

- [ ] **Step 2: Create `capacitor.config.ts`**

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.elmostafa.erp',
  appName: 'المصطفى ERP',
  webDir: 'out',
  server: {
    androidScheme: 'http',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
```

Key settings:
- `webDir: 'out'` — points to Next.js static export output
- `server.androidScheme: 'http'` — the backend runs on HTTP, not HTTPS
- `cleartext: true` + `allowMixedContent: true` — allows HTTP requests from the WebView

- [ ] **Step 3: Add `android` entry to `.gitignore`**

Append to `frontend/.gitignore`:
```
/android/
```

- [ ] **Step 4: Build static export and add Android platform**

```bash
cd frontend
npx next build
npx cap add android
```

Expected: Creates `frontend/android/` directory with Android Studio project

- [ ] **Step 5: Verify Android project exists**

Run: `Test-Path "frontend/android" -PathType Container`
Expected: True (directory exists with `build.gradle`, `app/`, etc.)

- [ ] **Step 6: Commit**

```bash
git add frontend/capacitor.config.ts frontend/package.json frontend/package-lock.json frontend/.gitignore
git commit -m "feat(mobile): initialize Capacitor with Android platform"
```

### Task 5: Build debug APK

**Files:**
- Modify: `frontend/android/app/build.gradle` (update minSdkVersion if needed)

- [ ] **Step 1: Sync Capacitor with latest build**

```bash
cd frontend
npx next build
npx cap sync
```

- [ ] **Step 2: Build debug APK**

```bash
cd frontend/android
./gradlew assembleDebug
```

Expected: Builds successfully, creates APK at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

- [ ] **Step 3: Verify APK exists**

```bash
Test-Path "frontend/android/app/build/outputs/apk/debug/app-debug.apk"
```
Expected: True

- [ ] **Step 4: Commit**

```bash
git commit -m "feat(mobile): initial Android debug APK compatible build"
```
