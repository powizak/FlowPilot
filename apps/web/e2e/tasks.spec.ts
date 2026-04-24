import { test, expect } from '@playwright/test';

const TASK_NAME = 'E2E Test Task';
const SUBTASK_NAME = 'E2E Subtask';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('create a task from the project picker flow', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /new task|nový úkol/i }).click();
    await page.getByLabel(/project|projekt/i).selectOption({ index: 1 });
    await page.getByRole('button', { name: /continue|pokračovat/i }).click();
    await page.getByLabel(/title|název/i).fill(TASK_NAME);
    await page
      .getByRole('button', { name: /create task|vytvořit úkol/i })
      .click();
    await expect(page.getByText(TASK_NAME)).toBeVisible();
  });

  test('edit a task and add a subtask from the detail panel', async ({
    page,
  }) => {
    await page.goto('/tasks');
    await page
      .getByRole('button', { name: /edit|upravit/i })
      .first()
      .click();

    const panel = page.locator('.fixed.inset-y-0.right-0').first();
    await expect(panel).toBeVisible();

    await panel.getByPlaceholder(/task title|název úkolu/i).fill(TASK_NAME);
    await panel
      .getByPlaceholder(/add a subtask|přidat podúkol/i)
      .fill(SUBTASK_NAME);
    await panel.getByRole('button', { name: /^add$|^přidat$/i }).click();

    await expect(panel.getByText(SUBTASK_NAME)).toBeVisible();
  });

  test('filter tasks by status with the current list controls', async ({
    page,
  }) => {
    await page.goto('/tasks');

    const statusSelect = page.locator('select').first();
    await statusSelect.selectOption('done');

    await expect(statusSelect).toHaveValue('done');
  });
});
