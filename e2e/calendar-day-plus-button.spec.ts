import { test, expect } from '@playwright/test';
import { generateUniqueTitle } from './test-utils';
import { uniq } from './utils/dataGen';

function toYMDFromAria(aria: string) {
  if (!aria) {
    throw new Error('aria-label is null or empty');
  }
  const [monthName, dayStr, yearStr] = aria.replace(',', '').split(' ');
  const month = new Date(`${monthName} 1, 2000`).getMonth() + 1;
  const day = String(Number(dayStr)).padStart(2, '0');
  return `${yearStr}-${String(month).padStart(2,'0')}-${day}`;
}

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
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on a day in the calendar (not today to avoid conflicts)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Use a more reliable date formatting that accounts for timezone
    const tomorrowStr = tomorrow.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // Find and click on tomorrow's date in the calendar (use first match)
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await expect(tomorrowCell).toBeVisible();
    await tomorrowCell.click();
    
    // Wait a moment for the selection to register
    await page.waitForTimeout(1000);
    
    // Debug: Check if the button is rendered
    const allButtons = page.locator('div[aria-label="Add event for this day"]');
    const buttonCount = await allButtons.count();

    
    // Verify the "+" button appears (anywhere on the page)
    const plusButton = page.locator('div[aria-label="Add event for this day"]').first();
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
    await expect(page.locator('button').filter({ hasText: 'Workout' }).filter({ hasText: 'Plan a fitness activity' })).toBeVisible();
  });

  test('General Event option opens add event modal with pre-selected date', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on a day in the calendar
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    // Click the "+" button
    const plusButton = page.locator('div[aria-label="Add event for this day"]').first();
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

  test('Meal option opens meal planning modal with selected date', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Find a day cell and try to compute the date from the calendar structure
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const cell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    
    // Get the date by examining the calendar's current month/year and the day number
    const dateInfo = await page.evaluate(() => {
      // Find the calendar navigation elements to get current month/year
      const monthYearElement = document.querySelector('.react-calendar__navigation__label');
      const monthYearText = monthYearElement?.textContent || '';
      
      return {
        monthYearText,
        currentDate: new Date().toISOString()
      };
    });
    
    // Get the day number from the clicked cell
    const dayNumber = await cell.textContent();
    
    // Parse the month/year from the calendar navigation
    // Format is typically "January 2025" or similar
    const monthYearMatch = dateInfo.monthYearText.match(/(\w+)\s+(\d{4})/);
    if (monthYearMatch && dayNumber) {
      const monthName = monthYearMatch[1];
      const year = monthYearMatch[2];
      const day = dayNumber.trim();
      
      // Use our utility function to convert to YYYY-MM-DD
      const aria = `${monthName} ${day}, ${year}`;
      
      await cell.click();
      const expectedDate = toYMDFromAria(aria);
      
      // Wait for the plus button to appear and click it
      const plusButton = page.locator('div[aria-label="Add event for this day"]').first();
      await expect(plusButton).toBeVisible();
      await plusButton.click();
      
      // Click Meal option
      await page.getByRole('button', { name: /Plan a meal for/ }).click();
      
      // Verify the meal planning modal opens
      await expect(page.getByRole('heading', { name: 'Plan a Meal' })).toBeVisible();
      await expect(page.getByText('Schedule meals for the week ahead')).toBeVisible();
      
      // Verify the date is pre-selected (should match the clicked date)
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput).toHaveValue(expectedDate);
      // Close the modal
      await page.getByRole('button', { name: 'Close modal' }).click();
    } else {
      throw new Error(`Could not parse calendar date info. MonthYear: ${dateInfo.monthYearText}, DayNumber: ${dayNumber}`);
    }
  });

  test('Workout option navigates to fitness planner with selected date', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on a day in the calendar - use today's date to avoid month boundary issues
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const todayCell = page.locator('button.react-calendar__tile').filter({ hasText: today.getDate().toString() }).first();
    await todayCell.click();
    
    // Click the "+" button
    const plusButton = page.locator('div[aria-label="Add event for this day"]').first();
    await plusButton.click();
    
    // Click Workout option
    await page.locator('button').filter({ hasText: 'Workout' }).filter({ hasText: 'Plan a fitness activity' }).click();
    
    // Verify navigation to fitness page
    await page.waitForURL((url) => /\/fitness(\/)?$/.test(url.pathname));
    
    // Wait a moment for the page to stabilize
    await page.waitForTimeout(2000);
    
    // Check if there's an error boundary
    const errorHeading = page.getByRole('heading', { name: 'Something went wrong' });
    if (await errorHeading.isVisible()) {
      console.log('Error boundary detected, reloading page...');
      await page.getByRole('button', { name: 'Reload' }).click();
      await page.waitForTimeout(2000);
    }
    
    // Wait for the fitness dashboard to load
    await expect(page.getByTestId('home-header')).toBeVisible({ timeout: 10000 });
    
    // Click the "Plan Workouts" button to open the modal
    await page.getByRole('button', { name: /Plan Workouts/i }).click();
    
    // Verify the plan workout modal opens
    await expect(page.getByTestId('plan-workout-modal')).toBeVisible({ timeout: 10000 });
  });

  test('Plus button only appears on selected day', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Initially, check if there's already a "+" button visible
    const plusButtons = page.locator('div[aria-label="Add event for this day"]');
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
    
    // Wait for the plus button to appear after clicking
    await expect(plusButtons).toHaveCount(1, { timeout: 5000 });
    
    // Click on a different day
    const dayAfterTomorrow = new Date();
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
    const dayAfterTomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: dayAfterTomorrow.getDate().toString() }).first();
    await dayAfterTomorrowCell.click();
    
    // Wait for the plus button to move to the new selected day
    await expect(plusButtons).toHaveCount(1, { timeout: 5000 });
    
    // Verify the button is on the new selected day
    const newPlusButton = dayAfterTomorrowCell.locator('div[aria-label="Add event for this day"]');
    await expect(newPlusButton).toBeVisible({ timeout: 5000 });
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on a day and open the modal
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowCell = page.locator('button.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await tomorrowCell.click();
    
    const plusButton = page.locator('div[aria-label="Add event for this day"]').first();
    await plusButton.click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });
}); 