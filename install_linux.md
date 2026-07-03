# ELMostafa — Installation Guide (Linux)

## Prerequisites

| Requirement | Version | Install Command |
|---|---|---|
| **Docker Engine** | Latest | `curl -fsSL https://get.docker.com \| sh` |
| **Docker Compose Plugin** | v2+ | (included with modern Docker) |
| **Node.js** | 22.x | `curl -fsSL https://deb.nodesource.com/setup_22.x \| bash - && apt install -y nodejs` |
| **Python** | 3.10+ | `apt install -y python3 python3-pip python3-venv` |
| **Git** | Latest | `apt install -y git` |
| **Make** | — | `apt install -y make` |

---

## 1. Clone the Repository

```bash
cd /opt
git clone <repo-url> elmostafa
cd elmostafa
```

Or if files are already on the server, copy them into place.

---

## 2. Start Docker PostgreSQL

```bash
docker compose up -d postgres
```

Verify:

```bash
docker ps --filter name=elmostafa-db
```

Expected: `elmostafa-db` with status `Up`, port `0.0.0.0:5432->5432/tcp`.

---

## 3. Restore Database Backup

A backup file is provided at `backups/elmostafa_db-2026-05-14-20-27-35.sql`.

Wait 5 seconds for PostgreSQL, then restore:

```bash
docker exec -i elmostafa-db psql -U postgres -d elmostafa_db < backups/elmostafa_db-2026-05-14-20-27-35.sql
```

Verify:

```bash
docker exec elmostafa-db psql -U postgres -d elmostafa_db -c "SELECT COUNT(*) FROM products;"
```

Should return `9`.

---

## 4. Install Backend Dependencies

```bash
cd backend
npm install
```

Build:

```bash
npm run build
```

---

## 5. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

---

## 6. (Optional) Install Chatbot

```bash
cd ../chatbot
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m spacy download ar_core_web_sm
```

---

## 7. Environment Configuration

The `.env` file at `backend/.env` is pre-configured for local PostgreSQL (`DATABASE_HOST=localhost`).  
For production deployments, edit these values:

```bash
nano backend/.env
```

Key settings:

```
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=elmostafa_db
DATABASE_SYNCHRONIZE=false
AUTH_JWT_SECRET=<generate-a-random-secret>
AUTH_REFRESH_SECRET=<generate-another-random-secret>
FRONTEND_DOMAIN=http://localhost:3000
APP_PORT=3001
```

Generate secure secrets:

```bash
openssl rand -hex 32
```

> **Never** use the default secrets in production.

---

## 8. Run the App

### Option A: One-command startup

```bash
cd /opt/elmostafa
python3 python_start.py
```

This starts Backend (3001), Frontend (3000), and Chatbot (8765).  
Press **Ctrl+C** to stop all.

> On Linux, `python_start.py` may need `chmod +x python_start.py` first.

### Option B: Docker Compose (full stack)

```bash
docker compose up -d
```

This starts PostgreSQL, Backend, and Frontend all in containers.  
Frontend will be available at http://localhost:3000.

> The Docker Compose setup builds backend/frontend images from Dockerfile, which may take 2-5 minutes on first run.

### Option C: Manual (for development)

**Terminal 1 — Backend:**

```bash
cd /opt/elmostafa/backend
NODE_OPTIONS="--max-old-space-size=2048" node dist/main
```

**Terminal 2 — Frontend:**

```bash
cd /opt/elmostafa/frontend
NODE_OPTIONS="--max-old-space-size=2048" npx next dev -H 0.0.0.0
```

**Terminal 3 — Chatbot (optional):**

```bash
cd /opt/elmostafa/chatbot
source venv/bin/activate
python main.py
```

---

## 9. Seed Demo Data (Optional)

With the backend running:

```bash
# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/email/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"admin123"}' | jq -r '.token')

# Seed data
curl -s -X POST http://localhost:3001/api/v1/system/seed \
  -H "Authorization: Bearer $TOKEN"
```

Expected: `{"message":"Demo data seeded successfully"}`

---

## 10. Login

Open http://localhost:3000 in your browser.

| Email | Password |
|---|---|
| `admin@admin.com` | `admin123` |

---

## Running as a System Service (systemd)

Create `/etc/systemd/system/elmostafa-backend.service`:

```ini
[Unit]
Description=ELMostafa Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/elmostafa/backend
ExecStart=/usr/bin/node dist/main
Environment=NODE_OPTIONS=--max-old-space-size=2048
Environment=NODE_ENV=production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/elmostafa-frontend.service`:

```ini
[Unit]
Description=ELMostafa Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/elmostafa/frontend
ExecStart=/usr/bin/npx next start -H 0.0.0.0
Environment=NODE_OPTIONS=--max-old-space-size=2048
Environment=NODE_ENV=production
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable elmostafa-backend elmostafa-frontend
systemctl start elmostafa-backend elmostafa-frontend
```

---

## Backup Database

```bash
docker exec elmostafa-db pg_dump -U postgres elmostafa_db > backups/elmostafa_db-$(date +%F-%H-%M-%S).sql
```

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Port 3001 already in use | `fuser -k 3001/tcp` or `kill $(lsof -ti:3001)` |
| Frontend OOM crash | Set `NODE_OPTIONS="--max-old-space-size=2048"` |
| Docker permission denied | Add user to docker group: `usermod -aG docker $USER && newgrp docker` |
| PostgreSQL won't start | Check logs: `docker logs elmostafa-db` |
| Connection to database refused | Ensure PostgreSQL container is healthy: `docker compose ps` |

---

## Updating

```bash
cd /opt/elmostafa
git pull
cd backend && npm install && npm run build
cd ../frontend && npm install
```

Then restart the servers.
