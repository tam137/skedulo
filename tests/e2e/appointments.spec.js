import { test, expect } from '@playwright/test';

test.describe('Calendar & Appointments', () => {

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
    page.on('pageerror', err => console.error('PAGE ERROR:', err.message));

    // Log in as standard user a
    await page.goto('/login.php');
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');
  });

  test('should create, read, update, and delete an appointment', async ({ page }) => {
    // 1. Create Appointment
    await page.click('#add-appointment-btn');
    await expect(page.locator('#appointment-modal')).toHaveClass(/active/);

    await page.fill('#title', 'Projekt-Meeting');
    await page.fill('#location', 'Konferenzraum A');
    await page.fill('#notes', 'Besprechung der nächsten Meilensteine.');
    
    // Pick date using flatpickr setDate (since calendar is not a simple native input anymore)
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-08-25');
    });

    // Select emoji
    await page.click('.emoji-btn[data-emoji="💻"]');

    // Save
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    // Verify in upcoming table
    const upcomingRow = page.locator('#upcoming-tbody tr', { hasText: 'Projekt-Meeting' });
    await expect(upcomingRow).toBeVisible();
    await expect(upcomingRow.locator('.cell-title')).toContainText('💻 Projekt-Meeting');
    await expect(upcomingRow.locator('td:nth-child(3)')).toContainText('Konferenzraum A');

    // 2. Update Appointment
    await upcomingRow.click();
    await expect(page.locator('#appointment-modal')).toHaveClass(/active/);
    await expect(page.locator('#title')).toHaveValue('Projekt-Meeting');

    // Edit details
    await page.fill('#location', 'Home Office');
    await page.fill('#notes', 'Remote Besprechung.');
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    // Verify update
    const updatedRow = page.locator('#upcoming-tbody tr', { hasText: 'Projekt-Meeting' });
    await expect(updatedRow.locator('td:nth-child(3)')).toContainText('Home Office');
    await expect(updatedRow.locator('td:nth-child(4)')).toContainText('Remote Besprechung.');

    // 3. Delete Appointment
    await updatedRow.click();
    await page.click('#delete-btn');
    
    // Verify custom confirm overlay opens
    await expect(page.locator('#confirm-overlay')).toHaveClass(/active/);
    await page.click('#confirm-delete-btn');

    // Verify it is gone
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Projekt-Meeting' })).not.toBeVisible();
  });

  test('should filter appointments by emoji', async ({ page }) => {
    // Create first appointment with emoji 🌴
    await page.click('#add-appointment-btn');
    await page.fill('#title', 'Sommerurlaub');
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-08-10');
    });
    await page.click('#emoji-picker button[data-emoji="🌴"]');
    await page.click('#save-btn');

    // Create second appointment with emoji 💻
    await page.click('#add-appointment-btn');
    await page.fill('#title', 'Codingsession');
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-08-11');
    });
    await page.click('#emoji-picker button[data-emoji="💻"]');
    await page.click('#save-btn');

    // Check both are visible
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Sommerurlaub' })).toBeVisible();
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Codingsession' })).toBeVisible();

    // Filter for 🌴
    await page.click('#filter-emoji-bar button[data-emoji="🌴"]');

    // Sommerurlaub should be visible, Codingsession should be hidden
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Sommerurlaub' })).toBeVisible();
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Codingsession' })).not.toBeVisible();

    // Reset filter by clicking 🌴 again
    await page.click('#filter-emoji-bar button[data-emoji="🌴"]');

    // Both should be visible again
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Sommerurlaub' })).toBeVisible();
    await expect(page.locator('#upcoming-tbody tr', { hasText: 'Codingsession' })).toBeVisible();
  });
});
