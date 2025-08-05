/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';
import { 
  generateUniqueFoodName, 
  cleanupTestFoodItem, 
  cleanupTestDataBeforeTest,
  waitForDatabaseOperation 
} from './test-utils';

test('Complete pantry workflow with single item', async ({ page }) => {
  // Generate unique test data
  const foodName = generateUniqueFoodName('Organic Quinoa');
  const testId = `pantry_${Date.now()}`;
  
  // Capture browser console logs


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

  });

  // Clean up any leftover test data from previous runs
  await cleanupTestDataBeforeTest(page, testId);
  await waitForDatabaseOperation(page, 1000);

  // Click the "Food" link in the sidebar (case-sensitive match)
  await page.getByRole('link', { name: 'Food' }).click();
  await page.waitForURL((url) => /\/food(\/)?$/.test(url.pathname), { timeout: 10000 });

  // Click the "View Pantry" button from the food page to open the modal
  await page.getByRole('button', { name: 'View Pantry' }).click();
  
  // Wait for the pantry modal to appear
  await expect(page.getByRole('heading', { name: 'Your Pantry' })).toBeVisible();

  // Click the "Add Item" button
  await page.getByRole('button', { name: '+ Add Item' }).click();

  // Wait for the modal to appear
  await expect(page.getByRole('heading', { name: 'Add Pantry Item' })).toBeVisible();

  // Fill out the form with test values
  await page.getByLabel('Name').fill(foodName);
  await page.getByLabel('Quantity').fill('3');
  await page.getByLabel('Unit').fill('lbs');
  await page.getByLabel('Category').fill('Grains');
  
  // Set expiration date (30 days from now)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const formattedDate = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD format
  await page.getByLabel('Expiration').fill(formattedDate);

  // Submit the form
  await page.getByRole('button', { name: 'Add Item', exact: true }).click();

  // Wait for the modal to close and the page to update
  await expect(page.getByRole('heading', { name: 'Add Pantry Item' })).not.toBeVisible();

  // Wait for the new item to appear in the pantry list instead of networkidle
  await expect(page.getByText(foodName).first()).toBeVisible({ timeout: 15000 });

  // Additional verification: check that the item shows the correct details
  const itemRow = page.locator('li').filter({ hasText: foodName }).first();
  await expect(itemRow).toBeVisible();
  await expect(itemRow.getByText('Added from: manual')).toBeVisible();

  // 1. Reload the page and verify the item persists
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for the pantry modal to be visible again after reload
  await expect(page.getByRole('heading', { name: 'Your Pantry' })).toBeVisible({ timeout: 10000 });

  // Verify the added pantry item is still visible in the list (check name and quantity)
  await expect(page.getByText(foodName).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('3 lbs').first()).toBeVisible();

  // 2. Subtract 1 unit from that item and confirm the quantity decreases
  const updatedItemRow = page.locator('li').filter({ hasText: foodName }).first();
  
  // Find the subtract input field within this item row and fill it with "1"
  const subtractInput = updatedItemRow.locator('input[type="number"][placeholder="Amount"]');
  await subtractInput.fill('1');
  
  // Click the "Subtract" button within this item row
  const subtractButton = updatedItemRow.getByRole('button', { name: 'Subtract' });
  await subtractButton.click();
  
  // Wait for the quantity to update instead of networkidle
  await expect(page.getByText('2 lbs').first()).toBeVisible({ timeout: 15000 });
  
  // Verify the quantity decreased from 3 to 2
  await expect(page.getByText('2 lbs').first()).toBeVisible();

  // 3. Reload the page and verify the new quantity persists
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for the pantry modal to be visible again after reload
  await expect(page.getByRole('heading', { name: 'Your Pantry' })).toBeVisible({ timeout: 10000 });
  
  await expect(page.getByText(foodName).first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText('2 lbs').first()).toBeVisible();

  // 4. Delete the same item
  const finalItemRow = page.locator('li').filter({ hasText: foodName }).first();
  const deleteButton = finalItemRow.getByRole('button', { name: 'Delete' });
  await deleteButton.click();
  
  // Wait for the delete operation to complete and UI to update
  // Wait for the item to disappear from the UI
  await expect(page.getByText(foodName)).not.toBeVisible({ timeout: 10000 });
  await expect(page.getByText('2 lbs')).not.toBeVisible({ timeout: 10000 });

  // 5. Reload again and confirm it has been removed from the pantry list
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  
  // Verify the item is no longer visible after reload
  await expect(page.getByText(foodName)).not.toBeVisible();
  await expect(page.getByText('2 lbs')).not.toBeVisible();

  // Clean up test data
  await cleanupTestFoodItem(page, foodName);
  
  await waitForDatabaseOperation(page, 500);
}); 