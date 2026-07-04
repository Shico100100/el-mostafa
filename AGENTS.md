# Summary: ELMostafa — Full-Stack ERP System

**Date:** 2026-07-04

---

## Architecture
- **Backend:** NestJS on port 3001 (`C:\ELMostafa\backend\node dist\main`)
- **Frontend:** Next.js on port 3000 (`npx next dev -H 0.0.0.0`)
- **Database:** Docker PostgreSQL on port 5432 (container: `backend-postgres-1`)
- **Login:** `admin@admin.com` / `admin123`; also `manager@admin.com`, `worker@admin.com`, `viewer@admin.com` — all `admin123`
- **Roles:** admin=1, manager=3, accountant=4, storekeeper=5, worker=6, viewer=7

---

## Database
- Fresh schema created via `DATABASE_SYNCHRONIZE=true`, then set to `false` permanently
- Demo data seeded via `POST /api/v1/system/seed` (requires admin JWT)
- 58 tables, all TypeORM entities registered

### Running the App
```powershell
docker start backend-postgres-1
cd C:\ELMostafa\backend; node dist/main
cd C:\ELMostafa\frontend; $env:NODE_OPTIONS="--max-old-space-size=2048"; npx next dev -H 0.0.0.0
```

---

## Key Decisions
| Decision | Rationale |
|---|---|
| `DATABASE_SYNCHRONIZE=false` permanently | Avoid overwriting schema with entity changes |
| Products consolidation | `raw_materials` and `accessories` merged into `products` table with `type` discriminator (`RAW`, `ACCESSORY`, `FINISHED`, etc.) |
| `AccessoriesService` queries `Product` entity | Accessories are now products with `type='ACCESSORY'` |
| `RawMaterialService` queries `Product` entity | Raw materials are now products with `type='RAW'` |
| Clean dist rebuild before starting | Old `.tsbuildinfo` cache causes missing modules |

---

## API Endpoints (All return 200)
| Module | Base Path | Key Routes |
|---|---|---|
| Auth | `/api/v1/auth` | `email/login`, `email/register` |
| Dashboard | `/api/v1/dashboard` | `stats` |
| Inventory | `/api/v1/inventory` | `products`, `categories`, `warehouses`, `stock`, `stock/movements` |
| Manufacturing | `/api/v1/manufacturing` | `raw-materials`, `accessories`, `molds`, `machines`, `boms`, `production`, `planning`, `qc/*`, `attendance`, `stock-movements`, `traceability/*`, `feasibility/*` |
| Purchases | `/api/v1/purchases` | `orders`, `suppliers`, `suppliers/:id/payments`, `suppliers/:id/statement` |
| Sales | `/api/v1/sales` | `orders`, `customers`, `customers/:id/payments`, `customers/:id/statement`, `quotes` |
| Accounting | `/api/v1/accounting` | `accounts`, `journal` |
| Payroll | `/api/v1/payroll` | `profiles`, `attendance`, `salary-payments` |
| Reports | `/api/v1/reports` | `production` |
| System | `/api/v1/system` | `seed`, `reset`, `backup` (admin only) |
| Notifications | `/api/v1/notifications` | `GET /`, `GET /unread-count`, `PATCH /:id/read` |
| Documents | `/api/v1/documents` | `GET /`, `POST /`, `DELETE /:id` |
| Audit | `/api/v1/audit` | `GET /` |

---

## Frontend Structure
- `app/` — Next.js App Router pages
- `components/` — Reusable UI components organized by module
- `hooks/` — Custom React hooks (one per API module)
- `lib/api.ts` — Centralized API client

### Sidebar Modules
التصنيع (Manufacturing), المشتريات (Purchases), المبيعات (Sales), المخزون (Inventory), الحسابات (Accounting), الرواتب (Payroll), التقارير (Reports), التنبيهات (Notifications), الإعدادات (Settings)

---

## Emoji Replacement (Completed)
All 317 emoji occurrences across 112 frontend files replaced with lucide-react icons:
- Close buttons `✕` → `<X />`
- Status indicators `🟢⚪` → `<Circle className="fill-green-500" />`
- Dashboard stat icons → `<TrendingUp />`, `<Package />`, `<DollarSign />`, etc.
- Button icons → `<Plus />`, `<Pencil />`, `<Trash2 />`, `<Save />`, etc.
- Header icons → `<Factory />`, `<Wrench />`, `<ClipboardList />`, etc.

---

## Dead Code Cleaned
- `src/inventory/enums/product-type.enum.ts` (unused)
- `src/social/tokens.ts` (unused)
- `src/social/README.md` (unused)
- `src/database/seeds/document/` (MongoDB seeds — not used)
- `src/node_modules/` (accidental artifact)
- Old `.tsbuildinfo` cache files

---

## Frontend RBAC Gating (v1.0.0)
- `frontend/lib/permissions.ts` — 63 route→role mappings (1=admin, 3=manager, 4=accountant, 5=storekeeper, 6=worker, 7=viewer)
- `frontend/lib/resolveRoles.ts` — longest-prefix match
- `frontend/components/ProtectedPage.tsx` — auto page guard (no props, reads from pathname)
- `frontend/components/GlobalSidebar.tsx` — sidebar filtered by role + all pages guarded
- `frontend/lib/usePermission.ts` — exports isAdmin, isManager, isAccountant, isStorekeeper, isWorker, isViewer

## Known Limitations
- MongoDB/Mongoose infrastructure exists in `src/` (unused, from boilerplate template)
- Some seed services in `src/database/seeds/relational/` are not wired into the app
- Migration `down()` methods are incomplete for complex one-way migrations
