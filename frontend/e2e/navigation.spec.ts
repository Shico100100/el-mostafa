import { test, expect } from '@playwright/test';

const PAGES: { path: string; label: string }[] = [
  { path: '/dashboard', label: 'لوحة التحكم' },
  { path: '/sales', label: 'المبيعات' },
  { path: '/purchases', label: 'المشتريات' },
  { path: '/inventory', label: 'المخزون' },
  { path: '/manufacturing', label: 'التصنيع' },
  { path: '/accounting', label: 'المحاسبة' },
  { path: '/reports', label: 'التقارير' },
  { path: '/notifications', label: 'الإشعارات' },
  { path: '/settings', label: 'الإعدادات' },
];

test.describe('Navigation coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/?$/, { timeout: 15000 });
  });

  for (const pageDef of PAGES) {
    test(`should load ${pageDef.path}`, async ({ page }) => {
      await page.goto(pageDef.path);
      await expect(page).toHaveURL(new RegExp(pageDef.path.replace('/', '\\/')), { timeout: 15000 });
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });
  }
});
