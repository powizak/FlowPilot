import { test, expect } from '@playwright/test';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('general settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByText(/general|settings/i)).toBeVisible();
  });

  test('update organization name', async ({ page }) => {
    await page.goto('/settings');
    await page.getByLabel(/organization|company/i).fill('E2E Corp');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/saved|updated/i)).toBeVisible();
  });

  test('navigate settings sections', async ({ page }) => {
    await page.goto('/settings');
    const sections = [
      'general',
      'users',
      'billing',
      'ai',
      'webhooks',
      'calendar',
    ];
    for (const section of sections) {
      await page.getByRole('tab', { name: new RegExp(section, 'i') }).click();
      await expect(page.getByText(new RegExp(section, 'i'))).toBeVisible();
    }
  });

  test('manage users', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('tab', { name: /users/i }).click();
    await expect(page.getByText(/admin@flowpilot\.test/i)).toBeVisible();
  });

  test('configure webhooks', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('tab', { name: /webhooks/i }).click();
    await page.getByRole('button', { name: /add webhook/i }).click();
    await page.getByLabel('URL').fill('https://example.com/hook');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('example.com/hook')).toBeVisible();
  });

  test('AI settings toggle', async ({ page }) => {
    await page.goto('/settings');
    await page.getByRole('tab', { name: /ai/i }).click();
    const toggle = page.getByRole('switch', { name: /enable ai/i });
    await toggle.click();
    await expect(toggle).toBeChecked();
  });
});
