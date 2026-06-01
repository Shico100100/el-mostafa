This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 📁 دليل ملفات الواجهة الأمامية (Frontend File Guide)

هذا الدليل يشرح أهم الملفات والمجلدات الموجودة في جزء الواجهة (الموقع الذي تراه):

### ⚙️ ملفات الإعدادات (Configuration)

1. **`.env.local`**
   - **ما هو؟** ملف إعدادات محلية للواجهة.
   - **لماذا؟** ليخبر الواجهة أين يوجد السيرفر (Backend) لتتحدث معه.
   - **كيف يعمل؟** يحتوي على عنوان الرابط للسيرفر (مثل `http://localhost:3001`).

2. **`package.json`**
   - **ما هو؟** قائمة بكل الأدوات المستخدمة لبناء الموقع.
   - **لماذا؟** لضمان وجود كل الأجزاء اللازمة لتشغيل التصميمات والرسومات.

3. **`next.config.ts`**
   - **ما هو؟** إعدادات محرك الموقع (Next.js).
   - **لماذا؟** لتعديل كيفية عمل الموقع، مثل السماح بربط صور من مصادر خارجية أو تحسين الأداء.

4. **`tsconfig.json` & `postcss.config.mjs`**
   - **ما هي؟** ملفات تقنية تضبط لغة البرمجة (TypeScript) وطريقة معالجة الألوان والخطوط (CSS).

### 📂 المجلدات الأساسية (Main Folders)

- **`app/`**: المجلد الأهم! يحتوي على جميع صفحات الموقع (صفحة المخازن، صفحة المبيعات، إلخ).
- **`components/`**: يحتوي على "القطع" التي يتكون منها الموقع، مثل الأزرار، الجداول، أو القوائم الجانبية التي تتكرر في كل الصفحات.
- **`lib/`**: يحتوي على أكواد مساعدة مشتركة، مثل كود الاتصال بالسيرفر أو معالجة التواريخ.
- **`public/`**: يحتوي على الصور، الأيقونات، والملفات التي تظهر للجميع على الموقع.
- **`.next/`**: مجلد يتم إنشاؤه تلقائياً عند تشغيل البرنامج، ولا يحتاج المستخدم لتعديله (يحتوي على النسخة الجاهزة للتشغيل).
