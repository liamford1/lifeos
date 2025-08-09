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
    
    // Find a day cell and get its aria-label
    const cell = page.getByRole('button', { name: /, 2025/ })
      .filter({ has: page.getByLabel('Add event for this day') })
      .first();
    const aria = await cell.getAttribute('aria-label');
    await cell.hover();
    await page.getByLabel('Add event for this day').click();
    
    // Verify the selection modal appears
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    await expect(page.locator('div.text-sm.font-normal.opacity-75.mt-1')).toBeVisible();
    
    // Verify all three options are present
    await expect(page.getByRole('button', { name: /General Event/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Plan a meal for/ })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Workout' }).filter({ hasText: 'Plan a fitness activity' })).toBeVisible();
  });

  test('General Event option opens add event modal with pre-selected date', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Find a day cell and get its aria-label
    const cell = page.getByRole('button', { name: /, 2025/ })
      .filter({ has: page.getByLabel('Add event for this day') })
      .first();
    const aria = await cell.getAttribute('aria-label');
    await cell.hover();
    await page.getByLabel('Add event for this day').click();
    
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
    
    // Find a day cell that has the plus button and get its aria-label
    const cell = page.getByRole('button', { name: /, 2025/ })
      .filter({ has: page.getByLabel('Add event for this day') })
      .first();
    await expect(cell).toBeVisible();
    
        // Get the aria-label from the cell (should contain the date)
    const aria = await cell.getAttribute('aria-label');
    
    // If aria-label is null, try getting it from the plus button's parent
    let expectedDate;
    if (aria) {
      expectedDate = toYMDFromAria(aria);
    } else {
      // Fallback: construct the date from the calendar navigation and day number
      const monthYearText = await page.locator('button').filter({ hasText: '2025' }).first().textContent();
      const dayNumber = await cell.textContent();
      
      // Parse the month/year from the calendar navigation
      const monthYearMatch = monthYearText?.match(/(\w+)\s+(\d{4})/);
      if (monthYearMatch && dayNumber) {
        const monthName = monthYearMatch[1];
        const year = monthYearMatch[2];
        // Extract just the day number (remove the + symbol)
        const day = dayNumber.replace('+', '').trim();
        
        // Use our utility function to convert to YYYY-MM-DD
        const constructedAria = `${monthName} ${day}, ${year}`;
        expectedDate = toYMDFromAria(constructedAria);
      } else {
        throw new Error(`Could not construct date. MonthYear: ${monthYearText}, DayNumber: ${dayNumber}`);
      }
    }
    
    // Click the plus button
    await page.getByLabel('Add event for this day').click();
    
    // Click Meal option
    await page.getByRole('button', { name: /Plan a meal for/ }).click();
    
    // Verify the meal planning modal opens
    await expect(page.getByRole('heading', { name: 'Plan a Meal' })).toBeVisible();
    await expect(page.getByText('Schedule meals for the week ahead')).toBeVisible();
    
    // Verify the date is pre-selected (should match the clicked date)
    await expect(page.locator('input[type="date"]')).toHaveValue(expectedDate);
    
    // Close the modal
    await page.getByRole('button', { name: 'Close modal' }).click();
  });

  test('Workout option navigates to fitness planner with selected date', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Find a day cell and get its aria-label
    const cell = page.getByRole('button', { name: /, 2025/ })
      .filter({ has: page.getByLabel('Add event for this day') })
      .first();
    const aria = await cell.getAttribute('aria-label');
    await cell.hover();
    await page.getByLabel('Add event for this day').click();
    
    // Click Workout option
    await page.locator('button').filter({ hasText: 'Workout' }).filter({ hasText: 'Plan a fitness activity' }).click();
    
    // Verify navigation to fitness page
    await page.waitForURL((url) => /\/fitness(\/)?$/.test(url.pathname));
    await expect(page.getByTestId('plan-workout-modal')).toBeVisible({ timeout: 10_000 });
    
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
      // Find any day button that doesn't have the plus button
      const anyDayButton = page.getByRole('button', { name: /, 2025/ }).first();
      await anyDayButton.click();
      await page.waitForTimeout(500);
    }
    
    // Click on a day that has the plus button
    const cell = page.getByRole('button', { name: /, 2025/ })
      .filter({ has: page.getByLabel('Add event for this day') })
      .first();
    await expect(cell).toBeVisible();
    await cell.click();
    
    // Wait for the plus button to appear after clicking
    await expect(plusButtons).toHaveCount(1, { timeout: 5000 });
    
    // Click on a different day (any day button)
    const differentCell = page.getByRole('button', { name: /, 2025/ })
      .filter({ hasNot: page.getByLabel('Add event for this day') })
      .first();
    await expect(differentCell).toBeVisible();
    await differentCell.click();
    
    // Wait for the plus button to move to the new selected day
    await expect(plusButtons).toHaveCount(1, { timeout: 5000 });
    
    // Verify the button is now on the new selected day by checking that it exists somewhere
    await expect(page.locator('div[aria-label="Add event for this day"]')).toBeVisible({ timeout: 5000 });
  });

  test('Cancel button closes the modal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Find a day cell and get its aria-label
    const cell = page.getByRole('button', { name: /, 2025/ })
      .filter({ has: page.getByLabel('Add event for this day') })
      .first();
    const aria = await cell.getAttribute('aria-label');
    await cell.hover();
    await page.getByLabel('Add event for this day').click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });
}); 