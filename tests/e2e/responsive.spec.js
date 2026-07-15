import { test, expect } from '@playwright/test';

test.describe('Responsive & Mobile Layout Checks', () => {

  test('should hide table header, wrap notes and stack admin buttons on mobile view', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // 1. Log in as admin
    await page.goto('/login.php');
    await page.fill('#username', 'admin_test');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // 2. Verify table thead is not visible/hidden on mobile
    const tableHeader = page.locator('#upcoming-table thead');
    await expect(tableHeader).not.toBeVisible();

    // 3. Verify .cell-notes has wrap styles (e.g. not white-space: nowrap)
    await page.click('#add-appointment-btn');
    await page.fill('#title', 'Responsive Layout Test');
    await page.fill('#notes', 'Very long notes text that should wrap on mobile screens without creating a horizontal scrollbar.');
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-08-25');
    });
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    const notesCell = page.locator('#upcoming-tbody tr', { hasText: 'Responsive Layout Test' }).locator('.cell-notes');
    await expect(notesCell).toBeVisible();

    // Check computed style of cell-notes has white-space: pre-wrap
    const whiteSpace = await notesCell.evaluate((el) => window.getComputedStyle(el).whiteSpace);
    expect(whiteSpace).toBe('pre-wrap');

    // 4. Navigate to admin page and verify buttons stack on mobile
    await page.click('#hamburger-btn');
    await page.click('#nav-admin');
    await expect(page.locator('#admin-view')).not.toHaveClass(/hidden/);

    // Get actions flex container for other user (user_a)
    const userRow = page.locator('#users-tbody tr', { hasText: 'user_a' });
    await expect(userRow).toBeVisible();
    const flexContainer = userRow.locator('.actions-flex-container');
    await expect(flexContainer).toBeVisible();

    // Check that buttons stack vertically (top of button 2 is below bottom of button 1)
    const buttons = flexContainer.locator('.btn');
    await expect(buttons).toHaveCount(3);
    const btn1 = buttons.nth(0);
    const btn2 = buttons.nth(1);
    const btn3 = buttons.nth(2);

    const rect1 = await btn1.boundingBox();
    const rect2 = await btn2.boundingBox();
    const rect3 = await btn3.boundingBox();

    expect(rect1).not.toBeNull();
    expect(rect2).not.toBeNull();
    expect(rect3).not.toBeNull();
    if (rect1 && rect2 && rect3) {
      expect(rect2.y).toBeGreaterThanOrEqual(rect1.y + rect1.height);
      expect(rect3.y).toBeGreaterThanOrEqual(rect2.y + rect2.height);
    }

    // Clean up appointment
    await page.click('#hamburger-btn');
    await page.click('#nav-calendar');
    const rowToDelete = page.locator('#upcoming-tbody tr', { hasText: 'Responsive Layout Test' });
    await rowToDelete.click();
    await page.click('#delete-btn');
    await page.click('#confirm-delete-btn');
  });
});
