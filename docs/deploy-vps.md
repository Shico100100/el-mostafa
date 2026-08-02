# 🚀 نشر ELMostafa ERP على VPS

> دليل كامل لنشر نظام إدارة مصنع البلاستيك على سيرفر إنتاجي

---

## 1. المتطلبات

### منك:
- GitHub repo مع access tokens
- VPS (Ubuntu 22.04+ / Debian 12+) — أي حاجة من:
  - DigitalOcean Droplet ($12-24/month)
  - Hetzner CX22 (~€4/month)
  - AWS EC2 t3.small
  - أي سيرفر خاص
- Domain name (مثلاً `erp.your-company.com`)
- `A record` يشاور على IP الـ VPS

### من المشروع:
- ✅ Docker images جاهزة (GHCR)
- ✅ CI/CD pipeline (tests → build → push → deploy)
- ✅ Caddy لـ auto SSL (Let's Encrypt)
- ✅ docker-compose للمنتج

---

## 2. GitHub Secrets

روح على `Settings → Secrets and variables → Actions` في الـ repo:

| Secret | إزاي تجيبه |
|--------|------------|
| `DEPLOY_HOST` | IP الـ VPS: `ssh root@<ip>` واستعمل `curl ifconfig.me` |
| `DEPLOY_USER` | عادةً `root` |
| `DEPLOY_SSH_KEY` | `cat ~/.ssh/id_ed25519.pub` → `~/.ssh/authorized_keys` على الـ VPS، والـ private key `cat ~/.ssh/id_ed25519` تحطه في secret |

> **ملاحظة:** `GITHUB_TOKEN` موجود تلقائياً — ما يحتاجش إضافة.

---

## 3. تجهيز الـ VPS (مرة واحدة)

```bash
ssh root@<your-vps-ip>
```

### 3.1 Docker

```bash
curl -fsSL https://get.docker.com | bash
systemctl enable --now docker
docker compose version  # تأكد إنه شغال
```

### 3.2 تحميل ملفات الإنتاج

```bash
mkdir -p /opt/elmostafa && cd /opt/elmostafa

# استبدل your-org/el-mostafa باسم الـ repo بتاعك
REPO="your-org/el-mostafa"

curl -sL "https://raw.githubusercontent.com/$REPO/main/docker-compose.prod.yml" -o docker-compose.yml
curl -sL "https://raw.githubusercontent.com/$REPO/main/Caddyfile" -o Caddyfile
```

### 3.3 إنشاء ملف البيئة

```bash
nano .env
```

الصق المحتوى ده وعدل القيم:

```bash
# === Domain ===
DOMAIN=erp.your-company.com
GHCR_NAMESPACE=your-org/el-mostafa

# === Database ===
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=$(openssl rand -base64 32)
DATABASE_NAME=elmostafa

# === JWT Secrets (أنشئها بـ openssl rand -base64 64) ===
AUTH_JWT_SECRET=put-a-random-64-char-string-here
AUTH_JWT_TOKEN_EXPIRES_IN=1d
AUTH_REFRESH_SECRET=put-another-random-64-char-string-here
AUTH_REFRESH_TOKEN_EXPIRES_IN=7d
AUTH_FORGOT_SECRET=put-another-random-64-char-string-here
AUTH_FORGOT_TOKEN_EXPIRES_IN=30m
AUTH_CONFIRM_EMAIL_SECRET=put-another-random-64-char-string-here
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

# === Mail (SMTP) ===
MAIL_HOST=smtp.your-company.com
MAIL_PORT=587
MAIL_DEFAULT_EMAIL=noreply@your-company.com
MAIL_DEFAULT_NAME=ELMostafa

# === File Storage ===
FILE_DRIVER=local
```

لتوليد secrets عشوائية:

```bash
openssl rand -base64 64   # استعمله لكل AUTH_*_SECRET
openssl rand -base64 32   # استعمله لـ DATABASE_PASSWORD
```

### 3.4 تشغيل PostgreSQL و Redis الأول

```bash
cd /opt/elmostafa
docker compose up -d postgres redis
```

انتظر 10 ثواني وتأكد:

```bash
docker compose ps
# postgres and redis should be "running"
```

### 3.5 تشغيل باقي الخدمات

```bash
docker compose up -d backend frontend caddy
```

### 3.6 التحقق

```bash
# هل الخدمات شغالة؟
docker compose ps

# هل الباكند يستجيب؟
curl -s http://localhost:3001/api/v1/health | head -c 200

# هل الفرونت مشي؟
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000

# هل Caddy شغال على الـ domain؟
curl -s -o /dev/null -w "%{http_code}" https://erp.your-company.com
```

---

## 4. CI/CD — النشر التلقائي

كل ما تعمل `git push` على `main`:

```
あなた → git push origin main
         ↓
    GitHub Actions (ci.yml)
         ↓
    tests (jest + vitest + tsc)
         ↓
    lint + audit
         ↓
    build Docker images
         ↓
    push to ghcr.io
         ↓
    SSH → VPS: docker compose pull && up -d
```

### تفعيل CI/CD

1. أضف GitHub secrets (الخطوة 2)
2. أول push على `main` يشغّل الـ pipeline كامل
3. الـ deploy job يتطلب نجاح test + audit + build + e2e

---

## 5. Releases

كل push على `main` يشغّل `release.yml`:

- auto-tag: `v0.1.0` → `v0.1.1` → `v0.2.0` ...
- changelog من commit messages
- GitHub Release

التنسيق المتوقع لـ commit messages:

```
feat: add inventory export
fix: correct stock calculation
perf: optimize journal entries query
chore(deps): upgrade typeorm to 0.3.31
```

---

## 6. الصيانة

### عرض logs

```bash
# كل الخدمات
docker compose logs -f --tail=50

# خدمة معينة
docker compose logs -f backend

# الـ API logs
docker compose logs -f backend | grep "GET /api"
```

### Backup قاعدة البيانات

```bash
# يدوي
docker exec erp-postgres pg_dump -U postgres elmostafa > backup_$(date +%Y%m%d).sql

# أوتوماتيك (جوب cron)
echo "0 3 * * * root docker exec erp-postgres pg_dump -U postgres elmostafa > /backups/elmostafa_\$(date +\%Y\%m\%d).sql" > /etc/cron.d/elmostafa-backup
```

### تحديث الـ images

```bash
cd /opt/elmostafa
docker compose pull
docker compose up -d --force-recreate
docker image prune -f
```
> (لو مشيت على CI/CD، ده بيحصل أتوماتيك)

### استرجاع لو حصل مشكلة

```bash
# ارجع لآخر version شغالة
docker compose down
# استخدم latest known working tag بدل latest
docker compose up -d
```

---

## 7. مشاكل وحلول

### Caddy ما بيجيبش SSL

```bash
# تأكد إن DNS A record يشاور على IP الـ VPS
dig erp.your-company.com

# شوف logs
docker compose logs caddy
```

### PostgreSQL مش شغال

```bash
docker compose logs postgres
# غالباً مشكلة permissions
chown -R 999:999 /var/lib/docker/volumes/elmostafa_postgres_data/
```

### Backend مش قايم

```bash
docker compose logs backend
# أشهر مشكلة: DATABASE_PASSWORD مش مضبوط في .env
# أو migration فشلت
```

### Frontend مش قايم

```bash
docker compose logs frontend
# أشهر مشكلة: NEXT_PUBLIC_API_URL غلط أو backend مش قايم
```

---

## 8. الـ Architecture

```
Internet → Caddy (443 SSL)
              ├── /api/v1/* → backend:3001 (NestJS)
              ├── /socket.io/* → backend:3001
              └── /* → frontend:3000 (Next.js)

backend:3001 ──┬── postgres:5432
               └── redis:6379
```

- **Caddy**: auto SSL + reverse proxy + static file serving
- **Backend**: NestJS API → TypeORM → PostgreSQL + Redis
- **Frontend**: Next.js SSR → Caddy (لأن Caddy يخدم Next.js عادي)
