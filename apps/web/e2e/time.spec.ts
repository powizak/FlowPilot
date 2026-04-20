import { test, expect } from '@playwright/test';

test.describe('Time Tracking', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('start and stop timer', async ({ page }) => {
    await page.goto('/time');
    await page.getByRole('button', { name: /start/i }).click();
    await expect(page.getByText(/0:0[0-9]:\d{2}/)).toBeVisible({
      timeout: 5000,
    });
    await page.getByRole('button', { name: /stop/i }).click();
    await expect(page.getByText(/saved|entry/i)).toBeVisible();
  });

  test('create manual time entry', async ({ page }) => {
    await page.goto('/time');
    await page.getByRole('button', { name: /manual|add entry/i }).click();
    await page.getByLabel(/description/i).fill('Manual E2E entry');
    await page.getByLabel(/hours|duration/i).fill('2');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Manual E2E entry')).toBeVisible();
  });

  test('view time reports', async ({ page }) => {
    await page.goto('/reports');
    await expect(page.getByText(/report|summary/i)).toBeVisible();
    await expect(
      page.locator('canvas, svg, [data-testid="chart"]'),
    ).toBeVisible();
  });

  test('timer persists across navigation', async ({ page }) => {
    await page.goto('/time');
    await page.getByRole('button', { name: /start/i }).click();
    await page.goto('/projects');
    await page.goto('/time');
    await expect(page.getByRole('button', { name: /stop/i })).toBeVisible();
  });
});
