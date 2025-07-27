/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';

test('Complete receipt workflow with multiple items', async ({ page }) => {
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

  // --- Robust cleanup at the start ---
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    const maxIterations = 5;
    let cleanupIterations = 0;
    
    while (cleanupIterations < maxIterations) {
      // Delete test food items first (due to foreign key constraints)
      await supabase
        .from('food_items')
        .delete()
        .eq('user_id', userId)
        .in('name', ['Test Milk', 'Test Eggs', 'Test Bread']);
      
      // Delete test receipt items and receipts
      const { data: receipts } = await supabase
        .from('receipts')
        .select('id')
        .eq('user_id', userId)
        .eq('store_name', 'Test Grocery Store');
      
      if (receipts && receipts.length > 0) {
        const receiptIds = receipts.map((r: { id: string }) => r.id);
        await supabase
          .from('receipt_items')
          .delete()
          .in('receipt_id', receiptIds);
        
        await supabase
          .from('receipts')
          .delete()
          .in('id', receiptIds);
      }
      
      cleanupIterations++;
    }
  });

  // Navigate to the Add Receipt page
  await page.getByRole('link', { name: 'Food' }).click();
  await page.waitForURL((url) => /\/food(\/)?$/.test(url.pathname), { timeout: 10000 });

  // Click the "Add a Receipt" link
  await page.getByRole('link', { name: 'Add a Receipt' }).click();
  await page.waitForURL((url) => /\/food\/addreceipt$/.test(url.pathname), { timeout: 10000 });

  // Wait for the Add Receipt page to load
  await expect(page.getByRole('heading', { name: 'Add Receipt' })).toBeVisible();

  // Fill out the receipt form - Store name
  await page.getByPlaceholder('Store name (e.g. Safeway)').fill('Test Grocery Store');

  // Add first item: Milk
  await page.locator('input[placeholder="Item name"]').fill('Test Milk');
  await page.locator('input[placeholder="Qty"]').fill('2');
  await page.locator('input[placeholder="Unit"]').fill('gallons');
  await page.locator('input[placeholder="Price"]').fill('5.99');
  
  // Click "Add Item" button
  await page.getByRole('button', { name: '+ Add Item' }).click();

  // Verify the item appears in the list
  await expect(page.getByText('Test Milk — 2 gallons ($5.99)')).toBeVisible();

  // Add second item: Eggs
  await page.locator('input[placeholder="Item name"]').fill('Test Eggs');
  await page.locator('input[placeholder="Qty"]').fill('12');
  await page.locator('input[placeholder="Unit"]').fill('count');
  await page.locator('input[placeholder="Price"]').fill('3.49');
  
  // Click "Add Item" button
  await page.getByRole('button', { name: '+ Add Item' }).click();

  // Verify the second item appears in the list
  await expect(page.getByText('Test Eggs — 12 count ($3.49)')).toBeVisible();

  // Add third item: Bread
  await page.locator('input[placeholder="Item name"]').fill('Test Bread');
  await page.locator('input[placeholder="Qty"]').fill('1');
  await page.locator('input[placeholder="Unit"]').fill('loaf');
  await page.locator('input[placeholder="Price"]').fill('2.99');
  
  // Click "Add Item" button
  await page.getByRole('button', { name: '+ Add Item' }).click();

  // Verify the third item appears in the list
  await expect(page.getByText('Test Bread — 1 loaf ($2.99)')).toBeVisible();

  // Submit the receipt
  await page.getByRole('button', { name: 'Submit Receipt' }).click();

  // Wait for success message
  await expect(page.getByText('✅ Receipt and items saved!')).toBeVisible({ timeout: 10000 });

  // Wait for the form to reset
  await expect(page.getByPlaceholder('Store name (e.g. Safeway)')).toHaveValue('');

  // Reload the page to verify persistence
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Wait for the page to load again
  await expect(page.getByRole('heading', { name: 'Add Receipt' })).toBeVisible();

  // Verify that the new receipt appears in the "Past Receipts" section
  await expect(page.getByText('Past Receipts')).toBeVisible();
  await expect(page.getByText('Test Grocery Store')).toBeVisible();

  // Click to expand the receipt and view items
  const receiptButton = page.locator('button').filter({ hasText: 'Test Grocery Store' }).first();
  await receiptButton.click();

  // Wait for the receipt to expand and verify summary information
  await expect(page.getByText('3 items')).toBeVisible();
  await expect(page.getByText('$12.47')).toBeVisible(); // 5.99 + 3.49 + 2.99

  // Wait for the receipt to expand and verify all items are visible
  await expect(page.getByText('Test Milk')).toBeVisible();
  await expect(page.getByText('Test Eggs')).toBeVisible();
  await expect(page.getByText('Test Bread')).toBeVisible();

  // Verify item details in expanded view
  await expect(page.getByText('2 gallons')).toBeVisible();
  await expect(page.getByText('12 count')).toBeVisible();
  await expect(page.getByText('1 loaf')).toBeVisible();

  // Verify prices in expanded view
  await expect(page.getByText('$5.99')).toBeVisible();
  await expect(page.getByText('$3.49')).toBeVisible();
  await expect(page.getByText('$2.99')).toBeVisible();

  // Navigate to the Pantry page to verify items were added to inventory
  await page.getByRole('link', { name: 'Food' }).click();
  await page.waitForURL((url) => /\/food(\/)?$/.test(url.pathname), { timeout: 10000 });

  await page.getByRole('link', { name: 'View Pantry' }).click();
  await page.waitForURL((url) => /\/food\/inventory$/.test(url.pathname), { timeout: 10000 });

  // Wait for the pantry page to load
  await expect(page.getByRole('heading', { name: 'Your Pantry' })).toBeVisible();

  // Verify that all three items from the receipt appear in the pantry
  await expect(page.getByText('Test Milk').first()).toBeVisible();
  await expect(page.getByText('Test Eggs').first()).toBeVisible();
  await expect(page.getByText('Test Bread').first()).toBeVisible();

  // Verify quantities in pantry
  await expect(page.getByText('2 gallons').first()).toBeVisible();
  await expect(page.getByText('12 count').first()).toBeVisible();
  await expect(page.getByText('1 loaf').first()).toBeVisible();

  // Verify that items show they were added from receipt
  const milkRow = page.locator('li').filter({ hasText: 'Test Milk' }).first();
  await expect(milkRow.getByText('Added from: receipt')).toBeVisible();

  const eggsRow = page.locator('li').filter({ hasText: 'Test Eggs' }).first();
  await expect(eggsRow.getByText('Added from: receipt')).toBeVisible();

  const breadRow = page.locator('li').filter({ hasText: 'Test Bread' }).first();
  await expect(breadRow.getByText('Added from: receipt')).toBeVisible();

  // Reload the pantry page to verify persistence
  await page.reload();
  await page.waitForLoadState('networkidle');

  // Verify the items are still visible after reload
  await expect(page.getByText('Test Milk').first()).toBeVisible();
  await expect(page.getByText('Test Eggs').first()).toBeVisible();
  await expect(page.getByText('Test Bread').first()).toBeVisible();

  // --- Robust cleanup at the end ---
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    const maxIterations = 5;
    let cleanupIterations = 0;
    
    while (cleanupIterations < maxIterations) {
      // Delete test food items first (due to foreign key constraints)
      await supabase
        .from('food_items')
        .delete()
        .eq('user_id', userId)
        .in('name', ['Test Milk', 'Test Eggs', 'Test Bread']);
      
      // Delete test receipt items and receipts
      const { data: receipts } = await supabase
        .from('receipts')
        .select('id')
        .eq('user_id', userId)
        .eq('store_name', 'Test Grocery Store');
      
      if (receipts && receipts.length > 0) {
        const receiptIds = receipts.map((r: { id: string }) => r.id);
        await supabase
          .from('receipt_items')
          .delete()
          .in('receipt_id', receiptIds);
        
        await supabase
          .from('receipts')
          .delete()
          .in('id', receiptIds);
      }
      
      cleanupIterations++;
    }
    
    // Verify cleanup was successful
    const { data: remainingFoodItems } = await supabase
      .from('food_items')
      .select('id')
      .eq('user_id', userId)
      .in('name', ['Test Milk', 'Test Eggs', 'Test Bread']);
    
    const { data: remainingReceipts } = await supabase
      .from('receipts')
      .select('id')
      .eq('user_id', userId)
      .eq('store_name', 'Test Grocery Store');
    
    if (remainingFoodItems && remainingFoodItems.length > 0) {
      console.log(`Warning: ${remainingFoodItems.length} test food items still present after cleanup, but continuing with test`);
    }
    
    if (remainingReceipts && remainingReceipts.length > 0) {
      console.log(`Warning: ${remainingReceipts.length} test receipts still present after cleanup, but continuing with test`);
    }
  });
}); 