# Task 5: Build debug APK

**Files:**
- No new files (uses existing `frontend/android/` project)

- [ ] **Step 1: Sync Capacitor with latest web build**

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

If `./gradlew` can't be found, use:
```bash
cd frontend/android
gradlew assembleDebug
```

- [ ] **Step 3: Verify APK exists**

```bash
Test-Path "frontend/android/app/build/outputs/apk/debug/app-debug.apk"
```
Expected: True

- [ ] **Step 4: Commit (only config files — android/ is gitignored)**

```bash
git add frontend/package.json frontend/package-lock.json -A
git commit -m "feat(mobile): Android debug APK build"
```
