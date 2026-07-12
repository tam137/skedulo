import { test, expect } from '@playwright/test';

test.describe('Calendar Subscription (ICS Feed)', () => {

  test('should return 400 Bad Request when token is missing', async ({ request }) => {
    const response = await request.get('/calendar_feed.php');
    expect(response.status()).toBe(400);
    expect(await response.text()).toContain('Bad Request: Token missing');
  });

  test('should return 401 Unauthorized when token is invalid', async ({ request }) => {
    const response = await request.get('/calendar_feed.php?token=invalid_token');
    expect(response.status()).toBe(401);
    expect(await response.text()).toContain('Unauthorized: Invalid token');
  });

  test('should return valid iCalendar feed for a valid user token', async ({ page, request }) => {
    // 1. Log in as user_a to create an appointment
    await page.goto('/login.php');
    await page.fill('#username', 'user_a');
    await page.fill('#password', 'Start123!');
    await page.click('#btn-login');
    await expect(page).toHaveURL(/.*dashboard\.php/);
    await page.waitForSelector('#appointment-sharing-select .multiselect-trigger');

    // Create an appointment
    await page.click('#add-appointment-btn');
    await page.fill('#title', 'Feed Test Appointment');
    await page.fill('#location', 'Remote Room');
    await page.fill('#notes', 'Testing feed generation.');
    await page.evaluate(() => {
      document.getElementById('appointment_date')._flatpickr.setDate('2026-10-15');
    });
    await page.click('.emoji-btn[data-emoji="🌴"]');
    await page.click('#save-btn');
    await expect(page.locator('#appointment-modal')).not.toHaveClass(/active/);

    // 2. Fetch the ICS feed using user_a's ICS token (from setup-test-db.sql)
    const response = await request.get('/calendar_feed.php?token=ics_token_user_a_12345');
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('text/calendar');

    const icsText = await response.text();
    expect(icsText).toContain('BEGIN:VCALENDAR');
    expect(icsText).toContain('VERSION:2.0');
    expect(icsText).toContain('SUMMARY:🌴 Feed Test Appointment');
    expect(icsText).toContain('LOCATION:Remote Room');
    expect(icsText).toContain('DESCRIPTION:Testing feed generation.');
    expect(icsText).toContain('END:VEVENT');
    expect(icsText).toContain('END:VCALENDAR');
  });
});
