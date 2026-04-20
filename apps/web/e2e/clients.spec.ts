import { test, expect } from '@playwright/test';

test.describe('Clients', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('create client with ARES lookup', async ({ page }) => {
    await page.goto('/clients');
    await page.getByRole('button', { name: /new client|add/i }).click();
    await page.getByLabel(/ico|id number/i).fill('27074358');
    await page.getByRole('button', { name: /ares|lookup|fetch/i }).click();
    await expect(page.getByLabel('Name')).not.toHaveValue('');
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText(/27074358/)).toBeVisible();
  });

  test('create client manually', async ({ page }) => {
    await page.goto('/clients');
    await page.getByRole('button', { name: /new client|add/i }).click();
    await page.getByLabel('Name').fill('E2E Manual Client');
    await page.getByLabel('Email').fill('client@e2e.test');
    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText('E2E Manual Client')).toBeVisible();
  });

  test('view client detail and contacts', async ({ page }) => {
    await page.goto('/clients');
    await page.getByText('E2E Manual Client').click();
    await expect(page).toHaveURL(/\/clients\/\w+/);
    await page.getByRole('button', { name: /add contact/i }).click();
    await page.getByLabel('Name').fill('Contact Person');
    await page.getByLabel('Email').fill('contact@e2e.test');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Contact Person')).toBeVisible();
  });
});
