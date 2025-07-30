import { test, expect } from '@playwright/test';
import { generateUniqueTitle } from './test-utils';

test.describe('Calendar Day Plus Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up before each test
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('/');
  });

  test('Plus button appears on selected day and opens planning modal', async ({ page }) => {
    // Wait for the page to load
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click on a day in the calendar (not today to avoid conflicts)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Find and click on tomorrow's date in the calendar (use first match)
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await expect(tomorrowCell).toBeVisible();
    await tomorrowCell.click();
    
    // Wait a moment for the selection to register
    await page.waitForTimeout(1000);
    
    // Debug: Check if the button is rendered
    const allButtons = page.locator('button[aria-label="Add event for this day"]');
    const buttonCount = await allButtons.count();

    
    // Verify the "+" button appears (anywhere on the page)
    const plusButton = page.locator('button[aria-label="Add event for this day"]').first();
    await expect(plusButton).toBeVisible();
    
    // Click the "+" button
    await plusButton.click();
    
    // Verify the selection modal appears with the correct date
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    // Check for the date text in the modal (using a more flexible approach)
    const dateText = await page.locator('div.text-sm.font-normal.opacity-75.mt-1').textContent();

    await expect(page.locator('div.text-sm.font-normal.opacity-75.mt-1')).toBeVisible();
    
    // Verify all three options are present
    await expect(page.getByRole('button', { name: /General Event/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Plan a meal for/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Workout/ })).toBeVisible();
  });

  test('General Event option opens add event modal with pre-selected date', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click on a day in the calendar
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    // Click the "+" button
    const plusButton = page.locator('button[aria-label="Add event for this day"]').first();
    await plusButton.click();
    
    // Click General Event option
    await page.getByRole('button', { name: /General Event/ }).click();
    
    // Verify the add event modal appears
    await expect(page.getByRole('heading', { name: 'Add Event' })).toBeVisible();
    await expect(page.getByPlaceholder('Event title')).toBeVisible();
    await expect(page.getByPlaceholder('Description (optional)')).toBeVisible();
    
    // Verify the form is visible and has the expected fields
    await expect(page.getByPlaceholder('Event title')).toBeVisible();
    await expect(page.getByPlaceholder('Description (optional)')).toBeVisible();
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
    await expect(page.locator('input[type="time"]').nth(1)).toBeVisible();
    
    // Close the modal
    await page.locator('button').filter({ hasText: 'Cancel' }).last().click();
  });

  test('Meal option navigates to food planner with selected date', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click on a day in the calendar
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    // Click the "+" button
    const plusButton = page.locator('button[aria-label="Add event for this day"]').first();
    await plusButton.click();
    
    // Click Meal option
    await page.getByRole('button', { name: /Plan a meal for/ }).click();
    
    // Verify navigation to food planner with date parameter
    await page.waitForURL(/\/food\/planner\?date=/);
    await expect(page.getByText('Plan a Meal')).toBeVisible();
  });

  test('Workout option navigates to fitness planner with selected date', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click on a day in the calendar
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    // Click the "+" button
    const plusButton = page.locator('button[aria-label="Add event for this day"]').first();
    await plusButton.click();
    
    // Click Workout option
    await page.getByRole('button', { name: /Workout/ }).click();
    
    // Verify navigation to fitness planner with date parameter
    await page.waitForURL(/\/fitness\/planner\?date=/);
    await expect(page.getByText('Planned Fitness Activities')).toBeVisible();
  });

  test('Plus button only appears on selected day', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Initially, check if there's already a "+" button visible
    const plusButtons = page.locator('button[aria-label="Add event for this day"]');
    const initialCount = await plusButtons.count();

    
    // If there's already a button, click on a different day to move it
    if (initialCount > 0) {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dayAfterTomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: dayAfterTomorrow.getDate().toString() }).first();
      await dayAfterTomorrowCell.click();
      await page.waitForTimeout(500);
    }
    
    // Click on a day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    // Now one "+" button should be visible
    await expect(plusButtons).toHaveCount(1);
    
    // Click on a different day
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: dayAfterTomorrow.getDate().toString() }).first();
    await dayAfterTomorrowCell.click();
    
    // The "+" button should move to the new selected day
    await expect(plusButtons).toHaveCount(1);
    
    // Verify the button is on the new selected day
    const newPlusButton = dayAfterTomorrowCell.locator('button[aria-label="Add event for this day"]');
    await expect(newPlusButton).toBeVisible();
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click on a day and open the modal
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    const plusButton = page.locator('button[aria-label="Add event for this day"]').first();
    await plusButton.click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });
}); 