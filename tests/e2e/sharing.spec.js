import { test, expect } from '@playwright/test';

test.describe('Sharing & Permissions', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));
  });

  test('should share appointment and restrict non-creator deletion/sharing controls', async ({ page }) => {
    // 1. Log in as user_a (Creator)
    await page.goto('/login.php');
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Create a new shared appointment
    await page.click('#add-appointment-btn');
    await page.fill('#title', 'Gemeinsames Grillfest');
    await page.fill('#location', 'Park');
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-09-02');
    });

    // Share with user_b
    await page.click('#appointment-sharing-select .multiselect-trigger');
    // Click on user_b option
    const userBOption = page.locator('#appointment-sharing-select .multiselect-option', { hasText: 'user_b' });
    await userBOption.click();
    // Close dropdown
    await page.click('#appointment-sharing-select .multiselect-trigger');

    // Save appointment
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    // Log out user_a
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('.logout-btn');
    await expect(page).toHaveURL(/.*login\.php.*/);

    // 2. Log in as user_b (Shared user)
    await page.fill('#username', 'user_b');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Verify appointment is visible
    const sharedRow = page.locator('#upcoming-tbody tr', { hasText: 'Gemeinsames Grillfest' });
    await expect(sharedRow).toBeVisible();

    // Open edit modal
    await sharedRow.click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/active/);

    // Verify location is correct
    await expect(page.locator('#location')).toHaveValue('Park');

    // Update details (should be allowed)
    await page.fill('#location', 'Garten von user_b');
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    // Verify changes are visible in upcoming list
    await expect(sharedRow.locator('td:nth-child(3)')).toContainText('Garten von user_b');

    // Reopen modal to verify read-only restrictions
    await sharedRow.click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/active/);

    // Deletion button should be hidden for non-creators
    await expect(page.locator('#delete-btn')).toHaveClass(/hidden/);

    // Sharing selector should be disabled
    await expect(page.locator('#appointment-sharing-select')).toHaveClass(/disabled/);

    // Close modal
    await page.click('#cancel-modal-btn');
  });
});
