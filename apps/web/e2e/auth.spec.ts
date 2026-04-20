import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('register new account', async ({ page }) => {
    await page.goto('/register');
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(`test-${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('SecurePass123!');
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('login with valid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
  });

  test('login rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page.getByText(/invalid|error|incorrect/i)).toBeVisible();
  });

  test('logout redirects to login', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
    await page.getByRole('button', { name: /logout|sign out/i }).click();
    await expect(page).toHaveURL('/login');
  });

  test('unauthorized access redirects to login', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('token refresh keeps session alive', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@flowpilot.test');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    await expect(page).toHaveURL('/');
    await page.reload();
    await expect(page).toHaveURL('/');
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });
});
