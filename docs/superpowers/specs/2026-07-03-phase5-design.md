# Phase 5: RBAC, Frontend UI, Seed Data, CI/CD & Migrations

## 1. RBAC (Roles & Permissions)

**Roles:**
| Role | Permissions |
|---|---|
| Admin | Full access to everything |
| Manager | CRUD most entities, view reports |
| Worker | POST to production endpoint only. No GET, PUT, PATCH, DELETE access to any entity |
| Viewer | Read-only access to all entities |

**Implementation:**
- Create `roles` enum: `ADMIN`, `MANAGER`, `WORKER`, `VIEWER`
- Add `role` column to `users` table
- Create `@Roles('ADMIN', 'MANAGER')` decorator + `RolesGuard`
- New seed user for each role: `manager@admin.com`, `worker@admin.com`, `viewer@admin.com`
- Auth response includes `role` so frontend can gate UI

**Endpoints:**
- `POST /api/v1/auth/register` — already exists, accepts `role` (admin-only)
- `GET /api/v1/users` — list users (admin/manager)
- `PATCH /api/v1/users/:id/role` — change role (admin-only)

## 2. Frontend UI

### Notifications
- Bell icon in top navbar with unread badge
- Dropdown shows last 5 notifications with "View All" link
- `/notifications` page with full list, mark-as-read

### Documents
- `/documents` page showing all uploaded files
- Tab on sale/purchase order detail pages
- Upload button (file picker, entity association)
- Download via `GET /documents/:id/download`

### Audit Log
- `/audit` page (admin-only)
- Table: timestamp, user, action, entity, entityId, IP
- Filter by entity type, action, date range

### Currency Management
- `/currencies` page (admin-only)
- Table of currencies with exchange rates
- Add/edit/delete currencies and rates

## 3. Seed Data Update

Add to `/api/v1/system/seed`:
- Notifications: 3 low-stock, 2 overdue-order, 1 system notification
- Documents: 2 sample invoice PDFs (metadata only)
- Exchange rates: MAD→USD, MAD→EUR, USD→EUR
- Users: manager@admin.com, worker@admin.com, viewer@admin.com with roles

## 4. CI/CD (GitHub Actions)

**Workflow file:** `.github/workflows/ci.yml`
**Triggers:** `pull_request` targeting `main`
**Jobs:**
- `test`:
  - Spin up postgres service container
  - Install deps, lint, typecheck
  - Run unit tests + integration tests
  - Upload coverage report
- `e2e`:
  - Spin up postgres + redis service containers
  - Start backend, run Playwright tests
- `build`:
  - Docker Compose build (no push)

## 5. Database Migrations

**Approach:**
1. Install `ts-node` and configure TypeORM CLI in `package.json`
2. Run `typeorm migration:generate -n InitialSchema` from existing entities
3. Add `npm run migration:run` script
4. Update docker-compose backend command to run migrations before starting
5. Remove `DATABASE_SYNCHRONIZE` fallback entirely
6. Add migration to `src/database/migrations/`

---

## Implementation Order

1. RBAC (backend: roles, guard, decorator, seed users)
2. Database Migrations (generate initial migration, set up CLI)
3. Seed Data Update (add new seeds)
4. Frontend UI (notifications → documents → audit → currencies)
5. CI/CD (GitHub Actions)

Commits: one per sub-project, ~5 total.
