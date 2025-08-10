import { test, expect } from '@playwright/test';
import { cleanupTestDataBeforeTest } from './test-utils';

test.describe('Start Activity Button', () => {
  test.beforeEach(async ({ page }) => {
    const testId = Date.now().toString();
    
    // Go to auth page and login
    await page.goto('http://localhost:3000/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Wait for dashboard to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Clean up any existing test data after login
    await cleanupTestDataBeforeTest(page, testId);
    
    // Navigate to fitness dashboard
    await page.getByRole('link', { name: /fitness/i }).click();
    await page.waitForURL((url) => /\/fitness(\/)?$/.test(url.pathname), { timeout: 10000 });
  });

  test('should display Start Activity button on fitness dashboard', async ({ page }) => {
    // Verify the Start Activity button is visible
    await expect(page.getByTestId('start-activity-button')).toBeVisible();
    await expect(page.getByRole('button', { name: /Start Activity/i })).toBeVisible();
  });

  test('should open activity selection modal when clicked', async ({ page }) => {
    // Click the Start Activity button
    await page.getByTestId('start-activity-button').click();

    // Verify the modal opens with activity options
    await expect(page.getByText('Start New Activity')).toBeVisible();
    await expect(page.getByText('Start Workout')).toBeVisible();
    await expect(page.getByText('Start Cardio')).toBeVisible();
    await expect(page.getByText('Start Sports')).toBeVisible();
  });

  test('should open workout form when Start Workout is selected', async ({ page }) => {
    // Open the Start Activity modal
    await page.getByTestId('start-activity-button').click();

    // Click Start Workout option
    await page.getByText('Start Workout').click();

    // Verify the workout form opens
    await expect(page.getByText('Start New Workout')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Push Day, Full Body, etc.')).toBeVisible();
  });

  test('should open cardio form when Start Cardio is selected', async ({ page }) => {
    // Open the Start Activity modal
    await page.getByTestId('start-activity-button').click();

    // Click Start Cardio option
    await page.getByText('Start Cardio').click();

    // Verify the cardio form opens
    await expect(page.getByText('Start Cardio Session')).toBeVisible();
    await expect(page.getByPlaceholder('e.g. Running, Cycling, Swimming, Walking')).toBeVisible();
  });

  test('should navigate to sports live page when Start Sports is selected', async ({ page }) => {
    // Open the Start Activity modal
    await page.getByTestId('start-activity-button').click();

    // Click Start Sports option
    await page.getByText('Start Sports').click();

    // Verify navigation to sports live page
    await expect(page).toHaveURL(/\/fitness\/sports\/live/);
    await expect(page.getByText('Start a New Sports Session')).toBeVisible();
  });

  test('should close modal when X button is clicked', async ({ page }) => {
    // Open the Start Activity modal
    await page.getByTestId('start-activity-button').click();

    // Verify modal is open
    await expect(page.getByText('Start New Activity')).toBeVisible();

    // Click the X button to close - use a more specific selector
    await page.locator('button:has(svg)').first().click();

    // Verify modal is closed
    await expect(page.getByText('Start New Activity')).not.toBeVisible();
  });

  test('should show Start Activity button in empty state', async ({ page }) => {
    // The empty state should show when no fitness data exists
    // Verify the Start Activity button is present in empty state
    await expect(page.getByTestId('start-activity-button')).toBeVisible();
    
    // If empty state is shown, verify it has the Start Activity button
    const emptyStateText = page.getByText('Welcome to your Fitness Dashboard!');
    if (await emptyStateText.isVisible()) {
      await expect(page.getByText('Start Activity')).toBeVisible();
    }
  });
});
