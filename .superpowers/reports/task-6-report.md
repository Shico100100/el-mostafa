# Task 6: Docker Compose Setup — Report

**Status:** DONE_WITH_CONCERNS

## What was implemented

Created/updated all 7 files as specified in the task:

| File | Action | Notes |
|---|---|---|
| `backend/Dockerfile` | Updated | Multi-stage build, node:20-alpine, simplified from dev-oriented version |
| `frontend/Dockerfile` | Updated | Multi-stage build with Next.js standalone, node:20-alpine |
| `docker-compose.yml` | Updated | postgres + backend + frontend services |
| `.dockerignore` | Created | Root-level ignore for Docker builds |
| `backend/.dockerignore` | Updated | Added .git, .env to existing ignores |
| `frontend/.dockerignore` | Created | node_modules, .next, .git |
| `scripts/deploy.sh` | Created | Build, start, migrate, seed script |

## Self-review findings

1. **The task spec's `NEXT_PUBLIC_API_URL: http://localhost:3001` is incorrect for Docker networking** — inside a container, `localhost` refers to the container itself, not the host. The previous working docker-compose used `http://backend:3001`. This was implemented as-is per spec but noted as a concern.

2. **The task spec's env var names don't match the backend's actual config** — the backend reads `DATABASE_USERNAME` (not `DATABASE_USER`) and `AUTH_JWT_SECRET` (not `JWT_SECRET`) based on `.env.example`. The docker-compose uses the task spec's names.

3. **The task spec copies full node_modules** — the previous `Dockerfile.prod` used `npm ci --omit=dev` for a smaller production image. The task spec copies all node_modules from builder.

4. **No healthcheck on postgres** — the previous docker-compose had a postgres healthcheck and `depends_on` with `condition: service_healthy`. The task spec has basic `depends_on` only.

5. **The deploy.sh seed script depends on `axios` and `jsonwebtoken`** — these may not be available in the production backend container since they're not in `package.json` dependencies.

6. **Node version downgraded** — existing Dockerfiles used node:22-alpine; task spec uses node:20-alpine. This is fine per the spec (Node.js 20 LTS) but may affect packages expecting node 22 features.

## Concerns summary

The files are implemented exactly per spec, but the docker-compose will not work correctly out of the box due to:
- Frontend can't reach backend (localhost vs container name networking)
- Env var name mismatches with actual backend config
- Deploy script seed will fail (missing axios/jsonwebtoken deps)

These should be addressed in a follow-up or the next iteration.
