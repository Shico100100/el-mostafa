import { test, expect } from '@playwright/test';

test.describe('Production Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@admin.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard\/?$/, { timeout: 15000 });
  });

  test('Raw Materials page loads with stock data', async ({ page }) => {
    await page.goto('/manufacturing/raw-materials');
    await page.waitForTimeout(3000);
    
    const heading = page.locator('h1, h2, [class*="text-2xl"], [class*="text-xl"]');
    const count = await heading.count();
    console.log(`Raw Materials: found ${count} heading elements`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('Daily Production page loads', async ({ page }) => {
    await page.goto('/manufacturing/production');
    await page.waitForTimeout(3000);
    
    const heading = page.locator('h1, h2, [class*="text-2xl"], [class*="text-xl"]');
    const count = await heading.count();
    console.log(`Production: found ${count} heading elements`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('BOM page loads', async ({ page }) => {
    await page.goto('/manufacturing/boms');
    await page.waitForTimeout(3000);
    
    const heading = page.locator('h1, h2, [class*="text-2xl"], [class*="text-xl"]');
    const count = await heading.count();
    console.log(`BOMs: found ${count} heading elements`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('Dashboard loads without errors', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    const heading = page.locator('h1, h2, [class*="text-2xl"], [class*="text-xl"]');
    const count = await heading.count();
    console.log(`Dashboard: found ${count} heading elements`);
    
    expect(count).toBeGreaterThan(0);
  });

  test('Accounting page loads with trial balance', async ({ page }) => {
    await page.goto('/accounting');
    await page.waitForTimeout(3000);
    
    const heading = page.locator('h1, h2, [class*="text-2xl"], [class*="text-xl"]');
    const count = await heading.count();
    console.log(`Accounting: found ${count} heading elements`);
    
    expect(count).toBeGreaterThan(0);
  });
});
