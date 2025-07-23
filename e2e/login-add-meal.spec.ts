/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';

// Basic meal workflow: login, add meal, verify in list

test('Basic meal workflow: add and verify meal', async ({ page }) => {
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

  // Clean up any existing test meals from previous test runs
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    // Delete test meals by name
    const { data: meals } = await supabase
      .from('meals')
      .select('id')
      .eq('user_id', userId)
      .in('name', ['Test Chicken Parmesan']);
    if (meals && meals.length > 0) {
      const mealIds = meals.map(m => m.id);
      // Delete meal_ingredients first (FK constraint)
      await supabase.from('meal_ingredients').delete().in('meal_id', mealIds);
      await supabase.from('meals').delete().in('id', mealIds);
    }
  });

  // Navigate to the "Food" section
  await page.getByRole('link', { name: /food/i }).click();
  await page.waitForURL((url) => /\/food(\/)?.*$/.test(url.pathname), { timeout: 10000 });

  // Click the "Add a Meal" link
  await page.getByRole('link', { name: /add a meal/i }).click();
  await page.waitForURL((url) => /\/food\/addmeal$/.test(url.pathname), { timeout: 10000 });

  // Wait for the Add Meal page to load
  await expect(page.getByRole('heading', { name: /add a new meal/i })).toBeVisible();

  // Fill out the meal form
  await page.getByPlaceholder('e.g. Chicken Alfredo').fill('Test Chicken Parmesan');
  await page.getByPlaceholder('Brief description').fill('A classic Italian-American dish.');
  await page.getByLabel('Prep Time (min)').fill('15');
  await page.getByLabel('Cook Time (min)').fill('30');
  await page.getByLabel('Servings').fill('4');

  // Fill first ingredient
  await page.getByPlaceholder('Ingredient').fill('Chicken Breast');
  await page.getByPlaceholder('Qty').fill('2');
  await page.getByPlaceholder('Unit').fill('pieces');

  // Add a second ingredient
  await page.getByRole('button', { name: '+ Add Ingredient' }).click();
  const ingredientInputs = await page.locator('input[placeholder="Ingredient"]');
  await ingredientInputs.nth(1).fill('Parmesan Cheese');
  const qtyInputs = await page.locator('input[placeholder="Qty"]');
  await qtyInputs.nth(1).fill('100');
  const unitInputs = await page.locator('input[placeholder="Unit"]');
  await unitInputs.nth(1).fill('grams');

  // Fill first instruction
  await page.getByPlaceholder('Step 1').fill('Pound chicken breasts and season.');
  // Add a second step
  await page.getByRole('button', { name: '+ Add Step' }).click();
  await page.getByPlaceholder('Step 2').fill('Coat with breadcrumbs and fry until golden.');

  // Submit the form
  await page.getByRole('button', { name: /save meal/i }).click();

  // Wait for navigation to Meals list
  await page.waitForURL((url) => /\/food\/meals$/.test(url.pathname), { timeout: 30000 });
  await expect(page.getByRole('heading', { name: /meals/i })).toBeVisible({ timeout: 10000 });

  // Reload the Meals list page to ensure fresh data
  await page.reload();
  await expect(page.getByRole('heading', { name: /meals/i })).toBeVisible({ timeout: 10000 });

  // Verify the new meal appears in the list by name
  await expect(page.getByRole('heading', { name: 'Test Chicken Parmesan' })).toBeVisible({ timeout: 10000 });

  // Click on the meal to go to its detail view
  await page.getByRole('heading', { name: 'Test Chicken Parmesan' }).click();

  // Wait for the detail view to load (meal name as h1)
  await expect(page.getByRole('heading', { name: 'Test Chicken Parmesan', level: 1 })).toBeVisible({ timeout: 10000 });

  // Assert description is present
  await expect(page.getByText('A classic Italian-American dish.')).toBeVisible();

  // Assert ingredients are present and correct
  await expect(page.getByRole('heading', { name: /ingredients/i })).toBeVisible();
  await expect(page.getByText('2 pieces Chicken Breast')).toBeVisible();
  await expect(page.getByText('100 grams Parmesan Cheese')).toBeVisible();

  // Assert instructions/steps are present and correct
  await expect(page.getByRole('heading', { name: /instructions/i })).toBeVisible();
  await expect(page.getByText('Pound chicken breasts and season.')).toBeVisible();
  await expect(page.getByText('Coat with breadcrumbs and fry until golden.')).toBeVisible();

  // Assert no loading spinner is visible (content is stable)
  await expect(page.locator('text=Loading')).not.toBeVisible();

  // (Foundation for future: can add steps for cooking, editing, etc.)
}); 