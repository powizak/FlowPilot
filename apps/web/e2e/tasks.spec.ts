import { test, expect } from '@playwright/test';

test.describe('Tasks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('create a task', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /new task|add/i }).click();
    await page.getByLabel('Title').fill('E2E Test Task');
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText('E2E Test Task')).toBeVisible();
  });

  test('add subtask', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByText('E2E Test Task').click();
    await page.getByRole('button', { name: /add subtask/i }).click();
    await page.getByLabel('Title').fill('E2E Subtask');
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText('E2E Subtask')).toBeVisible();
  });

  test('kanban drag reorders tasks', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('tab', { name: /kanban|board/i }).click();
    const card = page.locator('[data-testid="task-card"]').first();
    const target = page.locator('[data-testid="kanban-column"]').nth(1);
    await card.dragTo(target);
    await expect(target.locator('[data-testid="task-card"]')).toHaveCount(1, {
      timeout: 5000,
    });
  });

  test('list view inline edit', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('tab', { name: /list/i }).click();
    const row = page.getByText('E2E Test Task').first();
    await row.dblclick();
    await page.getByRole('textbox').first().fill('Updated Task');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Updated Task')).toBeVisible();
  });

  test('filter tasks by status', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByLabel(/status/i).selectOption('done');
    await page.getByRole('button', { name: /apply/i }).click();
    const tasks = page.locator(
      '[data-testid="task-row"], [data-testid="task-card"]',
    );
    for (const task of await tasks.all()) {
      await expect(task).toContainText(/done|complete/i);
    }
  });

  test('save and restore a view', async ({ page }) => {
    await page.goto('/tasks');
    await page.getByRole('button', { name: /filter/i }).click();
    await page.getByLabel(/status/i).selectOption('in_progress');
    await page.getByRole('button', { name: /save view/i }).click();
    await page.getByLabel('Name').fill('In Progress View');
    await page.getByRole('button', { name: /save/i }).click();
    await page.reload();
    await page.getByRole('button', { name: /saved views/i }).click();
    await page.getByText('In Progress View').click();
    await expect(page.getByText(/in.progress/i)).toBeVisible();
  });
});
