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
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click the floating "+" button
    const plusButton = page.locator('button[aria-label="Add calendar event"]');
    await expect(plusButton).toBeVisible();
    await plusButton.click();
    
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
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click the floating "+" button
    const plusButton = page.locator('button[aria-label="Add calendar event"]');
    await plusButton.click();
    
    // Click General Event option
    await page.getByRole('button', { name: /General Event/ }).click();
    
    // Verify the add event modal appears
    await expect(page.getByRole('heading', { name: 'Add Event' })).toBeVisible();
    await expect(page.getByPlaceholder('Event title')).toBeVisible();
    await expect(page.getByPlaceholder('Description (optional)')).toBeVisible();
  });

  test('Meal option navigates to food planner page', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click the floating "+" button
    const plusButton = page.locator('button[aria-label="Add calendar event"]');
    await plusButton.click();
    
    // Click Meal option
    await page.locator('button').filter({ hasText: 'Meal' }).filter({ hasText: 'Plan a meal for a specific date' }).click();
    
    // Verify navigation to food planner page
    await page.waitForURL(/\/food\/planner/);
    await expect(page.getByText('Plan a Meal')).toBeVisible();
  });

  test('Workout option navigates to fitness planner page', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click the floating "+" button
    const plusButton = page.locator('button[aria-label="Add calendar event"]');
    await plusButton.click();
    
    // Click Workout option
    await page.locator('button').filter({ hasText: 'Workout' }).filter({ hasText: 'Plan a fitness activity' }).click();
    
    // Verify navigation to fitness planner page
    await page.waitForURL(/\/fitness\/planner/);
    await expect(page.getByText('Planned Fitness Activities')).toBeVisible();
  });

  test('Cancel button closes selection modal', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click the floating "+" button
    const plusButton = page.locator('button[aria-label="Add calendar event"]');
    await plusButton.click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click Cancel
    await page.getByRole('button', { name: 'Cancel' }).click();
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });

  test('Modal can be closed by clicking outside', async ({ page }) => {
    await page.waitForSelector('[data-testid="home-header"]');
    
    // Click the floating "+" button
    const plusButton = page.locator('button[aria-label="Add calendar event"]');
    await plusButton.click();
    
    // Verify modal is open
    await expect(page.getByText('What would you like to plan?')).toBeVisible();
    
    // Click outside the modal (on the backdrop) - use a more specific selector
    await page.click('div.fixed.inset-0.bg-black.bg-opacity-50');
    
    // Verify modal is closed
    await expect(page.getByText('What would you like to plan?')).not.toBeVisible();
  });
}); 