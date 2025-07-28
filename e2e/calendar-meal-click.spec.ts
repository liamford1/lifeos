import { test, expect } from '@playwright/test';
import { generateUniqueMealName, cleanupTestMeal, waitForDatabaseOperation } from './test-utils';

test.describe('Calendar Meal Click Behavior', () => {
  let testMealName: string;

  test.beforeEach(async ({ page }) => {
    testMealName = generateUniqueMealName('Test Calendar Meal');
    
    // Log in first
    await page.goto('http://localhost:3000/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.locator('text=Planner')).toBeVisible({ timeout: 10000 });
    
    // Clean up any existing test data
    await cleanupTestMeal(page, testMealName);
    
    // Create a test meal using page.evaluate
    const mealData = await page.evaluate(async (name: string) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      // Create the meal
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          name: name,
          description: 'Test meal for calendar click behavior',
          instructions: ['Step 1: Prepare ingredients', 'Step 2: Cook the meal', 'Step 3: Serve'],
          servings: 2,
          date: new Date().toISOString().split('T')[0]
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // Create calendar event for the meal
      const { error: calendarError } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: `Meal: ${name}`,
          description: 'Test meal for calendar click behavior',
          start_time: new Date().toISOString(),
          source: 'meal',
          source_id: meal.id
        });

      if (calendarError) throw calendarError;
      
      return { mealId: meal.id, mealName: name };
    }, testMealName);

    // Wait for database operations to complete
    await waitForDatabaseOperation(page, 1000);
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await cleanupTestMeal(page, testMealName);
  });

  test('Clicking meal event on calendar navigates to cook page', async ({ page }) => {
    // Navigate to the dashboard (which contains the calendar)
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible({ timeout: 10000 });
    
    // Find the meal event on the calendar
    const mealEvent = page.getByTestId(/calendar-event-/)
      .filter({ hasText: testMealName });
    
    await expect(mealEvent).toBeVisible({ timeout: 10000 });
    
    // Click the meal event
    await mealEvent.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the cook page, not the meal detail page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/food/meals/');
    expect(currentUrl).toContain('/cook');
    expect(currentUrl).not.toMatch(/\/food\/meals\/[^\/]+$/); // Should not end with just meal ID
    
    // Verify we're on the cook page by checking for cook-specific elements
    await expect(page.getByRole('heading', { name: testMealName })).toBeVisible();
    await expect(page.getByText('Instructions')).toBeVisible();
    await expect(page.getByText('Start Cooking')).toBeVisible();
  });

  test('Clicking meal event in day view list navigates to cook page', async ({ page }) => {
    // Navigate to the dashboard
    await page.goto('http://localhost:3000');
    
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: /calendar/i })).toBeVisible({ timeout: 10000 });
    
    // Find the meal event in the day view list (below the calendar)
    const mealEventInList = page.locator('li')
      .filter({ hasText: testMealName })
      .first();
    
    await expect(mealEventInList).toBeVisible({ timeout: 10000 });
    
    // Click the meal event in the list
    await mealEventInList.click();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we're on the cook page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/food/meals/');
    expect(currentUrl).toContain('/cook');
    expect(currentUrl).not.toMatch(/\/food\/meals\/[^\/]+$/); // Should not end with just meal ID
    
    // Verify we're on the cook page by checking for cook-specific elements
    await expect(page.getByRole('heading', { name: testMealName })).toBeVisible();
    await expect(page.getByText('Instructions')).toBeVisible();
    await expect(page.getByText('Start Cooking')).toBeVisible();
  });
}); 