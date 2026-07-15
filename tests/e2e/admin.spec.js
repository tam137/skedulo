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

  test('should update last login timestamp when user logs in', async ({ browser }) => {
    // 1. Log in as user_b to update their last login time
    const contextUser = await browser.newContext();
    const pageUser = await contextUser.newPage();
    await pageUser.goto('/login.php');
    await pageUser.fill('#username', 'user_b');
    await pageUser.fill('#password', 'Start123!');
    await pageUser.click('#btn-login');
    await pageUser.waitForSelector('#appointment-sharing-select .multiselect-trigger');
    await contextUser.close();

    // 2. Log in as admin to verify the last login field
    const contextAdmin = await browser.newContext();
    const pageAdmin = await contextAdmin.newPage();
    await pageAdmin.goto('/login.php');
    await pageAdmin.fill('#username', 'admin_test');
    await pageAdmin.fill('#password', 'Start123!');
    await pageAdmin.click('#btn-login');
    await pageAdmin.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Go to admin view
    await pageAdmin.click('#hamburger-btn');
    await pageAdmin.waitForTimeout(400);
    await pageAdmin.click('#nav-admin');
    await expect(pageAdmin.locator('#admin-view')).not.toHaveClass(/hidden/);

    // Get the user row for user_b in users-tbody
    const userRow = pageAdmin.locator('#users-tbody tr', { hasText: 'user_b' });
    await expect(userRow).toBeVisible();

    // Verify the "Letzter Login" column (td:nth-child(4)) is not "-" and contains dynamic relative/date text
    const lastLoginCell = userRow.locator('td:nth-child(4)');
    await expect(lastLoginCell).not.toHaveText('-');
    const cellText = await lastLoginCell.innerText();
    expect(cellText.length).toBeGreaterThan(2);

    await contextAdmin.close();
  });

  test('should display user change history modal when clicking Verlauf', async ({ page }) => {
    // 1. Log in as admin
    await page.goto('/login.php');
    await page.fill('#username', 'admin_test');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Go to admin view
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('#nav-admin');
    await expect(page.locator('#admin-view')).not.toHaveClass(/hidden/);

    // Get the user row for admin_test in users-tbody
    const userRow = page.locator('#users-tbody tr', { hasText: 'admin_test' });
    await expect(userRow).toBeVisible();

    // Click the Verlauf button
    await userRow.locator('.action-btn-history').click();

    // Verify user history modal is open and active
    const historyModal = page.locator('#user-history-modal');
    await expect(historyModal).toHaveClass(/active/);

    // Verify modal title username is correct
    await expect(page.locator('#user-history-username')).toHaveText('admin_test');

    // Modal should load and show either "Keine Änderungen vorhanden." or list elements
    const modalContent = page.locator('#user-history-content');
    await expect(modalContent).toBeVisible();
    const text = await modalContent.innerText();
    expect(text.length).toBeGreaterThan(0);

    // Close the history modal
    await page.click('#close-user-history-modal-btn');
    await expect(historyModal).not.toHaveClass(/active/);
  });
});
