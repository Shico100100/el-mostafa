# Task 2: Make API URL configurable via localStorage

**Files:**
- Modify: `frontend/lib/api.ts`

**Interfaces:**
- Consumes: nothing (standalone utility module)
- Produces: `API_BASE` resolved from localStorage → env var → `/api` fallback, `setApiBaseUrl(url)` for Settings page

- [ ] **Step 1: Change `API_URL` from const to dynamic getter**

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
