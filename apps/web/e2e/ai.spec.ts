import { test, expect } from '@playwright/test';

test.describe('AI Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('decompose task with AI', async ({ page }) => {
    await page.goto('/tasks');
    await page
      .getByText(/test task/i)
      .first()
      .click();
    await page.getByRole('button', { name: /decompose|ai split/i }).click();
    await expect(page.getByText(/generating|subtask/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test('AI meeting notes', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /meeting|notes/i }).click();
    await page
      .getByLabel(/notes|transcript/i)
      .fill('Discussed project timeline and deliverables.');
    await page.getByRole('button', { name: /process|extract/i }).click();
    await expect(page.getByText(/action|task/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test('AI chat panel', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /chat|ai|assistant/i }).click();
    await page.getByRole('textbox').fill('What tasks are overdue?');
    await page.keyboard.press('Enter');
    await expect(page.getByText(/overdue|task|no tasks/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
