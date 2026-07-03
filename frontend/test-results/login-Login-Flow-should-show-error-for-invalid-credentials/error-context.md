# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: login.spec.ts >> Login Flow >> should show error for invalid credentials
- Location: e2e\login.spec.ts:14:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=كلمة المرور غير صحيحة')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=كلمة المرور غير صحيحة')

```

```yaml
- region "Notifications alt+T"
- heading "ELMostafa" [level=1]
- paragraph: نظام إدارة المصنع
- text: البريد الإلكتروني
- textbox "البريد الإلكتروني":
  - /placeholder: أدخل بريدك الإلكتروني
- text: كلمة المرور
- textbox "كلمة المرور":
  - /placeholder: أدخل كلمة المرور
- text: الرجاء إدخال البريد الإلكتروني
- button "تسجيل الدخول"
- paragraph: أدخل بريدك الإلكتروني وكلمة المرور.
- button
- alert
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Login Flow', () => {
  4  |   test('should login successfully', async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.fill('input[type="email"]', 'admin@admin.com');
  7  |     await page.fill('input[type="password"]', 'admin123');
  8  |     await page.click('button[type="submit"]');
  9  | 
  10 |     await page.waitForURL('/dashboard', { timeout: 10000 });
  11 |     await expect(page).toHaveURL('/dashboard');
  12 |   });
  13 | 
  14 |   test('should show error for invalid credentials', async ({ page }) => {
  15 |     await page.goto('/login');
  16 |     await page.fill('input[type="email"]', 'wrong@email.com');
  17 |     await page.fill('input[type="password"]', 'wrongpass');
  18 |     await page.click('button[type="submit"]');
  19 | 
> 20 |     await expect(page.locator('text=كلمة المرور غير صحيحة')).toBeVisible({ timeout: 5000 });
     |                                                              ^ Error: expect(locator).toBeVisible() failed
  21 |   });
  22 | });
  23 | 
```