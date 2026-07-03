# Task 6 Fix Report: Docker Compose Setup

**Date:** 2026-07-03

---

## What Was Fixed

### Critical Issue 1: NEXT_PUBLIC_API_URL is a build-time variable
- **Problem:** `NEXT_PUBLIC_*` variables are inlined at build time by Next.js. Setting them in `docker-compose.yml` `environment` has zero effect. Also, `http://localhost:3001` is wrong inside Docker networking.
- **Fix:** Moved `NEXT_PUBLIC_API_URL` to a `build.args` in `docker-compose.yml` and declared `ARG NEXT_PUBLIC_API_URL` + `ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL` in `frontend/Dockerfile` builder stage. Default value is `http://backend:3001/api/v1` (Docker service name, not localhost).

### Critical Issue 2: Frontend missing HOSTNAME=0.0.0.0
- **Problem:** Next.js standalone mode defaults to listening on `127.0.0.1`, making the frontend unreachable from outside the container.
- **Fix:** Added `ENV HOSTNAME=0.0.0.0` to the runner stage of `frontend/Dockerfile`.

### Critical Issue 3: Backend env var name mismatches
- **Problem:** `DATABASE_USER: postgres` should be `DATABASE_USERNAME: postgres` (backend uses `DATABASE_USERNAME`). `JWT_SECRET` should be `AUTH_JWT_SECRET` (backend auth config validates `AUTH_JWT_SECRET`).
- **Fix:** Renamed `DATABASE_USER` → `DATABASE_USERNAME` and `JWT_SECRET` → `AUTH_JWT_SECRET` in `docker-compose.yml`.

### Critical Issue 4: Missing required auth env vars
- **Problem:** Backend auth config validates 8 `AUTH_*` env vars with `@IsString()`. None were set in `docker-compose.yml`. Backend would crash on startup with validation errors.
- **Fix:** Added all required auth env vars to `docker-compose.yml` with secure defaults:
  - `AUTH_JWT_SECRET`
  - `AUTH_JWT_TOKEN_EXPIRES_IN` (1h)
  - `AUTH_REFRESH_SECRET`
  - `AUTH_REFRESH_TOKEN_EXPIRES_IN` (7d)
  - `AUTH_FORGOT_SECRET`
  - `AUTH_FORGOT_TOKEN_EXPIRES_IN` (1h)
  - `AUTH_CONFIRM_EMAIL_SECRET`
  - `AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN` (1d)

### Critical Issue 5: deploy.sh uses axios and jsonwebtoken not in backend dependencies
- **Problem:** `require('axios')` and `require('jsonwebtoken')` in `deploy.sh` would throw `MODULE_NOT_FOUND` since neither is in backend's `package.json`.
- **Fix:** Replaced with Node's built-in `crypto` module for JWT generation (HS256) and `curl` for the HTTP request. No external dependencies needed.

### Additional: Postgres healthcheck
- **Problem:** Backend would start before PostgreSQL was ready, causing connection failures.
- **Fix:** Added `pg_isready` healthcheck to postgres service. Backend now uses `depends_on` with `condition: service_healthy`.

### Additional: Restart policies
- **Problem:** Services would not restart on crash or reboot.
- **Fix:** Added `restart: unless-stopped` to all services.

---

## Files Changed

| File | Changes |
|------|---------|
| `docker-compose.yml` | Fixed env var names, added auth vars, build args, healthcheck, restart policies |
| `frontend/Dockerfile` | Added `ARG NEXT_PUBLIC_API_URL`, `ENV HOSTNAME=0.0.0.0` |
| `scripts/deploy.sh` | Replaced axios/jsonwebtoken with native crypto + curl |

---

## Concerns

1. **Secret management:** All auth secrets use placeholder defaults. For production, these MUST be overridden via a `.env` file or external secrets manager.
2. **The `FRONTEND_DOMAIN` env var** in backend is still set to `http://localhost:3000` — this is correct for local dev but may need adjustment for production deployments with real domains.
3. **No `.env` file for docker-compose:** The deploy script assumes env vars have defaults (via `${VAR:-default}` syntax). A `.env.example` for docker-compose would help operators.
