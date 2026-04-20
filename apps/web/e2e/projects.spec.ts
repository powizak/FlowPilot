import { test, expect } from '@playwright/test';

test.describe('Projects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('create a new project', async ({ page }) => {
    await page.goto('/projects');
    await page.getByRole('button', { name: /new project|create/i }).click();
    await page.getByLabel('Name').fill('E2E Test Project');
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText('E2E Test Project')).toBeVisible();
  });

  test('view project detail', async ({ page }) => {
    await page.goto('/projects');
    await page.getByText('E2E Test Project').click();
    await expect(page).toHaveURL(/\/projects\/\w+/);
  });

  test('clone a project', async ({ page }) => {
    await page.goto('/projects');
    await page.getByText('E2E Test Project').click();
    await page.getByRole('button', { name: /clone|duplicate/i }).click();
    await expect(page.getByText(/copy|clone/i)).toBeVisible();
  });

  test('archive a project', async ({ page }) => {
    await page.goto('/projects');
    await page.getByText('E2E Test Project').click();
    await page.getByRole('button', { name: /archive/i }).click();
    await page.getByRole('button', { name: /confirm/i }).click();
    await expect(page.getByText(/archived/i)).toBeVisible();
  });

  test('manage project members', async ({ page }) => {
    await page.goto('/projects');
    await page.getByText('E2E Test Project').first().click();
    await page.getByRole('tab', { name: /members/i }).click();
    await expect(page.getByText(/member/i)).toBeVisible();
  });

  test('project dashboard shows stats', async ({ page }) => {
    await page.goto('/projects');
    await page.getByText('E2E Test Project').first().click();
    await page.getByRole('tab', { name: /dashboard|overview/i }).click();
    await expect(page.locator('[data-testid="project-stats"]')).toBeVisible();
  });
});
