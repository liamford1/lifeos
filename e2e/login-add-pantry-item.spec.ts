/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';

test('Login and add a pantry item', async ({ page }) => {
  // Capture browser console logs
  page.on('console', msg => {
    console.log(`[BROWSER LOG] ${msg.type()}: ${msg.text()}`);
  });

  // Log 406 responses
  page.on('response', res => {
    if (res.status() === 406) console.log('406:', res.url());
  });

  // Go to /auth
  await page.goto('http://localhost:3000/auth');

  // Fill in login credentials
  await page.getByPlaceholder('Email').fill('test@example.com');
  await page.getByPlaceholder('Password').fill('password123');

  // Click the login button
  await page.getByRole('button', { name: /log in/i }).click();

  // Wait for dashboard to load by checking for visible text "Planner"
  await expect(page.locator('text=Planner')).toBeVisible({ timeout: 10000 });

  // ✅ Sanity check: window.supabase is defined
  await page.evaluate(() => {
    if (!window.supabase) throw new Error('[E2E] ❌ window.supabase is still not defined');
    console.log('[E2E] ✅ window.supabase is defined');
  });

  // Clean up any existing "Organic Quinoa" items from previous test runs
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    await supabase
      .from('food_items')
      .delete()
      .eq('user_id', userId)
      .eq('name', 'Organic Quinoa');
  });

  // Click the "Food" link in the sidebar (case-sensitive match)
  await page.getByRole('link', { name: 'Food' }).click();
  await page.waitForURL((url) => /\/food(\/)?$/.test(url.pathname), { timeout: 10000 });

  // Click the "View Pantry" link from the food sub-navigation
  await page.getByRole('link', { name: 'View Pantry' }).click();
  await page.waitForURL((url) => /\/food\/inventory$/.test(url.pathname), { timeout: 10000 });

  // Wait for the pantry page to load
  await expect(page.getByRole('heading', { name: 'Your Pantry' })).toBeVisible();

  // Click the "Add Item" button
  await page.getByRole('button', { name: '+ Add Item' }).click();

  // Wait for the modal to appear
  await expect(page.getByRole('heading', { name: 'Add Pantry Item' })).toBeVisible();

  // Fill out the form with realistic test values
  await page.getByLabel('Name').fill('Organic Quinoa');
  await page.getByLabel('Quantity').fill('2');
  await page.getByLabel('Unit').fill('lbs');
  await page.getByLabel('Category').fill('Grains');
  
  // Set expiration date (30 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const formattedDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  await page.getByLabel('Expiration').fill(formattedDate);

  // Submit the form (use exact match to get the submit button, not the modal opener)
  await page.getByRole('button', { name: 'Add Item', exact: true }).click();

  // Wait for the modal to close and the page to update
  await expect(page.getByRole('heading', { name: 'Add Pantry Item' })).not.toBeVisible();

  // Wait for the inventory to refresh
  await page.waitForLoadState('networkidle');

  // Verify that the new item appears in the pantry list
  // Use first() to handle potential duplicates from previous test runs
  await expect(page.getByText('Organic Quinoa').first()).toBeVisible();
  await expect(page.getByText('2 lbs').first()).toBeVisible();

  // Additional verification: check that the item shows the correct details
  const itemRow = page.locator('li').filter({ hasText: 'Organic Quinoa' }).first();
  await expect(itemRow).toBeVisible();
  await expect(itemRow.getByText('Added from: manual')).toBeVisible();
}); 