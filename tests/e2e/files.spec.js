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
    await page.waitForTimeout(500);
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

  test('should associate a global file with an appointment and then unlink it', async ({ page }) => {
    // Navigate back to dashboard first to create an appointment
    await page.click('#hamburger-btn');
    await page.waitForTimeout(500);
    await page.click('#nav-calendar');
    await expect(page.locator('#calendar-view')).not.toHaveClass(/hidden/);

    // Create an appointment
    await page.click('#add-appointment-btn');
    await page.fill('#title', 'Linkable Event');
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-12-01');
    });
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    // Navigate to files tab
    await page.click('#hamburger-btn');
    await page.waitForTimeout(500);
    await page.click('#nav-files');
    await expect(page.locator('#files-view')).not.toHaveClass(/hidden/);

    // 1. Upload a global file
    await page.click('#upload-global-file-btn');
    const filePayload = {
      name: 'link_test_file.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Link test file content')
    };
    await page.setInputFiles('#global-upload-file-field', filePayload);
    await page.click('#save-upload-modal-btn');
    await expect(page.locator('#upload-file-modal')).not.toHaveClass(/active/);

    // Verify it is global (td:nth-child(2) should contain "-")
    const fileRow = page.locator('#files-tbody tr', { hasText: 'link_test_file.txt' });
    await expect(fileRow).toBeVisible();
    await expect(fileRow.locator('td:nth-child(2)')).toContainText('-');

    // 2. Open edit file modal
    await fileRow.click();
    await expect(page.locator('#edit-file-modal')).toHaveClass(/active/);

    // Associate it with "Linkable Event"
    await page.selectOption('#edit-appointment-field', { label: 'Linkable Event' });
    await page.click('#save-edit-modal-btn');
    await expect(page.locator('#edit-file-modal')).not.toHaveClass(/active/);

    // Verify the "Termin" column now contains "Linkable Event"
    await expect(fileRow.locator('td:nth-child(2)')).toContainText('Linkable Event');

    // 3. Open edit file modal again and unlink it
    await fileRow.click();
    await expect(page.locator('#edit-file-modal')).toHaveClass(/active/);

    // Unlink the file (select value "")
    await page.selectOption('#edit-appointment-field', { value: '' });
    await page.click('#save-edit-modal-btn');
    await expect(page.locator('#edit-file-modal')).not.toHaveClass(/active/);

    // Verify "Termin" column is back to "-"
    await expect(fileRow.locator('td:nth-child(2)')).toContainText('-');
  });

  test('should allow different users to upload files with the same name without overwriting each other', async ({ browser }) => {
    // 1. User A uploads "shared_name.txt" containing "Top Secret A"
    const contextA = await browser.newContext();
    const pageA = await contextA.newPage();
    await pageA.goto('/login.php');
    await pageA.fill('#username', 'user_a');
    await pageA.fill('#password', 'Start123!');
    await pageA.click('#btn-login');
    await pageA.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    await pageA.click('#hamburger-btn');
    await pageA.waitForTimeout(500);
    await pageA.click('#nav-files');
    await expect(pageA.locator('#files-view')).not.toHaveClass(/hidden/);

    await pageA.click('#upload-global-file-btn');
    await pageA.setInputFiles('#global-upload-file-field', {
      name: 'shared_name.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Top Secret A')
    });
    await pageA.click('#save-upload-modal-btn');
    await expect(pageA.locator('#upload-file-modal')).not.toHaveClass(/active/);

    const rowA = pageA.locator('#files-tbody tr', { hasText: 'shared_name.txt' });
    await expect(rowA).toBeVisible();
    const fileIdA = await rowA.getAttribute('data-id');

    // 2. User B uploads "shared_name.txt" containing "Top Secret B"
    const contextB = await browser.newContext();
    const pageB = await contextB.newPage();
    await pageB.goto('/login.php');
    await pageB.fill('#username', 'user_b');
    await pageB.fill('#password', 'Start123!');
    await pageB.click('#btn-login');
    await pageB.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    await pageB.click('#hamburger-btn');
    await pageB.waitForTimeout(500);
    await pageB.click('#nav-files');
    await expect(pageB.locator('#files-view')).not.toHaveClass(/hidden/);

    await pageB.click('#upload-global-file-btn');
    await pageB.setInputFiles('#global-upload-file-field', {
      name: 'shared_name.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Top Secret B')
    });
    await pageB.click('#save-upload-modal-btn');
    await expect(pageB.locator('#upload-file-modal')).not.toHaveClass(/active/);

    const rowB = pageB.locator('#files-tbody tr', { hasText: 'shared_name.txt' });
    await expect(rowB).toBeVisible();
    const fileIdB = await rowB.getAttribute('data-id');

    // 3. Verify download content for User B is "Top Secret B"
    const responseB = await contextB.request.get(`/files_api.php?action=download&id=${fileIdB}`);
    expect(responseB.status()).toBe(200);
    expect(await responseB.text()).toContain('Top Secret B');

    // 4. Verify download content for User A is "Top Secret A"
    const responseA = await contextA.request.get(`/files_api.php?action=download&id=${fileIdA}`);
    expect(responseA.status()).toBe(200);
    expect(await responseA.text()).toContain('Top Secret A');

    await contextA.close();
    await contextB.close();
  });
});
