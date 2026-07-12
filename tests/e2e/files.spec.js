import { test, expect } from '@playwright/test';

test.describe('File Manager & Uploads', () => {

  test.beforeEach(async ({ page }) => {
    // Log in as standard user a
    await page.goto('/login.php');
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Navigate to files tab
    await page.click('#hamburger-btn');
    await page.waitForTimeout(400);
    await page.click('#nav-files');
    await expect(page.locator('#files-view')).not.toHaveClass(/hidden/);
  });

  test('should upload, prevent duplicate, and delete a global file', async ({ page }) => {
    // 1. Upload a file
    await page.click('#upload-global-file-btn');
    await expect(page.locator('#upload-file-modal')).toHaveClass(/active/);

    // Prepare a mock text file
    const filePayload = {
      name: 'report_2026.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Annual financial report 2026')
    };

    await page.setInputFiles('#global-upload-file-field', filePayload);
    await page.click('#save-upload-modal-btn');
    await expect(page.locator('#upload-file-modal')).not.toHaveClass(/active/);

    // Verify file in the table
    const fileRow = page.locator('#files-tbody tr', { hasText: 'report_2026.txt' });
    await expect(fileRow).toBeVisible();
    await expect(fileRow.locator('td:nth-child(3)')).toContainText('28 B'); // "Annual financial report 2026" is 28 bytes

    // 2. Prevent duplicate filename upload
    await page.click('#upload-global-file-btn');
    await page.setInputFiles('#global-upload-file-field', filePayload);
    await page.click('#save-upload-modal-btn');

    // Error alert should be visible
    const errorAlert = page.locator('#upload-file-error-alert');
    await expect(errorAlert).toBeVisible();
    await expect(errorAlert).toContainText(/bereits/); // Expect word like "bereits" or "existiert"

    // Close modal
    await page.click('#close-upload-modal-btn');
    await expect(page.locator('#upload-file-modal')).not.toHaveClass(/active/);

    // 3. Delete file (handling native confirm dialog)
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('dauerhaft löschen');
      await dialog.accept();
    });

    await fileRow.locator('.action-btn-delete').click();
    await expect(fileRow).not.toBeVisible();
  });
});
