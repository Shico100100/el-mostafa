# Task 4: Initialize Capacitor and add Android platform

**Files:**
- Create: `frontend/capacitor.config.ts`
- Modify: `frontend/.gitignore`

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

- [ ] **Step 3: Add android to .gitignore**

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

Expected: Creates `frontend/android/` directory with Android Studio project, no errors

- [ ] **Step 5: Verify Android project exists**

```bash
Test-Path "frontend/android" -PathType Container
```
Expected: True

- [ ] **Step 6: Commit**

```bash
git add frontend/capacitor.config.ts frontend/.gitignore
git commit -m "feat(mobile): initialize Capacitor with Android platform"
```
