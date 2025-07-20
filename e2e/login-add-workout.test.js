const { test, expect } = require('@playwright/test');

// Helper to get today's date in yyyy-mm-dd format
function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

test('Login and add a workout', async ({ page }) => {
  // Visit login page
  await page.goto('http://localhost:3000/auth');

  // Fill in login credentials
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"],button:has-text("Log in")');

  // Wait for redirect to dashboard (assume /dashboard or /)
  await page.waitForURL(/dashboard|\/$/);

  // Navigate to Fitness section (assume sidebar or nav link)
  await page.click('a:has-text("Fitness")');
  await page.waitForURL(/fitness/);

  // Click "Add Workout"
  await page.click('button:has-text("Add Workout"),a:has-text("Add Workout")');

  // Fill in the workout form
  await page.fill('input[placeholder*="title" i],input[name="title"]', 'Test Workout');
  await page.fill('input[type="date"]', today());

  // Submit the form
  await page.click('button[type="submit"],button:has-text("Save")');

  // Confirm success message or that the new workout appears in the log
  await expect(
    page.locator('text=Workout saved').or(page.locator('text=Test Workout'))
  ).toBeVisible({ timeout: 5000 });
}); 