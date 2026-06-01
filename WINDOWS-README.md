# دليل تشغيل نظام المصطفى على ويندوز 🪟

هذا الدليل يشرح كيفية تثبيت وتشغيل نظام المصطفى على أنظمة ويندوز.

## المتطلبات الأساسية

قبل البدء، تأكد من تثبيت البرامج التالية:

### 1. Node.js (v18 أو أحدث)
- حمّل من: https://nodejs.org/
- اختر النسخة LTS (Long Term Support)
- بعد التثبيت، تحقق من الإصدار:
  ```powershell
  node --version
  npm --version
  ```

### 2. PostgreSQL (v14 أو أحدث)
- حمّل من: https://www.postgresql.org/download/windows/
- خلال التثبيت:
  - اختر password للمستخدم `postgres` (مثلاً: `postgres`)
  - احفظ الباسوورد في مكان آمن
  - اترك المنفذ الافتراضي: `5432`
- بعد التثبيت، تحقق من أن PostgreSQL يعمل:
  - افتح Services (Win+R ثم اكتب `services.msc`)
  - ابحث عن `postgresql-x64-XX` وتأكد أنه Running

### 3. Git (اختياري)
- إذا كنت تريد استنساخ المشروع من GitHub

---

## خطوات التثبيت

### الطريقة الأولى: استخدام السكربت الآلي (موصى به) ⭐

1. **افتح PowerShell كمسؤول** (Administrator):
   - اضغط `Win+X` واختر "Windows PowerShell (Admin)"
   
2. **انتقل إلى مجلد المشروع**:
   ```powershell
   cd D:\MostafaSaid\ELMostafa
   ```

3. **السماح بتشغيل السكربتات** (إذا كانت المرة الأولى):
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

4. **شغّل سكربت الإعداد**:
   ```powershell
   .\setup-windows.ps1
   ```
   
   السكربت سيقوم بـ:
   - ✅ التحقق من Node.js و PostgreSQL
   - ✅ إنشاء قاعدة البيانات `elmostafa_db`
   - ✅ تثبيت جميع الاعتماديات للـ Backend والـ Frontend
   - ✅ إنشاء ملف `.env` في مجلد backend

---

### الطريقة الثانية: التثبيت اليدوي

#### 1. إنشاء قاعدة البيانات

افتح **Command Prompt** أو **PowerShell** واكتب:

```powershell
# تسجيل الدخول إلى PostgreSQL
psql -U postgres

# إنشاء قاعدة البيانات (داخل psql)
CREATE DATABASE elmostafa_db;

# الخروج
\q
```

#### 2. إنشاء ملف البيئة

أنشئ ملف باسم `.env` في مجلد `backend` بالمحتوى التالي:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=elmostafa_db

# JWT Configuration
JWT_SECRET=your-secret-key-here-change-in-production
JWT_EXPIRATION=7d

# Server Configuration
PORT=3001
NODE_ENV=development
```

⚠️ **مهم**: قم بتغيير `DB_PASSWORD` إلى الباسوورد الذي اخترته عند تثبيت PostgreSQL.

#### 3. تثبيت الاعتماديات

```powershell
# تثبيت اعتماديات Backend
cd backend
npm install

# تثبيت اعتماديات Frontend
cd ..\frontend
npm install

# العودة إلى المجلد الرئيسي
cd ..
```

---

## تشغيل النظام

### الطريقة الأولى: استخدام السكربت (سهل) ⭐

```powershell
.\start-windows.ps1
```

السكربت سيفتح نافذتين منفصلتين:
- **نافذة Backend**: تعمل على `http://localhost:3001`
- **نافذة Frontend**: تعمل على `http://localhost:3000`

انتظر حوالي 30 ثانية حتى يكتمل التشغيل، ثم افتح المتصفح على: http://localhost:3000

### الطريقة الثانية: التشغيل اليدوي

افتح **نافذتين** من PowerShell أو Command Prompt:

**النافذة الأولى - Backend:**
```powershell
cd backend
npm run start:dev
```

**النافذة الثانية - Frontend:**
```powershell
cd frontend
npm run dev
```

---

## إيقاف النظام

- إذا استخدمت السكربت: أغلق نوافذ PowerShell الخاصة بالـ Backend والـ Frontend
- إذا شغّلت يدوياً: اضغط `Ctrl+C` في كل نافذة

---

## استكشاف الأخطاء

### خطأ: "execution of scripts is disabled"

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### خطأ: "psql is not recognized"

تأكد من إضافة PostgreSQL إلى PATH:
1. افتح System Properties → Environment Variables
2. أضف مسار PostgreSQL إلى PATH، مثلاً:
   ```
   C:\Program Files\PostgreSQL\15\bin
   ```

### خطأ: "connection refused" من Backend

تأكد من:
- ✅ PostgreSQL يعمل (تحقق من Services)
- ✅ الباسوورد صحيح في ملف `.env`
- ✅ اسم قاعدة البيانات صحيح: `elmostafa_db`

### Backend يعمل لكن الصفحة بيضاء

انتظر دقيقة حتى يكتمل build الـ Frontend أول مرة، ثم حدّث الصفحة.

---

## النسخ الاحتياطي

لعمل نسخة احتياطية من قاعدة البيانات:

```powershell
# افتح PowerShell في مجلد المشروع
$backupDir = "backups"
if (!(Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir }

$date = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupDir\elmostafa_backup_$date.sql"

# عمل النسخة الاحتياطية
pg_dump -U postgres -d elmostafa_db -f $backupFile

Write-Host "تم حفظ النسخة الاحتياطية في: $backupFile"
```

---

## معلومات إضافية

- **Backend** مبني على: NestJS + TypeScript
- **Frontend** مبني على: Next.js + React
- **قاعدة البيانات**: PostgreSQL
- **المنافذ المستخدمة**:
  - Backend: `3001`
  - Frontend: `3000`
  - PostgreSQL: `5432`

---

## الدعم الفني

لأي استفسارات أو مشاكل، يرجى التواصل مع فريق التطوير.

---

## 🚀 تشغيل النظام (وضع الإنتاج - Production)

إذا كنت تريد تشغيل النظام في بيئة إنتاجية (أسرع وأكثر استقراراً) كما في لينكس، استخدم السكربت الجديد:

1. افتح PowerShell كمسؤول (اختياري لكن مفضل).
2. شغل السكربت:
   ```powershell
   .\start-prod-windows.ps1
   ```
   
هذا السكربت سيقوم بـ:
1. بناء المشروع (Build) للـ Backend والـ Frontend.
2. استخدام **PM2** لإدارة العمليات في الخلفية (نفس الطريقة المستخدمة في سيرفرات لينكس).

---

## ⚠️ ملاحظة هامة حول البيانات (قاعدة البيانات)

على الرغم من أن النظام يعمل بنفس الطريقة على ويندوز ولينكس، إلا أن **قاعدة البيانات منفصلة** لكل نظام تشغيل.
- البيانات التي تدخلها وأنت تعمل على **Windows** تخزن في نسخة Postgres المحلية على الويندوز.
- البيانات التي تدخلها وأنت تعمل على **Linux** (WSL أو نظام منفصل) تخزن في نسخة Postgres الخاصة باللينكس.

**لن تجد بيانات الويندوز عند فتح اللينكس والعكس**، إلا إذا قمت بربط النظامين بقاعدة بيانات مركزية واحدة.
