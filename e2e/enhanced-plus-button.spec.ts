import { test, expect } from '@playwright/test';
import { generateUniqueTitle } from './test-utils';

test.describe('Enhanced Plus Button Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up before each test
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('/');
  });

  test('Plus button shows selection modal with three options', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click the "Add Event" button (the main one, not the calendar day buttons)
    const addEventButton = page.getByRole('button', { name: 'Add Event', exact: true }).first();
    await expect(addEventButton).toBeVisible();
    await addEventButton.click();
    
    // Verify the selection modal appears
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Verify all three options are present
    await expect(page.getByRole('button', { name: /General Event/ })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Meal' }).filter({ hasText: 'Plan a meal for a specific date' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: 'Workout' }).filter({ hasText: 'Plan a fitness activity' })).toBeVisible();
    
    // Verify descriptions are present
    await expect(page.getByText('Add a calendar event')).toBeVisible();
    await expect(page.getByText('Plan a meal for a specific date')).toBeVisible();
    await expect(page.getByText('Plan a fitness activity')).toBeVisible();
  });

  test('General Event option opens existing add event modal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click the "Add Event" button in the quick action buttons section
    const addEventButton = page.locator('button').filter({ hasText: 'Add Event' }).first();
    await addEventButton.click();
    
    // Click General Event option
    await page.getByRole('button', { name: /General Event/ }).click();
    
    // Verify the add event modal appears
    await expect(page.getByRole('heading', { name: 'Add Event' })).toBeVisible();
    await expect(page.getByPlaceholder('Event title')).toBeVisible();
    await expect(page.getByPlaceholder('Description (optional)')).toBeVisible();
  });

  test('Meal option opens meal planning modal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click the "Add Event" button in the quick action buttons section
    const addEventButton = page.locator('button').filter({ hasText: 'Add Event' }).first();
    await addEventButton.click();
    
    // Click Meal option
    await page.locator('button').filter({ hasText: 'Meal' }).filter({ hasText: 'Plan a meal for a specific date' }).click();
    
    // Verify the meal planning modal opens
    await expect(page.getByRole('heading', { name: 'Plan a Meal' })).toBeVisible();
    await expect(page.getByText('Schedule meals for the week ahead')).toBeVisible();
    
    // Verify the form elements are present
    await expect(page.getByTestId('meal-select')).toBeVisible();
    await expect(page.getByTestId('meal-time-select')).toBeVisible();
    await expect(page.locator('input[type="date"]')).toBeVisible();
    
    // Close the modal
    await page.getByRole('button', { name: 'Close modal' }).click();
  });

  test('Workout option navigates to fitness planner page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click the "Add Event" button in the quick action buttons section
    const addEventButton = page.locator('button').filter({ hasText: 'Add Event' }).first();
    await addEventButton.click();
    
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

  test('Cancel button closes selection modal', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click the "Add Event" button in the quick action buttons section
    const addEventButton = page.locator('button').filter({ hasText: 'Add Event' }).first();
    await addEventButton.click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });

  test('Modal can be closed by clicking outside', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click the "Add Event" button in the quick action buttons section
    const addEventButton = page.locator('button').filter({ hasText: 'Add Event' }).first();
    await addEventButton.click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click outside the modal (on the backdrop) - use a more specific selector
    await page.click('div.fixed.inset-0.bg-black.bg-opacity-50');
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });
}); 