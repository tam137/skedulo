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

  test('should enforce file sharing security boundaries for unauthorized users', async ({ browser }) => {
    // 1. Create User A session and upload a file
    const userAContext = await browser.newContext();
    const pageA = await userAContext.newPage();
    await pageA.goto('/login.php');
    await pageA.fill('#username', 'user_a');
    await pageA.fill('#password', 'Start123!');
    await pageA.click('#btn-login');
    await pageA.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Go to files, upload a file and share with user_b
    await pageA.click('#hamburger-btn');
    await pageA.click('#nav-files');

    await pageA.click('#upload-global-file-btn');
    await pageA.setInputFiles('#global-upload-file-field', {
      name: 'secret_a.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Top secret data A')
    });

    // Share with user_b
    await pageA.click('#file-sharing-select .multiselect-trigger');
    const optionUserB = pageA.locator('#file-sharing-select .multiselect-option', { hasText: 'user_b' });
    await optionUserB.click();
    await pageA.click('#file-sharing-select .multiselect-trigger');

    await pageA.click('#save-upload-modal-btn');
    await expect(pageA.locator('#upload-file-modal')).not.toHaveClass(/active/);

    // Get the file ID of the uploaded file
    const fileRow = pageA.locator('#files-tbody tr', { hasText: 'secret_a.txt' });
    await expect(fileRow).toBeVisible();
    const fileId = await fileRow.getAttribute('data-id');

    // 2. Create User B session and download file (should succeed)
    const userBContext = await browser.newContext();
    const pageB = await userBContext.newPage();
    await pageB.goto('/login.php');
    await pageB.fill('#username', 'user_b');
    await pageB.fill('#password', 'Start123!');
    await pageB.click('#btn-login');
    
    const responseB = await userBContext.request.get(`/files_api.php?action=download&id=${fileId}`);
    expect(responseB.status()).toBe(200);
    expect(await responseB.text()).toContain('Top secret data A');

    // 3. Create User C (admin_test) session and attempt download (should return 403 Forbidden)
    const userCContext = await browser.newContext();
    const pageC = await userCContext.newPage();
    await pageC.goto('/login.php');
    await pageC.fill('#username', 'admin_test');
    await pageC.fill('#password', 'Start123!');
    await pageC.click('#btn-login');

    const responseC = await userCContext.request.get(`/files_api.php?action=download&id=${fileId}`);
    expect(responseC.status()).toBe(403);
    
    // Clean up contexts
    await userAContext.close();
    await userBContext.close();
    await userCContext.close();
  });
});
