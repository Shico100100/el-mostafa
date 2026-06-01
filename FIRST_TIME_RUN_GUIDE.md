# دليل تشغيل نظام ELMostafa للمرة الأولى على ويندوز

## 1. المتطلبات الأساسية
- **Node.js** (الإصدار 18 أو أحدث)  
  - التحقق: `node --version` و `npm --version`
- **PostgreSQL** (الإصدار 14 أو أحدث)  
  - التحقق: `psql --version`
- **Python** (الإصدار 3.10 أو أحدث)  
  - التحقق: `python --version`

## 2. إعداد قاعدة البيانات
1. افتح PowerShell كمسؤول.  
2. إنشاء قاعدة البيانات `elmostafa_db` (إذا لم تكن موجودة):
   ```powershell
   psql -U postgres -c "CREATE DATABASE elmostafa_db;"
   ```
   - إذا ظهرت رسالة `password authentication failed`، أدخل كلمة المرور التي حددتها أثناء تثبيت PostgreSQL.

## 3. إعداد المتغيرات البيئية
- ملف `.env` موجود في مجلد `backend`.  
- تأكد من أن القيم التالية مطابقة:
  ```
  DATABASE_HOST=localhost
  DATABASE_PORT=5432
  DATABASE_USERNAME=postgres
  DATABASE_PASSWORD=postgres
  DATABASE_NAME=elmostafa_db
  ```

## 4. تثبيت الاعتماديات
```powershell
# تثبيت backend
cd backend
npm install

# تثبيت frontend
cd ..\frontend
npm install
```

## 5. تشغيل النظام
### الطريقة 1: باستخدام سكربت البايثون
```powershell
python python_start.py
```
- سيقوم السكربت تلقائياً:
  - التحقق من وجود ملف `.env`.
  - إيقاف أي عمليات Node.js تعمل على المنافذ 3000 و 3001.
  - تشغيل الـ Backend (`npm run start:dev`).
  - انتظار جاهزية الـ Backend ثم تشغيل الـ Frontend (`npm run dev`).
  - عرض عناوين URL وبيانات تسجيل الدخول الافتراضية.

### الطريقة 2: باستخدام سكربت PowerShell
```powershell
.\start-windows.ps1
```
- يفتح نافذتين منفصلتين: واحدة للـ Backend (3001) وأخرى للـ Frontend (3000).

## 6. الوصول إلى التطبيق
- **Frontend**: `http://localhost:3000`  
- **Backend API**: `http://localhost:3001/api`

## 7. بيانات تسجيل الدخول الافتراضية
| البريد الإلكتروني | كلمة المرور |
|-------------------|-------------|
| admin@admin.com   | admin123    |
| newadmin@example.com | newadmin123 |

## 8. إيقاف النظام
- إذا استخدمت السكربت البايثون: اضغط `Ctrl+C` في نافذة PowerShell.  
- إذا استخدمت السكربت PowerShell: أغلق النوافذ المفتوحة أو اضغط `Ctrl+C`.

## 9. نصائح إضافية
- إذا واجهت أي مشاكل في الاتصال بقاعدة البيانات، تأكد من تشغيل خدمة PostgreSQL في Services (`services.msc`) وأن المنفذ 5432 مفتوح.  
- لتحديث الحزم: `npm update` في مجلد `backend` و `frontend`.  
- لتشغيل في وضع الإنتاج: استخدم `.\start-prod-windows.ps1` بعد بناء المشروع (`npm run build` لكل من backend و frontend).

---

> **ملاحظة**: إذا كنت تريد تشغيل التطبيق على نظام Linux أو WSL، استخدم السكربت `start.sh` الموجود في الجذر.