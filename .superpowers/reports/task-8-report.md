# Task 8 — CI/CD Enhancement Report

**Status:** Complete

**Commit:** `ccfaecc`

**Summary of changes:**
- Changed trigger to only `pull_request` on `main` (removed `push`)
- Added npm caching via `actions/setup-node@v4` with `cache-dependency-path` for both `backend/package-lock.json` and `frontend/package-lock.json`
- Split single `ci` job into 3 parallel jobs:
  - **test**: lint (backend + frontend), typecheck (`tsc --noEmit` + `next build`), unit tests, coverage upload
  - **e2e**: Playwright with postgres + redis service containers, backend build and serve, Playwright tests
  - **build**: Docker Compose build
- Added `AUTH_JWT_SECRET`, `AUTH_JWT_TOKEN_EXPIRES_IN`, and `REDIS_HOST` env vars
