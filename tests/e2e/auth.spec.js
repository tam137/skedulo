import { test, expect } from '@playwright/test';

test.describe('Authentication & Session Management', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/login.php');
  });

  test('should display error message on invalid login credentials', async ({ page }) => {
    await page.fill('#username', 'non_existent_user');
    await page.fill('#password', 'wrong_password');
    await page.click('#btn-login');

    const alertError = page.locator('#alert-error');
    await expect(alertError).toBeVisible();
    await expect(alertError).toContainText('Ungültiger Benutzername oder Passwort.');
  });

  test('should log in successfully as a standard user A', async ({ page }) => {
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');

    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');
    
    await page.click('#hamburger-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#sidebar-drawer h2')).toContainText('Hallo, user_a!');
  });

  test('should log in successfully as admin', async ({ page }) => {
    await page.fill('#username', 'admin_test');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');

    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');
    
    await page.click('#hamburger-btn');
    await page.waitForTimeout(500);
    await expect(page.locator('#nav-admin')).toBeVisible();
  });

  test('should support remember me session preservation', async ({ page, context }) => {
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('.checkbox-container');
    await page.click('#btn-login');

    await expect(page).toHaveURL(/.*dashboard\.php/);

    const cookies = await context.cookies();
    const rememberMeCookie = cookies.find(c => c.name === 'remember_me');
    expect(rememberMeCookie).toBeDefined();

    await page.goto('/login.php');
    await expect(page).toHaveURL(/.*dashboard\.php/);
  });

  test('should log out successfully', async ({ page }) => {
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    await page.click('#hamburger-btn');
    await page.waitForTimeout(500);
    await page.click('.logout-btn');

    await expect(page).toHaveURL(/.*login\.php.*/);
    await expect(page.locator('#alert-success')).toContainText('Erfolgreich abgemeldet.');
  });
});
