# ELMostafa — Installation Guide (Windows)

## Prerequisites

| Requirement | Version | Download |
|---|---|---|
| **Docker Desktop** | Latest | https://docs.docker.com/desktop/setup/install/windows-install/ |
| **Node.js** | 22.x | https://nodejs.org/ |
| **Python** | 3.10+ | https://www.python.org/downloads/ |
| **Git** | Latest | https://git-scm.com/download/win |

> Docker Desktop requires **WSL 2** backend. During installation, follow the prompt to enable it.  
> After installing Docker Desktop, **restart your PC**.

---

## 1. Clone & Prepare

```powershell
cd C:\ELMostafa
```

All files are already in place. If starting fresh:

```powershell
git clone <repo-url> C:\ELMostafa
cd C:\ELMostafa
```

---

## 2. Start Docker PostgreSQL

Open **Docker Desktop** and wait for it to finish starting (whale icon stops animating).

Start the database container:

```powershell
docker compose up -d postgres
```

Verify it's running:

```powershell
docker ps --filter name=elmostafa-db
```

Expected output: `elmostafa-db` with status `Up` and port `0.0.0.0:5432->5432/tcp`.

---

## 3. Restore Database Backup

A backup file is provided at `backups/elmostafa_db-2026-05-14-20-27-35.sql` (~139 KB).

Wait 5 seconds for PostgreSQL to fully initialize, then restore:

```powershell
docker exec -i elmostafa-db psql -U postgres -d elmostafa_db < backups\elmostafa_db-2026-05-14-20-27-35.sql
```

Expected output: `SET`, `CREATE TABLE`, `ALTER TABLE`, `INSERT 0 1` etc. (no errors).

Verify data was restored:

```powershell
docker exec elmostafa-db psql -U postgres -d elmostafa_db -c "SELECT COUNT(*) FROM products;"
```

Should return `9` products.

---

## 4. Install Backend Dependencies

```powershell
cd backend
npm install
```

Build the backend:

```powershell
npm run build
```

This compiles TypeScript to `dist/`. Takes ~30 seconds.

---

## 5. Install Frontend Dependencies

```powershell
cd ../frontend
npm install
```

---

## 6. (Optional) Install Chatbot Dependencies

```powershell
cd ../chatbot
pip install -r requirements.txt
python -m spacy download ar_core_web_sm
```

---

## 7. Configure Environment

The `.env` file at `backend\.env` is pre-configured with:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=elmostafa_db
DATABASE_SYNCHRONIZE=false
AUTH_JWT_SECRET=change-me-in-production
AUTH_JWT_TOKEN_EXPIRES_IN=1d
AUTH_REFRESH_SECRET=change-me-too
AUTH_REFRESH_TOKEN_EXPIRES_IN=7d
FRONTEND_DOMAIN=http://localhost:3000
APP_PORT=3001
```

> **Security:** Change `AUTH_JWT_SECRET` and `AUTH_REFRESH_SECRET` to random values before deploying.

---

## 8. Run the App

### Option A: One-command startup (recommended)

```powershell
cd C:\ELMostafa
python python_start.py
```

This starts Backend (3001), Frontend (3000), and Chatbot (8765) in sequence.  
Press **Ctrl+C** to stop all.

### Option B: Manual startup (for development)

**Terminal 1 — Backend:**

```powershell
cd C:\ELMostafa\backend
$env:NODE_OPTIONS="--max-old-space-size=2048"
node dist/main
```

**Terminal 2 — Frontend:**

```powershell
cd C:\ELMostafa\frontend
$env:NODE_OPTIONS="--max-old-space-size=2048"
npx next dev -H 0.0.0.0
```

**Terminal 3 — Chatbot (optional):**

```powershell
cd C:\ELMostafa\chatbot
python main.py
```

---

## 9. Seed Demo Data (Optional)

After the backend is running, seed the database with demo data:

```powershell
# Get an auth token
$r = Invoke-WebRequest "http://localhost:3001/api/v1/auth/email/login" -Method POST -Body '{"email":"admin@admin.com","password":"admin123"}' -ContentType "application/json" -UseBasicParsing
$token = ($r.Content | ConvertFrom-Json).token

# Seed data
Invoke-WebRequest "http://localhost:3001/api/v1/system/seed" -Method POST -Headers @{Authorization="Bearer $token"} -UseBasicParsing
```

Expected: `201 {"message":"Demo data seeded successfully"}`

---

## 10. Login

Open http://localhost:3000 in your browser.

| Email | Password |
|---|---|
| `admin@admin.com` | `admin123` |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `EADDRINUSE` port 3001 | `powershell -Command "Get-NetTCPConnection -LocalPort 3001 \| Select -ExpandProperty OwningProcess \| ForEach { taskkill /F /PID $_ }"` |
| Frontend OOM crash | Set `$env:NODE_OPTIONS="--max-old-space-size=2048"` before running |
| Docker PostgreSQL won't start | Open Docker Desktop, wait for engine to be ready |
| Database connection refused | Ensure `docker compose up -d postgres` is running and port 5432 is free |
| pg_dump not found | Install PostgreSQL locally or use `docker exec elmostafa-db pg_dump -U postgres elmostafa_db > backup.sql` |
| Arabic text garbled in terminal | Run `chcp 65001` before commands, or use Windows Terminal |

---

## Updating

```powershell
cd C:\ELMostafa
git pull
cd backend && npm install && npm run build
cd ../frontend && npm install
```

Restart the servers.
