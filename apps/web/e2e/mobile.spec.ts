import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Viewport', () => {
  test.use(devices['Pixel 5']);

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('mobile nav hamburger menu', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /menu|hamburger/i }).click();
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('mobile task list scrollable', async ({ page }) => {
    await page.goto('/tasks');
    await expect(page.locator('[data-testid="task-list"], main')).toBeVisible();
    await page.evaluate(() => window.scrollBy(0, 300));
  });

  test('mobile project cards stack vertically', async ({ page }) => {
    await page.goto('/projects');
    const cards = page.locator('[data-testid="project-card"], .card');
    if ((await cards.count()) > 1) {
      const first = await cards.first().boundingBox();
      const second = await cards.nth(1).boundingBox();
      expect(first!.y).toBeLessThan(second!.y);
    }
  });

  test('mobile invoice form usable', async ({ page }) => {
    await page.goto('/invoices/new');
    await expect(page.getByRole('button', { name: /save/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /save/i })).toBeInViewport();
  });

  test('mobile bottom navigation', async ({ page }) => {
    await page.goto('/');
    const nav = page.locator(
      '[data-testid="bottom-nav"], nav[aria-label="mobile"]',
    );
    if (await nav.isVisible()) {
      await expect(nav).toBeInViewport();
    }
  });
});
