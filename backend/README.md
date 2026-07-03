# ELMostafa — Backend API

NestJS 11 + TypeORM + PostgreSQL

Factory management API: auth, inventory, sales, purchases, manufacturing, accounting, HR, reports.

## Quick Start

```bash
npm install
npm run migration:run   # Create DB tables
npm run start:dev       # http://localhost:3001
```

A fully compatible frontend boilerplate: <https://github.com/brocoders/extensive-react-boilerplate>

Belongs to the [bc boilerplates](https://bcboilerplates.com/) ecosystem

<https://github.com/user-attachments/assets/a66f114a-c714-4036-8eeb-20cbf04ae985>

## Table of Contents <!-- omit in toc -->

- [Features](#features)
- [Contributors](#contributors)
- [Support](#support)

## Features

- [x] Database. Support [TypeORM](https://www.npmjs.com/package/typeorm) and [Mongoose](https://www.npmjs.com/package/mongoose).
- [x] Seeding.
- [x] Config Service ([@nestjs/config](https://www.npmjs.com/package/@nestjs/config)).
- [x] Mailing ([nodemailer](https://www.npmjs.com/package/nodemailer)).
- [x] Sign in and sign up via email.
- [x] Social sign in (Apple, Facebook, Google).
- [x] Admin and User roles.
- [x] Internationalization/Translations (I18N) ([nestjs-i18n](https://www.npmjs.com/package/nestjs-i18n)).
- [x] File uploads. Support local and Amazon S3 drivers.
- [x] Swagger.
- [x] E2E and units tests.
- [x] Docker.
- [x] CI (Github Actions).

## Contributors

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/Shchepotin"><img src="https://avatars.githubusercontent.com/u/6001723?v=4?s=100" width="100px;" alt="Vladyslav Shchepotin"/><br /><sub><b>Vladyslav Shchepotin</b></sub></a><br /><a href="#maintenance-Shchepotin" title="Maintenance">🚧</a> <a href="#doc-Shchepotin" title="Documentation">📖</a> <a href="#code-Shchepotin" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/SergeiLomako"><img src="https://avatars.githubusercontent.com/u/31205374?v=4?s=100" width="100px;" alt="SergeiLomako"/><br /><sub><b>SergeiLomako</b></sub></a><br /><a href="#code-SergeiLomako" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ElenVlass"><img src="https://avatars.githubusercontent.com/u/72293912?v=4?s=100" width="100px;" alt="Elena Vlasenko"/><br /><sub><b>Elena Vlasenko</b></sub></a><br /><a href="#doc-ElenVlass" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://brocoders.com"><img src="https://avatars.githubusercontent.com/u/226194?v=4?s=100" width="100px;" alt="Rodion"/><br /><sub><b>Rodion</b></sub></a><br /><a href="#business-sars" title="Business development">💼</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

## Support

If you seek consulting, support, or wish to collaborate, please contact us via [boilerplates@brocoders.com](mailto:boilerplates@brocoders.com). For any inquiries regarding boilerplates, feel free to ask on [GitHub Discussions](https://github.com/brocoders/nestjs-boilerplate/discussions) or [Discord](https://discord.com/channels/520622812742811698/1197293125434093701).

---

## 📁 دليل ملفات الواجهة الخلفية (Backend File Guide)

هذا الدليل يشرح أهم الملفات الموجودة في مجلد السيرفر (Backend):

### ⚙️ ملفات الإعدادات (Configuration)

1. **`.env`**
   - **ما هو؟** ملف يحتوي على "الأسرار" وإعدادات الربط.
   - **لماذا؟** لفصل بيانات قاعدة البيانات والباسووردات عن كود البرنامج (للأمان).
   - **استخدامه:** يتم فيه كتابة باسوورد قاعدة البيانات واسمها.
   - **كيف يعمل؟** يقرأه البرنامج عند البدء ليعرف كيف يتصل بقاعدة البيانات.

2. **`package.json`**
   - **ما هو؟** قائمة المحتويات والمكتبات.
   - **لماذا؟** ليعرف النظام ما هي الأدوات البرمجية التي يحتاجها ليعمل.
   - **كيف يعمل؟** عند تشغيل `npm install` يقوم بتحميل كل ما هو مكتوب في هذا الملف.

3. **`nest-cli.json` & `tsconfig.json`**
   - **ما هي؟** ملفات تقنية خاصة بلغة البرمجة (TypeScript) وإطار العمل (NestJS).
   - **لماذا؟** لتنظيم عملية تحويل الكود البرمجي من لغة التطوير إلى لغة التشغيل.

4. **`docker-compose.yaml` & `Dockerfile`**
   - **ما هي؟** ملفات "الحاويات" (Docker).
   - **لماذا؟** لتشغيل السيرفر في بيئة معزولة تضمن عمله بنفس الطريقة على أي جهاز.

### 📂 المجلدات الأساسية (Main Folders)

- **`src/`**: المجلد الأهم، ويحتوي على الكود البرمجي الفعلي للنظام (المخازن، الحسابات، إلخ).
- **`docs/`**: يحتوي على ملفات الشرح التقني للمبرمجين.
- **`test/`**: يحتوي على اختبارات آلية للتأكد من أن النظام يعمل بدون أخطاء.
- **`uploads/`**: المكان الذي تُحفظ فيه الملفات أو الصور التي يتم رفعها على النظام.

### 📝 ملفات السجلات (Logs)

- **`backend.log`**: سجل العمليات اليومية للسيرفر.
- **`backend_stdout.log`**: يسجل المخرجات العادية للنظام.
- **`backend_stderr.log`**: يسجل الأخطاء (Errors) التي تحدث في السيرفر للمساعدة في حلها.
