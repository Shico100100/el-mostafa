import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/?$/, { timeout: 15000 });
  });

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.locator('text=المبيعات').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to inventory via sidebar', async ({ page }) => {
    await page.locator('nav').getByRole('button', { name: 'المخزون', exact: true }).click();
    await page.locator('nav').getByRole('button', { name: 'لوحة المخزون' }).click();
    await expect(page).toHaveURL(/inventory2/, { timeout: 15000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});
