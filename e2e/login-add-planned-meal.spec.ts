/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';

// Meal planning workflow: login, create meal, plan meal, verify in planner and calendar, cleanup

test('Meal planning workflow: plan and verify meal', async ({ page }) => {
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

  // Clean up any existing test meals, planned meals, and calendar events from previous test runs
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    let cleanupIterations = 0;
    const maxIterations = 5;
    do {
      if (cleanupIterations >= maxIterations) break;
      // Find all test meals with name starting with 'Test Planned Meal'
      const { data: foundMeals } = await supabase
        .from('meals')
        .select('id, name')
        .eq('user_id', userId);
      const testMeals = (foundMeals || []).filter((m: any) => m.name && m.name.startsWith('Test Planned Meal'));
      const mealIds = testMeals.map((m: any) => m.id);
      if (mealIds.length > 0) {
        // Delete planned_meals first (FK constraint)
        await supabase.from('planned_meals').delete().in('meal_id', mealIds);
        // Delete meal_ingredients
        await supabase.from('meal_ingredients').delete().in('meal_id', mealIds);
        // Delete cooked_meals
        await supabase.from('cooked_meals').delete().in('meal_id', mealIds);
        // Delete cooking_sessions
        await supabase.from('cooking_sessions').delete().in('meal_id', mealIds);
        // Delete meals
        await supabase.from('meals').delete().in('id', mealIds);
      }
      // Find all test planned meals (in case orphaned)
      const { data: foundPlanned } = await supabase
        .from('planned_meals')
        .select('id')
        .eq('user_id', userId);
      const testPlannedMeals = (foundPlanned || []);
      if (testPlannedMeals.length > 0) {
        const plannedIds = testPlannedMeals.map((p: any) => p.id);
        await supabase.from('planned_meals').delete().in('id', plannedIds);
      }
      // Clean up calendar events with title starting with 'Dinner: Test Planned Meal'
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id, title')
        .eq('user_id', userId);
      const testEvents = (events || []).filter((e: any) => e.title && e.title.startsWith('Dinner: Test Planned Meal'));
      if (testEvents.length > 0) {
        const eventIds = testEvents.map((e: any) => e.id);
        await supabase.from('calendar_events').delete().in('id', eventIds);
      }
      cleanupIterations++;
    } while (true);
  });

  // Generate a unique meal name for this test run
  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  const testMealName = `Test Planned Meal ${uniqueSuffix}`;

  // Create a new meal
  await page.goto('http://localhost:3000/food/addmeal');
  await expect(page.getByRole('heading', { name: /add a new meal/i })).toBeVisible();
  await page.getByPlaceholder('e.g. Chicken Alfredo').fill(testMealName);
  await page.getByPlaceholder('Brief description').fill('A meal for planning test.');
  await page.getByLabel('Prep Time (min)').fill('10');
  await page.getByLabel('Cook Time (min)').fill('20');
  await page.getByLabel('Servings').fill('2');
  await page.getByPlaceholder('Ingredient').fill('Test Ingredient');
  await page.getByPlaceholder('Qty').fill('1');
  await page.getByPlaceholder('Unit').fill('unit');
  await page.getByPlaceholder('Step 1').fill('Test step.');
  await page.getByRole('button', { name: /save meal/i }).click();
  await page.waitForURL((url) => /\/food\/meals$/.test(url.pathname), { timeout: 20000 });
  await expect(page.getByRole('heading', { name: /meals/i })).toBeVisible({ timeout: 10000 });

  // Plan the meal
  await page.goto('http://localhost:3000/food/planner');
  await expect(page.getByRole('heading', { name: /plan a meal/i })).toBeVisible();
  // Select the meal
  await page.getByTestId('meal-select').selectOption({ label: testMealName });
  // Pick a date (today + 1)
  const today = new Date();
  const planDate = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const yyyy = planDate.getFullYear();
  const mm = String(planDate.getMonth() + 1).padStart(2, '0');
  const dd = String(planDate.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;
  await page.getByRole('textbox', { name: '' }).fill(dateStr);
  // Select meal time
  await page.getByTestId('meal-time-select').selectOption({ value: 'dinner' });
  // Click Plan Meal
  await page.getByRole('button', { name: /plan meal/i }).click();
  // Wait for the planned meal to appear in the Upcoming Planned Meals section
  const plannedMealCard = await page.getByTestId(/planned-meal-card-/);
  await expect(plannedMealCard).toBeVisible({ timeout: 10000 });
  await expect(plannedMealCard.locator('div.font-medium')).toHaveText(testMealName);
  await expect(plannedMealCard.locator('div.text-base')).toHaveText(/Dinner/i);

  // Reload and verify in Upcoming Planned Meals
  await page.reload();
  await expect(page.getByRole('heading', { name: /upcoming planned meals/i })).toBeVisible({ timeout: 10000 });
  const plannedMealCardAfterReload = await page.getByTestId(/planned-meal-card-/);
  await expect(plannedMealCardAfterReload).toBeVisible({ timeout: 10000 });
  await expect(plannedMealCardAfterReload.locator('div.font-medium')).toHaveText(testMealName);
  await expect(plannedMealCardAfterReload.locator('div.text-base')).toHaveText(/Dinner/i);
  // Optionally, check the date by finding the parent section or using a more robust locator if needed

  // Verify in calendar view and click the event
  await page.goto('http://localhost:3000/');
  const event = page.getByTestId(/calendar-event-/)
    .filter({ hasText: `Dinner: ${testMealName}` })
    .first();
  await expect(event).toBeVisible({ timeout: 10000 });
  await event.scrollIntoViewIfNeeded();
  await event.click();

  // Wait for navigation to the detail page
  await page.waitForLoadState('networkidle');

  // Assert the meal detail or planned meal detail page is loaded
  await expect(page.getByRole('heading', { name: testMealName })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText('Meal Time: dinner')).toBeVisible();
  // Format the date as shown in the UI (e.g., 'Thursday, July 24, 2025')
  const formattedDate = new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  await expect(page.getByText(`Date: ${formattedDate}`)).toBeVisible();

  // Clean up: delete the planned meal
  await page.goto('http://localhost:3000/food/planner');
  await expect(plannedMealCard).toBeVisible({ timeout: 10000 });
  const deleteButton = plannedMealCard.getByRole('button', { name: /delete/i });
  await expect(deleteButton).toBeVisible({ timeout: 5000 });
  await deleteButton.click();
  // Wait for the planned meal to be removed
  await expect(page.getByTestId(/planned-meal-card-/)).not.toBeVisible({ timeout: 10000 });

  // Delete the meal
  await page.goto('http://localhost:3000/food/meals');
  const testMealCard = page.locator('a', { hasText: /Test Planned Meal/ }).first();
  await expect(testMealCard).toBeVisible({ timeout: 10000 });
  const mealDeleteButton = testMealCard.locator('xpath=..').locator('button', { hasText: /delete/i });
  await expect(mealDeleteButton).toBeVisible({ timeout: 5000 });
  await mealDeleteButton.click();
  await expect(testMealCard).not.toBeVisible({ timeout: 10000 });

  // Reload and confirm neither appear in planner, calendar, or meal list
  await page.goto('http://localhost:3000/food/planner');
  await expect(page.getByRole('heading', { name: /upcoming planned meals/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByTestId(/planned-meal-card-/)).not.toBeVisible({ timeout: 10000 });
  await page.goto('http://localhost:3000/food/meals');
  await expect(page.getByRole('heading', { name: /meals/i })).toBeVisible({ timeout: 10000 });
  // No global getByText('Test Planned Meal') assertion here

  // Clean up calendar events for planned meals (by unique title, any date)
  await page.evaluate(async (eventTitle: string) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    // Delete all calendar events for this user and title (any date)
    const { data: events } = await supabase
      .from('calendar_events')
      .select('id')
      .eq('user_id', userId)
      .eq('title', eventTitle);
    if (events && events.length > 0) {
      const eventIds = events.map((e: any) => e.id);
      await supabase.from('calendar_events').delete().in('id', eventIds);
    }
  }, `Dinner: ${testMealName}`);
}); 