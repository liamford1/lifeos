/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// Helper to get today's date in yyyy-mm-dd format
function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

declare global {
  interface Window {
    supabase: any;
  }
}

test('Login and add a workout', async ({ page }) => {
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

  // Click the "Fitness" link in the sidebar
  await page.getByRole('link', { name: /fitness/i }).click();
  await page.waitForURL((url) => /\/fitness(\/)?$/.test(url.pathname), { timeout: 10000 });

  // Click the "Workouts Weightlifting" link on /fitness (unique match, strict mode)
  await page.getByRole('link', { name: /workouts weightlifting/i, exact: false }).click();
  await page.waitForURL((url) => /\/fitness\/workouts$/.test(url.pathname), { timeout: 10000 });

  // Click the "Start Workout" button
  await page.getByRole('button', { name: /start workout/i }).click();
  await page.waitForURL((url) => /\/fitness\/workouts\/live$/.test(url.pathname), { timeout: 10000 });

  // Run the cleanup here! (delete instead of update)
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    await supabase
      .from('fitness_workouts')
      .delete()
      .eq('user_id', userId)
      .eq('in_progress', true);
  });
  await page.reload();
  await page.waitForTimeout(500);

  // Debug: log the current URL
  console.log('Current URL:', page.url());

  // Assert that we're on the correct URL
  await expect(page).toHaveURL(/\/fitness\/workouts\/live$/);

  // Check if a workout is already in progress (logging UI visible)
  const matches = await page.locator('text=/logging|in progress|end workout/i');
  for (let i = 0; i < await matches.count(); i++) {
    if (await matches.nth(i).isVisible()) {
      throw new Error('Workout already in progress — clear workout state for test user before running this test.');
    }
  }

  // Fill the start workout form (title and date), then submit
  const titleInput = page.getByPlaceholder('e.g. Push Day, Full Body, etc.');
  if (!(await titleInput.isVisible({ timeout: 5000 }))) {
    console.log(await page.content());
    throw new Error('Workout title input not found — neither start form nor logging UI is visible. Check app state for test user.');
  }
  await titleInput.fill('Push Day');

  // Optionally fill the date input if present
  const dateInput = await page.$('input[type="date"]');
  if (dateInput) {
    await dateInput.fill('2025-07-21');
  }

  await page.getByRole('button', { name: /start workout/i }).click();

  // Wait for the UI to settle
  await page.waitForLoadState('networkidle');

  // Assert for either the new workout or the empty state
  const workoutVisible = await page.getByText('Push Day').isVisible().catch(() => false);
  const emptyStateVisible = await page.getByText(/no entries yet/i).isVisible().catch(() => false);
  expect(workoutVisible || emptyStateVisible).toBe(true);

  // Wait for the logging UI or confirmation to load by checking for confirmation text
  const inProgressHeading = await page.getByRole('heading', { name: /in progress/i }).isVisible().catch(() => false);
  const inProgressButton = await page.getByRole('button', { name: /in progress/i }).isVisible().catch(() => false);
  const workoutSaved = await page.getByText(/workout saved|workout created|workout history|workouts/i).isVisible().catch(() => false);

  expect(inProgressHeading || inProgressButton || workoutSaved).toBe(true);
}); 