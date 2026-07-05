# Task 8: CI/CD — GitHub Actions

## Context
Task 8 of 8. There's already a CI workflow at `.github/workflows/ci.yml`. It needs enhancement.

Working directory: `C:\ELMostafa`

## What to do

Modify `.github/workflows/ci.yml`:

### 1. Change trigger to only PRs to main (remove push trigger)

### 2. Add npm caching
```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 20
    cache: 'npm'
    cache-dependency-path: |
      backend/package-lock.json
      frontend/package-lock.json
```

### 3. Split into 3 jobs: test, e2e, build

**Job 1: test** (runs lint + typecheck + unit tests + coverage)
- Uses postgres service
- Steps: checkout, setup-node with cache, install deps, lint, typecheck, test, upload coverage

**Job 2: e2e** (Playwright tests)
- Uses postgres + redis services
- Steps: checkout, setup-node, install deps, install playwright browsers, start backend, run playwright tests

**Job 3: build** (Docker Compose build)
- Steps: checkout, docker compose build

### 4. Commit
```bash
git add .github/workflows/ci.yml
git commit -m "ci: enhance workflow with caching, e2e tests, and Docker build"
```

## Current file content for reference
The current file has a single "ci" job with postgres service, install deps, lint, typecheck, test, build for both backend and frontend. It runs on push to main AND pull_request to main.

## The full updated workflow should be:

```yaml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: elmostafa_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    env:
      DATABASE_HOST: localhost
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      DATABASE_NAME: elmostafa_test
      AUTH_JWT_SECRET: ci-test-secret
      AUTH_JWT_TOKEN_EXPIRES_IN: 15m

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json

      - name: Install backend dependencies
        run: npm ci
        working-directory: backend

      - name: Install frontend dependencies
        run: npm ci
        working-directory: frontend

      - name: Run backend lint
        run: npm run lint
        working-directory: backend

      - name: Run frontend lint
        run: npm run lint
        working-directory: frontend

      - name: Run backend TypeScript check
        run: npx tsc --noEmit
        working-directory: backend

      - name: Run frontend TypeScript check
        run: npx next build
        working-directory: frontend

      - name: Run backend tests
        run: npm test
        working-directory: backend

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
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: elmostafa_test
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

    env:
      DATABASE_HOST: localhost
      DATABASE_PORT: 5432
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
      DATABASE_NAME: elmostafa_test
      AUTH_JWT_SECRET: ci-test-secret
      AUTH_JWT_TOKEN_EXPIRES_IN: 15m
      REDIS_HOST: localhost

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

      - name: Build backend
        working-directory: backend
        run: npm run build

      - name: Start backend
        working-directory: backend
        run: |
          node dist/main &
          sleep 5

      - name: Run E2E tests
        working-directory: frontend
        run: npx playwright test

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker compose build
```

## IMPORTANT
- The existing workflow has a single "ci" job. Replace it entirely with the 3-job structure above.
- Keep the existing file path exactly as `.github/workflows/ci.yml`
- Don't add any other files

## Report
Write report to `C:\ELMostafa\.superpowers\reports\task-8-report.md`
Report back: Status, Commits, summary of changes.
