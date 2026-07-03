# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard >> should navigate to inventory
- Location: e2e\dashboard.spec.ts:16:7

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation to "/dashboard" until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - region "Notifications alt+T"
  - generic [ref=e3]:
    - generic [ref=e4]:
      - heading "ELMostafa" [level=1] [ref=e5]
      - paragraph [ref=e6]: نظام إدارة المصنع
    - generic [ref=e7]:
      - generic [ref=e8]:
        - generic [ref=e9]: البريد الإلكتروني
        - textbox "البريد الإلكتروني" [ref=e10]:
          - /placeholder: أدخل بريدك الإلكتروني
      - generic [ref=e11]:
        - generic [ref=e12]: كلمة المرور
        - textbox "كلمة المرور" [ref=e13]:
          - /placeholder: أدخل كلمة المرور
      - generic [ref=e14]: الرجاء إدخال البريد الإلكتروني
      - button "تسجيل الدخول" [active] [ref=e15]
    - paragraph [ref=e17]: أدخل بريدك الإلكتروني وكلمة المرور.
  - button [ref=e18]:
    - img [ref=e19]
  - button "Open Next.js Dev Tools" [ref=e26] [cursor=pointer]:
    - img [ref=e27]
  - alert [ref=e30]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     await page.goto('/login');
  6  |     await page.fill('input[type="email"]', 'admin@admin.com');
  7  |     await page.fill('input[type="password"]', 'admin123');
  8  |     await page.click('button[type="submit"]');
> 9  |     await page.waitForURL('/dashboard', { timeout: 10000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  10 |   });
  11 | 
  12 |   test('should display dashboard stats', async ({ page }) => {
  13 |     await expect(page.locator('text=المبيعات').first()).toBeVisible({ timeout: 10000 });
  14 |   });
  15 | 
  16 |   test('should navigate to inventory', async ({ page }) => {
  17 |     await page.click('button:has-text("المخزون")');
  18 |     await page.click('button:has-text("لوحة المخزون")');
  19 |     await expect(page).toHaveURL(/inventory2/);
  20 |   });
  21 | });
  22 | 
```