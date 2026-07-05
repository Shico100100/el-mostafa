# Phase 5: RBAC, Frontend UI, Seed Data, CI/CD & Migrations

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add RBAC, frontend UI for 4 new features, seed data update, CI/CD pipeline, and database migrations.

**Architecture:** Backend-first: RBAC guards protect endpoints before frontend is built. Migrations generated from current entities. CI/CD validates all tests on PR to main.

**Tech Stack:** NestJS (backend), Next.js (frontend), TypeORM (migrations), GitHub Actions (CI/CD)

**Tech to install:**
- `backend`: `ts-node` (for migrations CLI)
- `frontend`: `lucide-react` (already installed)

## Global Constraints

- `DATABASE_SYNCHRONIZE=false` permanently — never re-enable
- All new API endpoints must use existing global prefix `/api/v1/`
- Frontend uses App Router, lucide-react icons, Arabic-first
- Worker role has POST-only access to production — zero read/list access
- Admin-only pages: `/audit`, `/currencies`, user management

---

### Task 1: RBAC — Backend Roles, Guard, Decorator, Seed Users

**Files:**
- Create: `backend/src/common/enums/role.enum.ts`
- Create: `backend/src/common/guards/roles.guard.ts`
- Create: `backend/src/common/decorators/roles.decorator.ts`
- Modify: `backend/src/auth/auth.service.ts` (assign default role on register)
- Modify: `backend/src/auth/entities/user.entity.ts` (add `role` column)
- Modify: `backend/src/database/seeds/relational/user/user-seed.service.ts` (add manager/worker/viewer)
- Modify: `backend/src/app.module.ts` (register RolesGuard globally)
- Test: `backend/src/common/guards/roles.guard.spec.ts`

**Interfaces:**
- Consumes: `User` entity, `JwtAuthGuard`
- Produces: `Role` enum, `@Roles()` decorator, `RolesGuard`

- [ ] **Step 1: Create role enum**

```typescript
// src/common/enums/role.enum.ts
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  WORKER = 'WORKER',
  VIEWER = 'VIEWER',
}
```

- [ ] **Step 2: Add role column to User entity**

```typescript
// src/auth/entities/user.entity.ts
import { Role } from '../../common/enums/role.enum';

// Add column:
@Column({ type: 'enum', enum: Role, default: Role.VIEWER })
role: Role;
```

- [ ] **Step 3: Create @Roles() decorator**

```typescript
// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

- [ ] **Step 4: Create RolesGuard**

```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}
```

- [ ] **Step 5: Register RolesGuard in app.module.ts**

```typescript
// src/app.module.ts — add to providers
{ provide: 'APP_GUARD', useClass: RolesGuard },
```

- [ ] **Step 6: Assign default role in auth.service.ts**

In `register()` method, add:
```typescript
const user = this.userRepo.create({
  ...dto,
  role: dto.role || Role.VIEWER,
  password: hashedPassword,
});
```

- [ ] **Step 7: Update seed service to create role-specific users**

```typescript
// user-seed.service.ts — after admin user, add:
await this.userRepo.save([
  { email: 'manager@admin.com', password: hashedPassword, role: Role.MANAGER, name: 'Manager' },
  { email: 'worker@admin.com', password: hashedPassword, role: Role.WORKER, name: 'Worker' },
  { email: 'viewer@admin.com', password: hashedPassword, role: Role.VIEWER, name: 'Viewer' },
]);
```

- [ ] **Step 8: Write roles guard test**

```typescript
// src/common/guards/roles.guard.spec.ts
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access when no roles required', () => {
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.VIEWER } }),
      }),
    } as any;
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.WORKER } }),
      }),
    } as any;
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should allow access when role matches', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const context = {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user: { role: Role.ADMIN } }),
      }),
    } as any;
    expect(guard.canActivate(context)).toBe(true);
  });
});
```

- [ ] **Step 9: Run tests**

```bash
cd C:\ELMostafa\backend; npx jest roles.guard.spec.ts -v
```
Expected: PASS (3/3)

- [ ] **Step 10: Check typecheck**

```bash
cd C:\ELMostafa\backend; npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 11: Commit**

```bash
git add backend/src/common/enums/ backend/src/common/guards/roles.guard.ts backend/src/common/decorators/ backend/src/auth/ backend/src/database/seeds/ backend/src/app.module.ts
git commit -m "feat(rbac): add roles, RolesGuard, decorator, and seed users"
```

---

### Task 2: RBAC — Protect Endpoints with @Roles()

**Files:**
- Modify: `backend/src/manufacturing/production.controller.ts` (add @Roles decorator)
- Modify: `backend/src/dashboard/dashboard.controller.ts` (add @Roles decorator)
- Modify: `backend/src/inventory/products.controller.ts` (add @Roles decorator)
- Modify: `backend/src/sales/sales.controller.ts` (add @Roles decorator)
- Modify: `backend/src/purchases/purchases.controller.ts` (add @Roles decorator)
- Modify: `backend/src/notifications/notifications.controller.ts` (add @Roles decorator)
- Modify: `backend/src/currency/currency.controller.ts` (add @Roles decorator)
- Modify: `backend/src/documents/documents.controller.ts` (add @Roles decorator)
- Test: Verify existing integration tests still pass

**Interfaces:**
- Consumes: `@Roles()` decorator from Task 1
- Produces: Protected controllers

- [ ] **Step 1: Protect dashboard (admin/manager/viewer)**

```typescript
// dashboard.controller.ts
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';

@Controller('dashboard')
@Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
export class DashboardController { ... }
```

- [ ] **Step 2: Protect inventory/admin endpoints**

```typescript
// products.controller.ts
@Controller('products')
@Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
export class ProductsController { ... }
```

- [ ] **Step 3: Protect sales/purchases (admin + manager)**

```typescript
// sales.controller.ts
@Controller('sales')
@Roles(Role.ADMIN, Role.MANAGER)
export class SalesController { ... }

// purchases.controller.ts
@Controller('purchases')
@Roles(Role.ADMIN, Role.MANAGER)
export class PurchasesController { ... }
```

- [ ] **Step 4: Protect notifications/currency/documents (admin + manager)**

```typescript
// notifications.controller.ts
@Controller('notifications')
@Roles(Role.ADMIN, Role.MANAGER)
export class NotificationsController { ... }

// currency.controller.ts
@Controller('currencies')
@Roles(Role.ADMIN)
export class CurrencyController { ... }

// documents.controller.ts
@Controller('documents')
@Roles(Role.ADMIN, Role.MANAGER)
export class DocumentsController { ... }
```

- [ ] **Step 5: Handle Worker — production controller**

Create a special endpoint for workers:
```typescript
// production.controller.ts
@Controller('production')
export class ProductionController {
  // Worker can only POST (create production records)
  @Post('daily')
  @Roles(Role.ADMIN, Role.MANAGER, Role.WORKER)
  createDaily(@Body() dto: any) { ... }

  // List/view only for admin/manager/viewer
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  findAll() { ... }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER, Role.VIEWER)
  findOne(@Param('id') id: number) { ... }
}
```

- [ ] **Step 6: Run integration tests**

```bash
cd C:\ELMostafa\backend; npm run test
```
Expected: All tests PASS

- [ ] **Step 7: Check typecheck**

```bash
cd C:\ELMostafa\backend; npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 8: Commit**

```bash
git add backend/src/controllers/ backend/src/dashboard/ backend/src/notifications/ backend/src/currency/ backend/src/documents/
git commit -m "feat(rbac): protect all endpoints with @Roles decorator"
```

---

### Task 3: Database Migrations Setup

**Files:**
- Create: `backend/src/typeorm-cli.config.ts`
- Create: `backend/src/database/migrations/.gitkeep`
- Modify: `backend/package.json` (add migration scripts)
- Modify: `backend/.env` (remove DATABASE_SYNCHRONIZE note, ensure DATABASE_MIGRATIONS_RUN=true)
- Modify: `backend/src/app.module.ts` (remove synchronize, add migrationsRun)
- Modify: `backend/docker-compose.yml` (startup command runs migrations)
- Test: Verify migration can generate and run

**Interfaces:**
- Consumes: TypeORM entities
- Produces: Migration files, CLI scripts

- [ ] **Step 1: Install ts-node**

```bash
cd C:\ELMostafa\backend; npm install ts-node --save-dev
```

- [ ] **Step 2: Create TypeORM CLI config**

```typescript
// src/typeorm-cli.config.ts
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres',
  database: process.env.DATABASE_DATABASE || 'erp',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});
```

- [ ] **Step 3: Add migration scripts to package.json**

```json
// package.json — add to "scripts"
"migration:generate": "typeorm-ts-node-commonjs migration:generate -d src/typeorm-cli.config.ts",
"migration:run": "typeorm-ts-node-commonjs migration:run -d src/typeorm-cli.config.ts",
"migration:revert": "typeorm-ts-node-commonjs migration:revert -d src/typeorm-cli.config.ts"
```

- [ ] **Step 4: Update app.module.ts to use migrations**

```typescript
// app.module.ts — TypeOrmModule.forRoot() options
synchronize: false,
migrationsRun: true,
migrations: ['dist/database/migrations/*.js'],
```

- [ ] **Step 5: Generate initial migration**

```bash
cd C:\ELMostafa\backend; npx typeorm-ts-node-commonjs migration:generate -d src/typeorm-cli.config.ts src/database/migrations/InitialSchema
```
Expected: Migration file created in `src/database/migrations/`

- [ ] **Step 6: Verify migration compiles**

```bash
cd C:\ELMostafa\backend; npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 7: Commit**

```bash
git add backend/src/typeorm-cli.config.ts backend/src/database/migrations/ backend/package.json backend/src/app.module.ts
git commit -m "feat: add TypeORM migrations with initial schema snapshot"
```

---

### Task 4: Update Seed Data

**Files:**
- Modify: `backend/src/database/seeds/relational/system-seed.service.ts` (or equivalent seed service)
- Modify: `backend/src/notifications/notifications.service.ts` (add seed method)
- Test: Run seed endpoint and verify

**Interfaces:**
- Consumes: NotificationsService, DocumentsService, CurrencyService from existing modules
- Produces: Demo seed data for all new features

- [ ] **Step 1: Add seed data for notifications**

In the seed service, after creating demo records:
```typescript
// Seed notifications
await this.notificationsService.create({
  type: 'low_stock', title: 'مخزون منخفض', message: 'المادة الخام PP-001 تحت الحد الأدنى', link: '/inventory/products',
});
await this.notificationsService.create({
  type: 'low_stock', title: 'مخزون منخفض', message: 'المادة الخام HDPE-005 تحت الحد الأدنى', link: '/inventory/products',
});
await this.notificationsService.create({
  type: 'overdue_order', title: 'طلب متأخر', message: 'طلب المبيعات SO-003 متأخر عن التسليم', link: '/sales/orders/3',
});
await this.notificationsService.create({
  type: 'attendance', title: 'حضور', message: 'تم تسجيل حضور 12 عاملاً اليوم', link: '/manufacturing/attendance',
});
await this.notificationsService.create({
  type: 'system', title: 'تحديث النظام', message: 'تم تحديث النظام إلى الإصدار v2.0', link: null,
});
await this.notificationsService.create({
  type: 'overdue_order', title: 'فاتورة مستحقة', message: 'فاتورة الشراء PO-002 مستحقة الدفع', link: '/purchases/orders/2',
});
```

- [ ] **Step 2: Add seed currencies + exchange rates**

```typescript
// Seed currencies
const mad = await this.currencyRepo.save({ code: 'MAD', name: 'درهم مغربي', decimalPlaces: 2 });
const usd = await this.currencyRepo.save({ code: 'USD', name: 'دولار أمريكي', decimalPlaces: 2 });
const eur = await this.currencyRepo.save({ code: 'EUR', name: 'يورو', decimalPlaces: 2 });

// Seed exchange rates
await this.rateRepo.save([
  { fromCurrency: 'USD', toCurrency: 'MAD', rate: 9.85 },
  { fromCurrency: 'EUR', toCurrency: 'MAD', rate: 10.72 },
  { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92 },
  { fromCurrency: 'EUR', toCurrency: 'USD', rate: 1.09 },
  { fromCurrency: 'MAD', toCurrency: 'USD', rate: 0.10 },
  { fromCurrency: 'MAD', toCurrency: 'EUR', rate: 0.093 },
]);
```

- [ ] **Step 3: Run seed endpoint**

```bash
# Login as admin, get token
$token = (curl -s -X POST http://localhost:3001/api/v1/auth/email/login -H "Content-Type: application/json" -d '{"email":"admin@admin.com","password":"admin123"}' | ConvertFrom-Json).token

# Run seed
curl -X POST http://localhost:3001/api/v1/system/seed -H "Authorization: Bearer $token"
```
Expected: 200 OK

- [ ] **Step 4: Verify seed data**

```bash
curl http://localhost:3001/api/v1/notifications -H "Authorization: Bearer $token" | ConvertFrom-Json | Select-Object -ExpandProperty length
```
Expected: 6 notifications

- [ ] **Step 5: Commit**

```bash
git add backend/src/database/seeds/
git commit -m "feat: seed notification, currency, and exchange rate demo data"
```

---

### Task 5: Frontend — Notifications UI

**Files:**
- Create: `frontend/components/notifications/NotificationDropdown.tsx`
- Create: `frontend/app/notifications/page.tsx`
- Create: `frontend/app/notifications/layout.tsx`
- Create: `frontend/hooks/useNotifications.ts`
- Modify: `frontend/components/layout/Header.tsx` (add bell icon with badge)
- Modify: `frontend/lib/api.ts` (add notification endpoints)

**Interfaces:**
- Consumes: `GET /notifications`, `GET /notifications/unread-count`, `POST /notifications/:id/read`
- Produces: Notification bell in header, notification dropdown, notifications page

- [ ] **Step 1: Add API endpoints to lib/api.ts**

```typescript
// lib/api.ts
export const getNotifications = (): Promise<Notification[]> =>
  api.get('/notifications').then(r => r.data);

export const getUnreadCount = (): Promise<{ count: number }> =>
  api.get('/notifications/unread-count').then(r => r.data);

export const markAsRead = (id: number): Promise<void> =>
  api.post(`/notifications/${id}/read`);
```

- [ ] **Step 2: Create useNotifications hook**

```typescript
// hooks/useNotifications.ts
'use client';
import { useState, useEffect, useCallback } from 'react';
import { getNotifications, getUnreadCount, markAsRead } from '@/lib/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetch = useCallback(async () => {
    try {
      const [data, { count }] = await Promise.all([
        getNotifications(),
        getUnreadCount(),
      ]);
      setNotifications(data);
      setUnreadCount(count);
    } catch {}
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const markAsReadHandler = async (id: number) => {
    await markAsRead(id);
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return { notifications, unreadCount, markAsRead: markAsReadHandler, refresh: fetch };
}
```

- [ ] **Step 3: Create NotificationDropdown**

```tsx
// components/notifications/NotificationDropdown.tsx
'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, Check, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/hooks/useNotifications';

export function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="relative p-2 rounded-lg hover:bg-gray-100">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          <div className="p-3 border-b flex justify-between items-center">
            <span className="font-semibold">الإشعارات</span>
            <Link href="/notifications" className="text-sm text-blue-600 hover:underline" onClick={() => setOpen(false)}>
              عرض الكل <ChevronRight className="w-3 h-3 inline" />
            </Link>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.slice(0, 5).map(n => (
              <div key={n.id} className={`p-3 border-b last:border-0 hover:bg-gray-50 ${!n.read ? 'bg-blue-50' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{n.title}</p>
                    <p className="text-xs text-gray-500">{n.message}</p>
                  </div>
                  {!n.read && (
                    <button onClick={() => markAsRead(n.id)} className="p-1 hover:bg-gray-200 rounded">
                      <Check className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Add bell to Header**

In `Header.tsx`, import and add `<NotificationDropdown />` near the user profile/menu section.

- [ ] **Step 5: Create notifications page**

```tsx
// app/notifications/page.tsx
'use client';
import { useNotifications } from '@/hooks/useNotifications';
import { Check } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead } = useNotifications();

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">الإشعارات</h1>
      <p className="text-sm text-gray-500 mb-4">{unreadCount} إشعار غير مقروء</p>
      <div className="space-y-2">
        {notifications.map(n => (
          <div key={n.id} className={`p-4 rounded-lg border ${!n.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('ar-MA')}</p>
              </div>
              {!n.read && (
                <button onClick={() => markAsRead(n.id)} className="p-2 hover:bg-blue-100 rounded">
                  <Check className="w-5 h-5 text-green-600" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Build frontend and verify**

```bash
cd C:\ELMostafa\frontend; npx next build
```
Expected: Build succeeds

- [ ] **Step 7: Commit**

```bash
git add frontend/components/notifications/ frontend/app/notifications/ frontend/hooks/useNotifications.ts frontend/components/layout/Header.tsx frontend/lib/api.ts
git commit -m "feat(ui): add notifications dropdown and page"
```

---

### Task 6: Frontend — Audit Log Viewer

**Files:**
- Create: `frontend/app/audit/page.tsx`
- Create: `frontend/app/audit/layout.tsx`
- Create: `frontend/hooks/useAuditLogs.ts`
- Modify: `frontend/lib/api.ts`

**Interfaces:**
- Consumes: `GET /audit` (to be added — task creates a simple audit controller if missing)
- Produces: Audit log table with filters

- [ ] **Step 1: Add audit controller if missing**

```typescript
// backend/src/audit/audit.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/enums/role.enum';

@Controller('audit')
@Roles(Role.ADMIN)
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  findAll(@Query('limit') limit?: number) {
    return this.service.findAll(limit);
  }

  @Get('entity/:entity/:id')
  findByEntity(@Query('entity') entity: string, @Query('id') id: number) {
    return this.service.findByEntity(entity, id);
  }
}
```

Register AuditController in `audit.module.ts`.

- [ ] **Step 2: Add audit API to lib/api.ts**

```typescript
export const getAuditLogs = (limit?: number): Promise<AuditLog[]> =>
  api.get('/audit', { params: { limit } }).then(r => r.data);
```

- [ ] **Step 3: Create useAuditLogs hook**

```typescript
// hooks/useAuditLogs.ts
'use client';
import { useState, useEffect } from 'react';
import { getAuditLogs } from '@/lib/api';

export function useAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAuditLogs(100).then(setLogs).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { logs, loading };
}
```

- [ ] **Step 4: Create audit page**

```tsx
// app/audit/page.tsx
'use client';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Clock, User, ShieldAlert } from 'lucide-react';

export default function AuditPage() {
  const { logs, loading } = useAuditLogs();

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">سجل التدقيق</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-right">التاريخ</th>
              <th className="p-3 text-right">المستخدم</th>
              <th className="p-3 text-right">الإجراء</th>
              <th className="p-3 text-right">الكيان</th>
              <th className="p-3 text-right">المعرف</th>
              <th className="p-3 text-right">IP</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-sm">{new Date(log.createdAt).toLocaleString('ar-MA')}</td>
                <td className="p-3 text-sm">{log.userId}</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                    log.action === 'DELETE' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>{log.action}</span>
                </td>
                <td className="p-3 text-sm">{log.entity}</td>
                <td className="p-3 text-sm">{log.entityId}</td>
                <td className="p-3 text-sm text-gray-500">{log.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Build frontend**

```bash
cd C:\ELMostafa\frontend; npx next build
```
Expected: Build succeeds

- [ ] **Step 6: Commit**

```bash
git add frontend/app/audit/ frontend/hooks/useAuditLogs.ts frontend/lib/api.ts
git commit -m "feat(ui): add audit log viewer page"
```

---

### Task 7: Frontend — Documents & Currencies Pages

**Files:**
- Create: `frontend/app/documents/page.tsx`
- Create: `frontend/hooks/useDocuments.ts`
- Create: `frontend/app/currencies/page.tsx`
- Create: `frontend/hooks/useCurrencies.ts`
- Modify: `frontend/lib/api.ts`

**Interfaces:**
- Consumes: `GET /documents`, `POST /documents/upload`, `DELETE /documents/:id`, `GET /currencies`
- Produces: Document list with upload/delete, Currency list page

- [ ] **Step 1: Add document APIs to lib/api.ts**

```typescript
export const getDocuments = (): Promise<Document[]> =>
  api.get('/documents').then(r => r.data);

export const uploadDocument = (file: File, entityType?: string, entityId?: number): Promise<Document> => {
  const formData = new FormData();
  formData.append('file', file);
  if (entityType) formData.append('entityType', entityType);
  if (entityId) formData.append('entityId', String(entityId));
  return api.post('/documents/upload', formData).then(r => r.data);
};

export const deleteDocument = (id: number): Promise<void> =>
  api.delete(`/documents/${id}`);
```

- [ ] **Step 2: Add currency APIs to lib/api.ts**

```typescript
export const getCurrencies = (): Promise<Currency[]> =>
  api.get('/currencies').then(r => r.data);

export const convertCurrency = (amount: number, from: string, to: string): Promise<{ result: number }> =>
  api.get(`/currencies/convert/${amount}/${from}/${to}`).then(r => r.data);
```

- [ ] **Step 3: Create useDocuments hook**

```typescript
// hooks/useDocuments.ts
'use client';
import { useState, useEffect } from 'react';
import { getDocuments, uploadDocument, deleteDocument } from '@/lib/api';

export function useDocuments() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const upload = async (file: File, entityType?: string, entityId?: number) => {
    await uploadDocument(file, entityType, entityId);
    await fetch();
  };

  const deleteDoc = async (id: number) => {
    await deleteDocument(id);
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return { documents, loading, upload, delete: deleteDoc };
}
```

- [ ] **Step 4: Create useCurrencies hook**

```typescript
// hooks/useCurrencies.ts
'use client';
import { useState, useEffect } from 'react';
import { getCurrencies } from '@/lib/api';

export function useCurrencies() {
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrencies().then(setCurrencies).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return { currencies, loading };
}
```

- [ ] **Step 5: Create documents page**

```tsx
// app/documents/page.tsx
'use client';
import { useDocuments } from '@/hooks/useDocuments';
import { Upload, Trash2, FileText } from 'lucide-react';

export default function DocumentsPage() {
  const { documents, loading, upload, delete: deleteDoc } = useDocuments();

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">المستندات</h1>
        <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
          <Upload className="w-4 h-4" />
          رفع مستند
          <input type="file" className="hidden" onChange={e => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }} />
        </label>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">{doc.originalName}</p>
                  <p className="text-xs text-gray-500">{(doc.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>
              <button onClick={() => deleteDoc(doc.id)} className="p-1 hover:bg-red-50 rounded text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Create currencies page**

```tsx
// app/currencies/page.tsx
'use client';
import { useCurrencies } from '@/hooks/useCurrencies';
import { DollarSign } from 'lucide-react';

export default function CurrenciesPage() {
  const { currencies, loading } = useCurrencies();

  if (loading) return <div className="p-6">جاري التحميل...</div>;

  return (
    <div className="p-6" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">العملات</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {currencies.map(c => (
          <div key={c.id} className="p-6 border rounded-lg text-center hover:shadow-md transition-shadow">
            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-lg font-bold">{c.code}</p>
            <p className="text-sm text-gray-500">{c.name}</p>
            <p className="text-xs text-gray-400">{c.decimalPlaces} خانات عشرية</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Build frontend**

```bash
cd C:\ELMostafa\frontend; npx next build
```
Expected: Build succeeds

- [ ] **Step 8: Commit**

```bash
git add frontend/app/documents/ frontend/app/currencies/ frontend/hooks/useDocuments.ts frontend/hooks/useCurrencies.ts frontend/lib/api.ts
git commit -m "feat(ui): add document and currency management pages"
```

---

### Task 8: CI/CD — GitHub Actions Workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Backend test suite, Playwright config
- Produces: CI pipeline running on PRs to main

- [ ] **Step 1: Create CI workflow**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: erp
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: backend
        run: npm ci

      - name: Type check
        working-directory: backend
        run: npx tsc --noEmit

      - name: Unit & integration tests
        working-directory: backend
        run: npm test
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_USERNAME: postgres
          DATABASE_PASSWORD: postgres
          DATABASE_DATABASE: erp
          AUTH_JWT_SECRET: test-secret
          AUTH_JWT_TOKEN_EXPIRES_IN: 15m

      - name: Upload coverage
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: coverage
          path: backend/coverage/

  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: erp
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json

      - name: Install backend deps
        working-directory: backend
        run: npm ci

      - name: Install frontend deps
        working-directory: frontend
        run: npm ci

      - name: Install Playwright browsers
        working-directory: frontend
        run: npx playwright install chromium

      - name: Start backend
        working-directory: backend
        run: |
          npx nest build
          node dist/main &
        env:
          DATABASE_HOST: localhost
          DATABASE_PORT: 5432
          DATABASE_USERNAME: postgres
          DATABASE_PASSWORD: postgres
          DATABASE_DATABASE: erp
          AUTH_JWT_SECRET: test-secret
          AUTH_JWT_TOKEN_EXPIRES_IN: 15m
          REDIS_HOST: localhost

      - name: Run E2E tests
        working-directory: frontend
        run: npx playwright test
        env:
          BASE_URL: http://localhost:3001

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker compose build
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions workflow for PR testing"
```

---

## Execution Summary

| Task | Description | # Steps |
|------|-------------|---------|
| 1 | RBAC — backend guards, decorator, seed | 11 |
| 2 | RBAC — protect endpoints with @Roles | 8 |
| 3 | Database migrations setup | 7 |
| 4 | Update seed data | 5 |
| 5 | Frontend — notifications UI | 7 |
| 6 | Frontend — audit log viewer | 6 |
| 7 | Frontend — documents & currencies | 8 |
| 8 | CI/CD — GitHub Actions | 2 |

**Estimated Time:** 3-5 hours

**Order:** Tasks must be done sequentially (each depends on the previous).
