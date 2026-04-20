import { test, expect } from '@playwright/test';

test.describe('Invoices', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('create blank invoice', async ({ page }) => {
    await page.goto('/invoices/new');
    await page.getByLabel(/client/i).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /add line|add item/i }).click();
    await page
      .getByLabel(/description/i)
      .first()
      .fill('E2E line item');
    await page
      .getByLabel(/amount|price/i)
      .first()
      .fill('1000');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/invoices\/\w+/);
  });

  test('create invoice from time entries', async ({ page }) => {
    await page.goto('/invoices/new');
    await page
      .getByRole('button', { name: /from time|import entries/i })
      .click();
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: /import|add/i }).click();
    await page.getByLabel(/client/i).click();
    await page.getByRole('option').first().click();
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page).toHaveURL(/\/invoices\/\w+/);
  });

  test('download invoice PDF', async ({ page }) => {
    await page.goto('/invoices');
    await page.getByRole('link', { name: /INV-/i }).first().click();
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: /pdf|download/i }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/);
  });

  test('send invoice via email', async ({ page }) => {
    await page.goto('/invoices');
    await page.getByRole('link', { name: /INV-/i }).first().click();
    await page.getByRole('button', { name: /send/i }).click();
    await page.getByLabel('Email').fill('client@e2e.test');
    await page.getByRole('button', { name: /send|confirm/i }).click();
    await expect(page.getByText(/sent/i)).toBeVisible();
  });

  test('mark invoice as paid', async ({ page }) => {
    await page.goto('/invoices');
    await page.getByRole('link', { name: /INV-/i }).first().click();
    await page.getByRole('button', { name: /mark.*paid|pay/i }).click();
    await expect(page.getByText(/paid/i)).toBeVisible();
  });
});
