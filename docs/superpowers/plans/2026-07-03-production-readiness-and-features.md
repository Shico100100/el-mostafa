# ELMostafa ERP: Production Readiness, Testing & Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make ELMostafa ERP production-ready with Docker deployment, comprehensive testing, monitoring, and new business features.

**Architecture:** Add infrastructure layers (Docker, logging, rate limiting, Swagger) around existing NestJS+Next.js stack. Extend with Redis caching, Sentry error tracking, and new business modules (notifications, documents, audit trail).

**Tech Stack:** Docker, Docker Compose, Winston (logging), class-validator/class-transformer (validation), @nestjs/swagger, ioredis (Redis), @sentry/nestjs (Sentry), Playwright (E2E), Jest (integration), prom-client (Prometheus metrics)

---

## Global Constraints
- `DATABASE_SYNCHRONIZE=false` permanently
- Backend port: 3001, Frontend port: 3000, PostgreSQL port: 5432
- Login: `admin@admin.com` / `admin123`
- Arabic UI, English code/comments
- All queries must use JOINs to avoid N+1

---

## Phase 1: Production Infrastructure

### Task 1: Health Check Endpoints

**Files:**
- Create: `backend/src/health/health.module.ts`
- Create: `backend/src/health/health.controller.ts`
- Modify: `backend/src/app.module.ts` (add HealthModule)
- Test: `backend/src/health/health.controller.spec.ts`

**Interfaces:**
- Consumes: `@nestjs/terminus` (health check library), `@nestjs/typeorm` (database check)
- Produces: `GET /health` (liveness), `GET /health/ready` (readiness with DB check)

- [ ] **Step 1: Install terminus**
```bash
npm install @nestjs/terminus
```

- [ ] **Step 2: Write failing test**
```typescript
// health.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check: jest.fn().mockResolvedValue({ status: 'ok' }) },
        },
        {
          provide: TypeOrmHealthIndicator,
          useValue: { pingCheck: jest.fn().mockResolvedValue({ database: { status: 'up' } }) },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('should return liveness', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**
```bash
cd C:\ELMostafa\backend; npx jest health.controller.spec.ts
```
Expected: FAIL (HealthController not found)

- [ ] **Step 4: Implement health controller**
```typescript
// health.module.ts
import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule, TypeOrmModule],
  controllers: [HealthController],
})
export class HealthModule {}

// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheckService, HealthCheck, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  readiness() {
    return this.health.check([() => this.db.pingCheck('database')]);
  }
}
```

- [ ] **Step 5: Register module in app.module.ts**
```typescript
// app.module.ts - add to imports
import { HealthModule } from './health/health.module';
// ... in @Module imports array
HealthModule,
```

- [ ] **Step 6: Run test to verify it passes**
```bash
cd C:\ELMostafa\backend; npx jest health.controller.spec.ts
```
Expected: PASS

- [ ] **Step 7: Manual test**
```bash
curl http://localhost:3001/health
curl http://localhost:3001/health/ready
```
Expected: `{"status":"ok"}`

- [ ] **Step 8: Commit**
```bash
git add backend/src/health/ backend/src/app.module.ts
git commit -m "feat: add health check endpoints for liveness and readiness"
```

---

### Task 2: Request Logging Middleware

**Files:**
- Create: `backend/src/common/middleware/request-logger.middleware.ts`
- Create: `backend/src/common/common.module.ts`
- Modify: `backend/src/main.ts` (use middleware)
- Test: `backend/src/common/middleware/request-logger.middleware.spec.ts`

**Interfaces:**
- Consumes: `winston` logger, NestJS `INestApplication`
- Produces: Structured JSON logs to console (stdout)

- [ ] **Step 1: Install winston**
```bash
npm install winston
```

- [ ] **Step 2: Write failing test**
```typescript
// request-logger.middleware.spec.ts
import { RequestLoggerMiddleware } from './request-logger.middleware';

describe('RequestLoggerMiddleware', () => {
  it('should log request details', () => {
    const middleware = new RequestLoggerMiddleware();
    const req = { method: 'GET', path: '/api/test', ip: '127.0.0.1' };
    const res = { statusCode: 200, on: jest.fn() };
    const next = jest.fn();

    middleware.use(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**
```bash
cd C:\ELMostafa\backend; npx jest request-logger.middleware.spec.ts
```
Expected: FAIL

- [ ] **Step 4: Implement middleware**
```typescript
// request-logger.middleware.ts
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl, ip } = req;
    const startTime = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      this.logger.log(
        JSON.stringify({
          method,
          path: originalUrl,
          status: statusCode,
          duration: `${duration}ms`,
          ip,
          userAgent: req.get('user-agent'),
        }),
      );
    });

    next();
  }
}

// common.module.ts
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware';

@Module({})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
```

- [ ] **Step 5: Register in app.module.ts**
```typescript
import { CommonModule } from './common/common.module';
// ... in @Module imports array
CommonModule,
```

- [ ] **Step 6: Run test to verify it passes**
```bash
cd C:\ELMostafa\backend; npx jest request-logger.middleware.spec.ts
```
Expected: PASS

- [ ] **Step 7: Manual test - check logs in backend console**
```bash
curl http://localhost:3001/api/v1/dashboard/stats
```
Expected: JSON log entry with method, path, status, duration

- [ ] **Step 8: Commit**
```bash
git add backend/src/common/ backend/src/app.module.ts
git commit -m "feat: add structured JSON request logging with winston"
```

---

### Task 3: Rate Limiting

**Files:**
- Create: `backend/src/common/guards/rate-limit.guard.ts`
- Modify: `backend/src/app.module.ts` (register throttler)
- Test: `backend/src/common/guards/rate-limit.guard.spec.ts`

**Interfaces:**
- Consumes: `@nestjs/throttler` (rate limiting library)
- Produces: 429 Too Many Requests for exceeding limits

- [ ] **Step 1: Install throttler**
```bash
npm install @nestjs/throttler
```

- [ ] **Step 2: Write failing test**
```typescript
// rate-limit.guard.spec.ts
import { ThrottlerGuard } from '@nestjs/throttler';
import { RateLimitGuard } from './rate-limit.guard';

describe('RateLimitGuard', () => {
  it('should be an instance of ThrottlerGuard', () => {
    const guard = new RateLimitGuard();
    expect(guard).toBeInstanceOf(ThrottlerGuard);
  });
});
```

- [ ] **Step 3: Implement guard**
```typescript
// rate-limit.guard.ts
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class RateLimitGuard extends ThrottlerGuard {}
```

- [ ] **Step 4: Register in app.module.ts**
```typescript
import { ThrottlerModule } from '@nestjs/throttler';
import { RateLimitGuard } from './common/guards/rate-limit.guard';
// in imports array
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
// in providers array
{ provide: 'APP_GUARD', useClass: RateLimitGuard },
```

- [ ] **Step 5: Run test to verify it passes**
```bash
cd C:\ELMostafa\backend; npx jest rate-limit.guard.spec.ts
```
Expected: PASS

- [ ] **Step 6: Manual test - rapid fire requests**
```bash
for ($i=1; $i -le 110; $i++) { curl -s http://localhost:3001/health | Out-Null; Write-Host $i }
```
Expected: Requests 1-100 succeed, 101+ get 429

- [ ] **Step 7: Commit**
```bash
git add backend/src/common/guards/ backend/src/app.module.ts
git commit -m "feat: add rate limiting (100 req/min)"
```

---

### Task 4: Request Validation (Global Pipe)

**Files:**
- Modify: `backend/src/main.ts` (enable validation pipe)
- Create: `backend/src/common/dto/pagination-query.dto.ts` (reusable pagination DTO)
- Test: `backend/src/common/dto/pagination-query.dto.spec.ts`

**Interfaces:**
- Consumes: `class-validator`, `class-transformer`
- Produces: Automatic input validation and transformation for all DTOs

- [ ] **Step 1: Install class-validator and class-transformer**
```bash
npm install class-validator class-transformer
```

- [ ] **Step 2: Write failing test for pagination DTO**
```typescript
// pagination-query.dto.spec.ts
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { PaginationQueryDto } from './pagination-query.dto';

describe('PaginationQueryDto', () => {
  it('should accept valid pagination params', async () => {
    const dto = plainToInstance(PaginationQueryDto, { page: 1, limit: 10 });
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should reject negative page', async () => {
    const dto = plainToInstance(PaginationQueryDto, { page: -1, limit: 10 });
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Implement pagination DTO**
```typescript
// pagination-query.dto.ts
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
```

- [ ] **Step 4: Run test to verify it passes**
```bash
cd C:\ELMostafa\backend; npx jest pagination-query.dto.spec.ts
```
Expected: PASS

- [ ] **Step 5: Enable global validation pipe in main.ts**
```typescript
import { ValidationPipe } from '@nestjs/common';
// in bootstrap()
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

- [ ] **Step 6: Commit**
```bash
git add backend/src/common/dto/ backend/src/main.ts
git commit -m "feat: add global validation pipe and reusable pagination DTO"
```

---

### Task 5: Swagger/OpenAPI Documentation

**Files:**
- Create: `backend/src/swagger.ts` (Swagger setup)
- Modify: `backend/src/main.ts` (use swagger setup)
- Modify: All controller files (add `@ApiTags`, `@ApiOperation`, `@ApiResponse` decorators)

**Interfaces:**
- Consumes: `@nestjs/swagger`
- Produces: `GET /api/docs` (Swagger UI)

- [ ] **Step 1: Install swagger**
```bash
npm install @nestjs/swagger
```

- [ ] **Step 2: Create swagger setup**
```typescript
// swagger.ts
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('ELMostafa ERP API')
    .setDescription('Full ERP system for plastic manufacturing')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

- [ ] **Step 3: Use in main.ts**
```typescript
import { setupSwagger } from './swagger';
// in bootstrap()
setupSwagger(app);
```

- [ ] **Step 4: Add decorators to 5 key controllers**
Add to `dashboard.controller.ts`:
```typescript
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiOperation({ summary: 'Get dashboard statistics' })
@ApiResponse({ status: 200, description: 'Returns all dashboard stats' })
```
Repeat for: `inventory.controller.ts`, `manufacturing.controller.ts`, `purchases.controller.ts`, `sales.controller.ts`

- [ ] **Step 5: Manual test**
```bash
curl http://localhost:3001/api/docs
```
Expected: Swagger UI loads with all endpoints

- [ ] **Step 6: Commit**
```bash
git add backend/src/swagger.ts backend/src/main.ts backend/src/*/
git commit -m "feat: add Swagger/OpenAPI documentation"
```

---

### Task 6: Docker Compose Setup

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`
- Create: `backend/.dockerignore`
- Create: `frontend/.dockerignore`
- Create: `scripts/deploy.sh`

**Interfaces:**
- Consumes: Node.js 20 LTS, PostgreSQL 16, Next.js standalone output
- Produces: `docker-compose up` runs full stack

- [ ] **Step 1: Create backend Dockerfile**
```dockerfile
# backend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/main"]
```

- [ ] **Step 2: Create frontend Dockerfile**
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server.js"]
```

- [ ] **Step 3: Create docker-compose.yml**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: erp-postgres
    environment:
      POSTGRES_DB: elmostafa
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    container_name: erp-backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_HOST: postgres
      DATABASE_PORT: 5432
      DATABASE_NAME: elmostafa
      DATABASE_USER: postgres
      DATABASE_PASSWORD: postgres
      JWT_SECRET: ${JWT_SECRET:-change-me-in-production}
      FRONTEND_DOMAIN: http://localhost:3000
      DATABASE_SYNCHRONIZE: "false"
    depends_on:
      - postgres

  frontend:
    build: ./frontend
    container_name: erp-frontend
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:3001/api/v1

volumes:
  postgres_data:
```

- [ ] **Step 4: Create .dockerignore files**
```bash
# backend/.dockerignore
node_modules
dist
.git
.env

# frontend/.dockerignore
node_modules
.next
.git
```

- [ ] **Step 5: Create deploy script**
```bash
# scripts/deploy.sh
#!/bin/bash
set -e

echo "Building images..."
docker-compose build

echo "Starting services..."
docker-compose up -d

echo "Waiting for PostgreSQL..."
sleep 5

echo "Running database migrations..."
docker-compose exec backend npm run migration:run

echo "Seeding demo data..."
docker-compose exec backend node -e "
const axios = require('axios');
const jwt = require('jsonwebtoken');
const token = jwt.sign({ email: 'admin@admin.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
axios.post('http://localhost:3001/api/v1/system/seed', {}, { headers: { Authorization: 'Bearer ' + token } })
  .then(() => console.log('Seed complete'))
  .catch(err => console.error('Seed failed:', err.message));
"

echo "Deployment complete!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:3001"
echo "API Docs: http://localhost:3001/api/docs"
```

- [ ] **Step 6: Commit**
```bash
git add backend/Dockerfile frontend/Dockerfile docker-compose.yml .dockerignore scripts/
git commit -m "feat: add Docker Compose setup for production deployment"
```

---

## Phase 2: Comprehensive Testing

### Task 7: Integration Tests - Auth Flow

**Files:**
- Create: `backend/test/auth.integration.spec.ts`
- Create: `backend/test/setup.ts` (test database setup)

**Interfaces:**
- Consumes: Supertest (HTTP testing), Test database
- Produces: Verified login → JWT → protected route flow

- [ ] **Step 1: Install test dependencies**
```bash
npm install -D supertest @types/supertest
```

- [ ] **Step 2: Write integration test**
```typescript
// test/auth.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth Flow (Integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should login and access protected route', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();

    const token = loginRes.body.token;
    const dashboardRes = await request(app.getHttpServer())
      .get('/api/v1/dashboard/stats')
      .set('Authorization', `Bearer ${token}`);

    expect(dashboardRes.status).toBe(200);
    expect(dashboardRes.body).toHaveProperty('totalSales');
  });
});
```

- [ ] **Step 3: Run integration test**
```bash
cd C:\ELMostafa\backend; npx jest test/auth.integration.spec.ts --runInBand --forceExit
```
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add backend/test/
git commit -m "test: add auth flow integration test"
```

---

### Task 8: Integration Tests - Inventory Flow

**Files:**
- Create: `backend/test/inventory.integration.spec.ts`

**Interfaces:**
- Consumes: Supertest, JWT token from auth
- Produces: Verified CRUD operations for products, categories, warehouses

- [ ] **Step 1: Write inventory integration test**
```typescript
// test/inventory.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Inventory Flow (Integration)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    // Login
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });
    token = loginRes.body.token;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should list products with pagination', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory/products?page=1&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
    expect(res.body.total).toBeGreaterThanOrEqual(0);
    expect(res.body.page).toBe(1);
  });

  it('should list categories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should list warehouses', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/inventory/warehouses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test**
```bash
cd C:\ELMostafa\backend; npx jest test/inventory.integration.spec.ts --runInBand --forceExit
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add backend/test/inventory.integration.spec.ts
git commit -m "test: add inventory flow integration test"
```

---

### Task 9: Integration Tests - Manufacturing Flow

**Files:**
- Create: `backend/test/manufacturing.integration.spec.ts`

**Interfaces:**
- Consumes: Supertest, JWT token
- Produces: Verified raw materials, accessories, BOMs, production queries

- [ ] **Step 1: Write manufacturing integration test**
```typescript
// test/manufacturing.integration.spec.ts
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Manufacturing Flow (Integration)', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/email/login')
      .send({ email: 'admin@admin.com', password: 'admin123' });
    token = loginRes.body.token;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should list raw materials', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/raw-materials')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('should list accessories', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/accessories')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it('should list BOMs', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/boms')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
  });

  it('should list machines', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/manufacturing/machines')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toBeDefined();
  });
});
```

- [ ] **Step 2: Run test**
```bash
cd C:\ELMostafa\backend; npx jest test/manufacturing.integration.spec.ts --runInBand --forceExit
```
Expected: PASS

- [ ] **Step 3: Commit**
```bash
git add backend/test/manufacturing.integration.spec.ts
git commit -m "test: add manufacturing flow integration test"
```

---

### Task 10: E2E Tests with Playwright

**Files:**
- Create: `frontend/e2e/login.spec.ts`
- Create: `frontend/e2e/dashboard.spec.ts`
- Create: `frontend/playwright.config.ts`
- Modify: `frontend/package.json` (add test scripts)

**Interfaces:**
- Consumes: Playwright, running frontend/backend
- Produces: Automated browser tests

- [ ] **Step 1: Install Playwright**
```bash
cd C:\ELMostafa\frontend; npm install -D @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Create Playwright config**
```typescript
// frontend/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
  },
  webServer: [
    {
      command: 'cd ../backend && node dist/main',
      port: 3001,
      reuseExistingServer: true,
    },
    {
      command: 'npx next dev -H 0.0.0.0',
      port: 3000,
      reuseExistingServer: true,
    },
  ],
});
```

- [ ] **Step 3: Write login E2E test**
```typescript
// frontend/e2e/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 10000 });
    await expect(page).toHaveURL('/');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'wrong@email.com');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=خطأ')).toBeVisible({ timeout: 5000 });
  });
});
```

- [ ] **Step 4: Write dashboard E2E test**
```typescript
// frontend/e2e/dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('text=إحصائيات')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to inventory', async ({ page }) => {
    await page.click('text=المخزون');
    await expect(page).toHaveURL(/inventory/);
  });
});
```

- [ ] **Step 5: Add test scripts to package.json**
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

- [ ] **Step 6: Run E2E tests**
```bash
cd C:\ELMostafa\frontend; npx playwright test
```
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add frontend/e2e/ frontend/playwright.config.ts frontend/package.json
git commit -m "test: add E2E tests with Playwright"
```

---

### Task 11: Test Coverage Report

**Files:**
- Modify: `backend/package.json` (add coverage script)
- Create: `backend/jest.config.ts` (coverage config)

**Interfaces:**
- Consumes: Jest coverage
- Produces: HTML coverage report in `backend/coverage/`

- [ ] **Step 1: Create jest.config.ts**
```typescript
// backend/jest.config.ts
export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};
```

- [ ] **Step 2: Add coverage script to package.json**
```json
{
  "scripts": {
    "test:cov": "jest --coverage"
  }
}
```

- [ ] **Step 3: Run coverage**
```bash
cd C:\ELMostafa\backend; npm run test:cov
```
Expected: Coverage report generated in `backend/coverage/`

- [ ] **Step 4: Commit**
```bash
git add backend/jest.config.ts backend/package.json
git commit -m "test: add test coverage configuration"
```

---

## Phase 3: Performance & Monitoring

### Task 12: Redis Caching for Dashboard

**Files:**
- Create: `backend/src/cache/cache.module.ts`
- Create: `backend/src/cache/cache.service.ts`
- Modify: `backend/src/dashboard/dashboard.service.ts` (use cache)
- Modify: `docker-compose.yml` (add Redis service)
- Test: `backend/src/cache/cache.service.spec.ts`

**Interfaces:**
- Consumes: `ioredis`
- Produces: Cached dashboard stats (TTL: 60s)

- [ ] **Step 1: Install ioredis**
```bash
npm install ioredis @types/ioredis
```

- [ ] **Step 2: Write failing test**
```typescript
// cache.service.spec.ts
import { CacheService } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;

  beforeEach(() => {
    service = new CacheService();
  });

  it('should set and get cache', async () => {
    await service.set('test-key', { value: 123 }, 60);
    const result = await service.get('test-key');
    expect(result).toEqual({ value: 123 });
  });

  it('should delete cache', async () => {
    await service.set('test-key', { value: 123 }, 60);
    await service.del('test-key');
    const result = await service.get('test-key');
    expect(result).toBeNull();
  });
});
```

- [ ] **Step 3: Implement cache service**
```typescript
// cache.module.ts
import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}

// cache.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: 3,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.client.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl: number = 60): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
```

- [ ] **Step 4: Use cache in dashboard service**
```typescript
// dashboard.service.ts - modify getStats()
async getStats() {
  const cacheKey = 'dashboard:stats';
  const cached = await this.cache.get(cacheKey);
  if (cached) return cached;

  const [totalSales, totalPurchases, ...rest] = await Promise.all([
    // ... existing queries
  ]);

  const result = { totalSales, totalPurchases, ... };
  await this.cache.set(cacheKey, result, 60); // 60s TTL
  return result;
}
```

- [ ] **Step 5: Add Redis to docker-compose.yml**
```yaml
# docker-compose.yml - add to services
redis:
  image: redis:7-alpine
  container_name: erp-redis
  ports:
    - "6379:6379"
```

- [ ] **Step 6: Run test**
```bash
cd C:\ELMostafa\backend; npx jest cache.service.spec.ts
```
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add backend/src/cache/ backend/src/dashboard/dashboard.service.ts docker-compose.yml
git commit -m "feat: add Redis caching for dashboard stats (60s TTL)"
```

---

### Task 13: Sentry Error Tracking

**Files:**
- Create: `backend/src/sentry/sentry.module.ts`
- Create: `backend/src/sentry/sentry.interceptor.ts`
- Modify: `backend/src/main.ts` (initialize Sentry)
- Modify: `backend/.env` (add DSN)
- Test: `backend/src/sentry/sentry.interceptor.spec.ts`

**Interfaces:**
- Consumes: `@sentry/nestjs`, `@sentry/profiling-node`
- Produces: Error reports to Sentry dashboard

- [ ] **Step 1: Install Sentry**
```bash
npm install @sentry/nestjs @sentry/profiling-node
```

- [ ] **Step 2: Write failing test**
```typescript
// sentry.interceptor.spec.ts
import { SentryInterceptor } from './sentry.interceptor';

describe('SentryInterceptor', () => {
  it('should be defined', () => {
    const interceptor = new SentryInterceptor();
    expect(interceptor).toBeDefined();
  });
});
```

- [ ] **Step 3: Implement interceptor**
```typescript
// sentry.module.ts
import { Module } from '@nestjs/common';
import { SentryInterceptor } from './sentry.interceptor';

@Module({
  providers: [SentryInterceptor],
  exports: [SentryInterceptor],
})
export class SentryModule {}

// sentry.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        Sentry.captureException(error);
        throw error;
      }),
    );
  }
}
```

- [ ] **Step 4: Initialize Sentry in main.ts**
```typescript
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
});
```

- [ ] **Step 5: Add DSN to .env**
```bash
SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

- [ ] **Step 6: Run test**
```bash
cd C:\ELMostafa\backend; npx jest sentry.interceptor.spec.ts
```
Expected: PASS

- [ ] **Step 7: Commit**
```bash
git add backend/src/sentry/ backend/src/main.ts backend/.env
git commit -m "feat: add Sentry error tracking with profiling"
```

---

### Task 14: Prometheus Metrics

**Files:**
- Create: `backend/src/metrics/metrics.module.ts`
- Create: `backend/src/metrics/metrics.controller.ts`
- Create: `backend/src/metrics/metrics.interceptor.ts`
- Modify: `backend/src/app.module.ts` (register metrics)
- Test: `backend/src/metrics/metrics.controller.spec.ts`

**Interfaces:**
- Consumes: `prom-client`
- Produces: `GET /metrics` endpoint for Prometheus scraping

- [ ] **Step 1: Install prom-client**
```bash
npm install prom-client
```

- [ ] **Step 2: Write failing test**
```typescript
// metrics.controller.spec.ts
import { MetricsController } from './metrics.controller';

describe('MetricsController', () => {
  it('should return metrics', async () => {
    const controller = new MetricsController();
    const result = await controller.getMetrics();
    expect(typeof result).toBe('string');
    expect(result).toContain('http_requests_total');
  });
});
```

- [ ] **Step 3: Implement metrics**
```typescript
// metrics.module.ts
import { Module, Global } from '@nestjs/common';
import { MetricsController } from './metrics.controller';
import { MetricsInterceptor } from './metrics.interceptor';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [MetricsInterceptor],
  exports: [MetricsInterceptor],
})
export class MetricsModule {}

// metrics.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { register } from 'prom-client';

@Controller('metrics')
export class MetricsController {
  @Get()
  @Header('Content-Type', 'text/plain')
  async getMetrics() {
    return register.metrics();
  }
}

// metrics.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Counter, Histogram } from 'prom-client';

const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
});

const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration',
  labelNames: ['method', 'route'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const { method, route } = req;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - startTime) / 1000;
        const res = context.switchToHttp().getResponse();
        httpRequestsTotal.inc({ method, route, status: res.statusCode });
        httpRequestDuration.observe({ method, route }, duration);
      }),
    );
  }
}
```

- [ ] **Step 4: Register in app.module.ts**
```typescript
import { MetricsModule } from './metrics/metrics.module';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
// in imports
MetricsModule,
// in providers
{ provide: 'APP_INTERCEPTOR', useClass: MetricsInterceptor },
```

- [ ] **Step 5: Run test**
```bash
cd C:\ELMostafa\backend; npx jest metrics.controller.spec.ts
```
Expected: PASS

- [ ] **Step 6: Manual test**
```bash
curl http://localhost:3001/metrics
```
Expected: Prometheus metrics output

- [ ] **Step 7: Commit**
```bash
git add backend/src/metrics/ backend/src/app.module.ts
git commit -m "feat: add Prometheus metrics endpoint"
```

---

## Phase 4: New Business Features

### Task 15: Notifications System

**Files:**
- Create: `backend/src/notifications/notifications.module.ts`
- Create: `backend/src/notifications/notifications.controller.ts`
- Create: `backend/src/notifications/notifications.service.ts`
- Create: `backend/src/notifications/entities/notification.entity.ts`
- Modify: `backend/src/dashboard/dashboard.service.ts` (check for alerts)

**Interfaces:**
- Consumes: TypeORM entity, existing services (inventory, purchases, sales)
- Produces: `GET /notifications`, `POST /notifications/:id/read`, `GET /notifications/unread-count`

- [ ] **Step 1: Create notification entity**
```typescript
// notifications/entities/notification.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  type: string; // 'low_stock', 'overdue_order', 'attendance', 'system'

  @Column()
  title: string;

  @Column('text')
  message: string;

  @Column({ nullable: true })
  link: string;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: Create notifications service**
```typescript
// notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  async findAll(limit = 50) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async getUnreadCount() {
    return this.repo.count({ where: { read: false } });
  }

  async markAsRead(id: number) {
    await this.repo.update(id, { read: true });
  }

  async create(data: Partial<Notification>) {
    const notification = this.repo.create(data);
    return this.repo.save(notification);
  }

  async checkLowStock() {
    // Check inventory and create notifications if stock is low
  }

  async checkOverdueOrders() {
    // Check sales orders and create notifications if overdue
  }
}
```

- [ ] **Step 3: Create controller**
```typescript
// notifications.controller.ts
import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get('unread-count')
  getUnreadCount() {
    return this.service.getUnreadCount();
  }

  @Post(':id/read')
  markAsRead(@Param('id') id: number) {
    return this.service.markAsRead(id);
  }
}
```

- [ ] **Step 4: Wire up in dashboard**
```typescript
// dashboard.service.ts - add to getStats()
const [totalSales, totalPurchases, ..., unreadNotifications] = await Promise.all([
  // ... existing queries
  this.notificationsService.getUnreadCount(),
]);
return { ..., unreadNotifications };
```

- [ ] **Step 5: Commit**
```bash
git add backend/src/notifications/ backend/src/dashboard/dashboard.service.ts
git commit -m "feat: add notifications system for low stock, overdue orders, attendance"
```

---

### Task 16: Document Management

**Files:**
- Create: `backend/src/documents/documents.module.ts`
- Create: `backend/src/documents/documents.controller.ts`
- Create: `backend/src/documents/documents.service.ts`
- Create: `backend/src/documents/entities/document.entity.ts`
- Modify: `backend/src/sales/sales.controller.ts` (add attachment endpoint)
- Modify: `backend/src/purchases/purchases.controller.ts` (add attachment endpoint)

**Interfaces:**
- Consumes: TypeORM entity, multer (file upload)
- Produces: `POST /documents/upload`, `GET /documents/:id`, `DELETE /documents/:id`

- [ ] **Step 1: Install multer**
```bash
npm install multer @types/multer
```

- [ ] **Step 2: Create document entity**
```typescript
// documents/entities/document.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column({ nullable: true })
  entityType: string; // 'sale_order', 'purchase_order', 'product'

  @Column({ nullable: true })
  entityId: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 3: Implement service**
```typescript
// documents.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Document } from './entities/document.entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentsService {
  private uploadDir = path.join(__dirname, '..', '..', 'uploads');

  constructor(
    @InjectRepository(Document)
    private repo: Repository<Document>,
  ) {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File, entityType?: string, entityId?: number) {
    const doc = this.repo.create({
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      entityType,
      entityId,
    });
    return this.repo.save(doc);
  }

  async findOne(id: number) {
    const doc = await this.repo.findOneBy({ id });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async findByEntity(entityType: string, entityId: number) {
    return this.repo.find({ where: { entityType, entityId } });
  }

  async delete(id: number) {
    const doc = await this.findOne(id);
    const filePath = path.join(this.uploadDir, doc.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    await this.repo.remove(doc);
  }
}
```

- [ ] **Step 4: Create controller**
```typescript
// documents.controller.ts
import { Controller, Get, Post, Delete, Param, UploadedFile, UseInterceptors, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { DocumentsService } from './documents.service';
import * as path from 'path';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly service: DocumentsService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: path.join(__dirname, '..', '..', 'uploads'),
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      },
    }),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }))
  upload(@UploadedFile() file: Express.Multer.File, @Body() body: { entityType?: string; entityId?: number }) {
    return this.service.upload(file, body.entityType, body.entityId);
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.service.findOne(id);
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(@Param('entityType') entityType: string, @Param('entityId') entityId: number) {
    return this.service.findByEntity(entityType, entityId);
  }

  @Delete(':id')
  delete(@Param('id') id: number) {
    return this.service.delete(id);
  }
}
```

- [ ] **Step 5: Commit**
```bash
git add backend/src/documents/ backend/package.json
git commit -m "feat: add document management for invoices, orders, products"
```

---

### Task 17: Audit Trail

**Files:**
- Create: `backend/src/audit/audit.module.ts`
- Create: `backend/src/audit/audit.service.ts`
- Create: `backend/src/audit/entities/audit-log.entity.ts`
- Create: `backend/src/audit/audit.interceptor.ts`
- Modify: `backend/src/app.module.ts` (register audit interceptor)

**Interfaces:**
- Consumes: TypeORM entity, current user from JWT
- Produces: Automatic logging of all write operations

- [ ] **Step 1: Create audit log entity**
```typescript
// audit/entities/audit-log.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  action: string; // 'CREATE', 'UPDATE', 'DELETE'

  @Column()
  entity: string; // 'Product', 'SaleOrder', etc.

  @Column({ nullable: true })
  entityId: number;

  @Column('jsonb', { nullable: true })
  before: any;

  @Column('jsonb', { nullable: true })
  after: any;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: Create audit interceptor**
```typescript
// audit.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const user = req.user;

    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          await this.auditService.log({
            userId: user?.id || 0,
            action: method === 'POST' ? 'CREATE' : method === 'DELETE' ? 'DELETE' : 'UPDATE',
            entity: context.getHandler().name,
            entityId: response?.id,
            after: response,
            ip: req.ip,
          });
        } catch (error) {
          console.error('Audit log failed:', error);
        }
      }),
    );
  }
}
```

- [ ] **Step 3: Create audit service**
```typescript
// audit.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private repo: Repository<AuditLog>,
  ) {}

  async log(data: Partial<AuditLog>) {
    const entry = this.repo.create(data);
    return this.repo.save(entry);
  }

  async findAll(limit = 100) {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: limit });
  }

  async findByEntity(entity: string, entityId: number) {
    return this.repo.find({ where: { entity, entityId }, order: { createdAt: 'DESC' } });
  }
}
```

- [ ] **Step 4: Register in app.module.ts**
```typescript
import { AuditModule } from './audit/audit.module';
import { AuditInterceptor } from './audit/audit.interceptor';
// in imports
AuditModule,
// in providers
{ provide: 'APP_INTERCEPTOR', useClass: AuditInterceptor },
```

- [ ] **Step 5: Commit**
```bash
git add backend/src/audit/ backend/src/app.module.ts
git commit -m "feat: add audit trail for all write operations"
```

---

### Task 18: Multi-Currency Support

**Files:**
- Create: `backend/src/currency/currency.module.ts`
- Create: `backend/src/currency/currency.service.ts`
- Create: `backend/src/currency/entities/currency.entity.ts`
- Create: `backend/src/currency/entities/exchange-rate.entity.ts`
- Modify: `backend/src/sales/sales.service.ts` (use currency)
- Modify: `backend/src/purchases/purchases.service.ts` (use currency)

**Interfaces:**
- Consumes: TypeORM entities, external API (optional)
- Produces: `GET /currencies`, `GET /exchange-rates`, automatic conversion

- [ ] **Step 1: Create currency entities**
```typescript
// currency/entities/currency.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('currencies')
export class Currency {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  code: string; // 'USD', 'EUR', 'MAD'

  @Column()
  name: string;

  @Column({ default: 2 })
  decimalPlaces: number;

  @CreateDateColumn()
  createdAt: Date;
}

// currency/entities/exchange-rate.entity.ts
@Entity('exchange_rates')
export class ExchangeRate {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  fromCurrency: string;

  @Column()
  toCurrency: string;

  @Column('decimal', { precision: 10, scale: 6 })
  rate: number;

  @CreateDateColumn()
  createdAt: Date;
}
```

- [ ] **Step 2: Implement currency service**
```typescript
// currency.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private currencyRepo: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private rateRepo: Repository<ExchangeRate>,
  ) {}

  async findAll() {
    return this.currencyRepo.find();
  }

  async getExchangeRate(from: string, to: string) {
    if (from === to) return 1;
    const rate = await this.rateRepo.findOne({ where: { fromCurrency: from, toCurrency: to } });
    return rate?.rate || 1;
  }

  async convert(amount: number, from: string, to: string) {
    const rate = await this.getExchangeRate(from, to);
    return amount * rate;
  }
}
```

- [ ] **Step 3: Use in sales service**
```typescript
// sales.service.ts - modify createOrder
async createOrder(dto: CreateSaleOrderDto) {
  const currency = dto.currency || 'MAD';
  const totalInBase = dto.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  const order = this.repo.create({
    ...dto,
    currency,
    total: totalInBase,
  });
  return this.repo.save(order);
}
```

- [ ] **Step 4: Commit**
```bash
git add backend/src/currency/ backend/src/sales/ backend/src/purchases/
git commit -m "feat: add multi-currency support with exchange rates"
```

---

## Execution Summary

**Total Tasks:** 18
- Phase 1 (Production): 6 tasks
- Phase 2 (Testing): 5 tasks
- Phase 3 (Performance): 3 tasks
- Phase 4 (Features): 4 tasks

**Estimated Time:** 4-6 hours of focused implementation

**Recommended Execution Order:**
1. Start with Phase 1 (infrastructure) - enables better testing and monitoring
2. Then Phase 2 (testing) - validates existing code before adding features
3. Then Phase 3 (performance) - optimizes for production load
4. Finally Phase 4 (features) - adds new business capabilities

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-03-production-readiness-and-features.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**