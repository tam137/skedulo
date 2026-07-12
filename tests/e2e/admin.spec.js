import { test, expect } from '@playwright/test';

test.describe('Admin Operations & Password Change', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  });

  test('should restrict admin access to admin role and verify API protection', async ({ page }) => {
    // 1. Log in as user_a (non-admin)
    await page.goto('/login.php');
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Sidebar should NOT show Admin navigation link
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await expect(page.locator('#nav-admin')).not.toBeVisible();

    // Check direct API access
    const response = await page.context().request.get('/admin_api.php?action=list_users');
    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toContain('verweigert');
  });

  test('should allow admin to list, create and deactivate a user', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/login.php');
    await page.fill('#username', 'admin_test');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Navigate to admin area
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('#nav-admin');
    await expect(page.locator('#admin-view')).not.toHaveClass(/hidden/);

    // Create a new user
    await page.click('#add-user-btn');
    await expect(page.locator('#add-user-modal')).toHaveClass(/active/);

    const testUsername = `user_${Date.now()}`;
    await page.fill('#new-username', testUsername);
    await page.selectOption('#new-role', 'user');
    await page.click('#save-add-user-btn');
    await expect(page.locator('#add-user-modal')).not.toHaveClass(/active/);

    // Verify user in the table
    const userRow = page.locator('#users-tbody tr', { hasText: testUsername });
    await expect(userRow).toBeVisible();
    await expect(userRow.locator('td:nth-child(2)')).toContainText('user');
    await expect(userRow.locator('td:nth-child(3)')).toContainText('Aktiv');

    // Deactivate user
    await userRow.locator('.action-btn-toggle-status').click();
    await expect(page.locator('#confirm-overlay')).toHaveClass(/active/);
    await page.click('#confirm-delete-btn'); //confirm-delete-btn is used for all admin confirmations
    
    // Status should be deactivated
    await expect(userRow.locator('td:nth-child(3)')).toContainText('Deaktiviert');
  });

  test('should enforce password change requirements and support password updates', async ({ page }) => {
    // 1. Create a temporary user via Admin
    await page.goto('/login.php');
    await page.fill('#username', 'admin_test');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('#nav-admin');
    await page.click('#add-user-btn');
    const pwdUsername = `pwdu_${Date.now()}`;
    await page.fill('#new-username', pwdUsername);
    await page.click('#save-add-user-btn');
    
    // Log out admin
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('.logout-btn');
    await expect(page).toHaveURL(/.*login\.php.*/);

    // 2. Log in as new user with default password (Start123!)
    await page.fill('#username', pwdUsername);
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Go to change password modal
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('#change-pwd-btn');
    await expect(page.locator('#change-password-modal')).toHaveClass(/active/);

    // Form save button should be disabled initially
    const saveBtn = page.locator('#save-pwd-btn');
    await expect(saveBtn).toBeDisabled();

    // Fill current password
    await page.fill('#current-password', 'Start123!');

    // Fill weak new password (fails length requirement)
    await page.fill('#new-password', 'Short12');
    await page.fill('#confirm-password', 'Short12');
    await expect(saveBtn).toBeDisabled();

    // Fill strong password but mismatching confirmation
    await page.fill('#new-password', 'SecurePass123!');
    await page.fill('#confirm-password', 'SecurePass456!');
    await expect(saveBtn).toBeDisabled();

    // Fill strong matching password
    await page.fill('#new-password', 'SecurePass123!');
    await page.fill('#confirm-password', 'SecurePass123!');
    await expect(saveBtn).toBeEnabled();

    // Submit password change
    await page.click('#save-pwd-btn');
    
    // Wait for auto-logout redirect (2000ms delay in dashboard.php/api.js)
    await expect(page).toHaveURL(/.*login\.php.*/, { timeout: 5000 });
    
    // Log in with new password
    await page.fill('#username', pwdUsername);
    await page.fill('#password', 'SecurePass123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');
  });
});
