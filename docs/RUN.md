# Runbook — EL-Mostafa

Procedures for running, testing, backing up, and CI for the EL-Mostafa app
(frontend: Next.js on :3000, backend: NestJS on :3001, Postgres on :5432).

## 1. Start / stop the servers (local)

From the repo root:

```powershell
pwsh scripts/start-servers.ps1   # stops any old instances, builds + starts both, health-checks
pwsh scripts/stop-servers.ps1    # stops processes on ports 3000/3001
```

Both servers bind IPv4 only (`0.0.0.0` backend, `127.0.0.1` API default) — IPv6 is disabled
by design (see commit history). Wait until both health checks print `OK`.

## 2. Smoke test (green-state guard)

```powershell
pwsh scripts/smoke-test.ps1
```

Exits `0` only if backend `/api/v1/health` and frontend `/login/` both respond.
Run this after any change to confirm the app is healthy.

## 3. Database backup

```powershell
pwsh scripts/backup-db.ps1                 # default -> ./backups, keeps last 7
pwsh scripts/backup-db.ps1 -Keep 14        # keep more copies
```

Reads DB credentials from `backend/.env` at runtime (no secrets stored in the script).
Produces a compressed `backup_<timestamp>.dump`. Restore with:

```powershell
$env:PGPASSWORD='postgres'
pg_restore -h 127.0.0.1 -p 5432 -U postgres -d elmostafa_db -c backups\backup_YYYY_MM_DD_HHmmss.dump
```

## 4. Tests

| Layer        | Command (in folder)              | Notes |
|--------------|----------------------------------|-------|
| Backend unit | `cd backend && npm test`         | Jest, 169 tests |
| Frontend unit| `cd frontend && npm test`        | Vitest, 165 tests |
| E2E (Playwright) | `cd frontend && npx playwright test` | requires servers running (step 1) |
| E2E (Cypress)   | `cd frontend && npm run cypress:run` | 16 specs |

Playwright specs log in as `admin@admin.com` / `admin123` (seeded user). The
`dashboard.spec.ts` "navigate to inventory" test clicks the real sidebar
(`المخزون` → `لوحة المخزون`), which only renders once authenticated (role gate in
`GlobalSidebar.tsx`).

## 5. CI

`.github/workflows/ci.yml` runs on push/PR to `master`:

- **quality** job: install, lint + typecheck, backend Jest, frontend Vitest.
- **e2e** job: Postgres + Redis service containers, builds both apps, runs
  `migration:run` + `seed:run:relational` (creates the admin user), starts both
  servers, then runs Playwright. A `playwright-report` artifact is uploaded on
  failure.

### CI assumptions / things to verify
- Secrets in the e2e job are dummy placeholders; rotate if needed.
- If the backend also requires MongoDB at startup, add a `mongodb` service and
  set `DATABASE_URL` accordingly.
- The local `smoke-test.ps1` is Windows/PowerShell only; CI uses `curl` for the
  same health checks.
