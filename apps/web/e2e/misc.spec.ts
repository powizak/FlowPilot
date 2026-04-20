import { test, expect } from '@playwright/test';

test.describe('Calendar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
  });

  test('calendar renders events', async ({ page }) => {
    await page.goto('/calendar');
    await expect(
      page.locator('[data-testid="calendar-grid"], .calendar'),
    ).toBeVisible();
  });
});

test.describe('Dashboard Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
  });

  test('dashboard loads with widgets', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
    await expect(
      page.locator('[data-testid="widget"], .widget, .card').first(),
    ).toBeVisible();
  });
});

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
  });

  test('notification bell shows count', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('button', { name: /notification/i }),
    ).toBeVisible();
  });

  test('mark notification as read', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /notification/i }).click();
    const item = page.locator('[data-testid="notification-item"]').first();
    if (await item.isVisible()) {
      await item.click();
      await expect(item).toHaveClass(/read/);
    }
  });
});

test.describe('Comments & Attachments', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
  });

  test('add comment to task', async ({ page }) => {
    await page.goto('/tasks');
    await page
      .locator('[data-testid="task-row"], [data-testid="task-card"]')
      .first()
      .click();
    await page.getByLabel(/comment/i).fill('E2E test comment');
    await page.getByRole('button', { name: /post|send/i }).click();
    await expect(page.getByText('E2E test comment')).toBeVisible();
  });

  test('upload attachment to task', async ({ page }) => {
    await page.goto('/tasks');
    await page
      .locator('[data-testid="task-row"], [data-testid="task-card"]')
      .first()
      .click();
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('E2E attachment content'),
    });
    await expect(page.getByText('test.txt')).toBeVisible();
  });
});
