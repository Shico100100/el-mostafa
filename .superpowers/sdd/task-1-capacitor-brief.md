# Task 1: Update `next.config.ts` for static export

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
