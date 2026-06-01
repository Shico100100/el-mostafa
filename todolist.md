# ToDo لتنفيذ تحسينات صفحة Machines — ✅ مُنجز بالكامل

> تم التحقق من الكود: جميع البنود التالية منفذة بالفعل في صفحة `frontend/app/manufacturing/machines/page.tsx`

## المرحلة 1: مراجعة وتحديث UI
- [x] إضافة validation basic قبل الإرسال (name/serial/power_consumption/status).
- [x] استبدال alert برسالة Toast/Inline (يستخدم `sonner` toast).

## المرحلة 2: تحسين بطاقة الماكينة
- [x] عرض `last_maintenance` و `next_maintenance` داخل البطاقة.
- [x] جعل تنبيه overdue actionable مع إشارة لونية (أحمر للـ overdue).

## المرحلة 3: تحسين منطق overdue
- [x] عرض "يستحق خلال X أيام" مع تلوين (أصفر ≤7 أيام، أحمر إذا تجاوز).

## المرحلة 4: تحسين الأداء
- [x] إضافة search + filter بالحالة + pagination.
- [x] تقليل reload كامل: استخدام React state محلي بدلاً من reload.

## المرحلة 5: تحسين Backend
- [ ] إضافة endpoint "overview" — اختياري، ليس ضرورياً حالياً.
