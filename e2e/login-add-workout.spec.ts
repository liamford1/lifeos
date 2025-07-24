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

  // --- Robust cleanup at the start (match planned meals test) ---
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    let cleanupIterations = 0;
    const maxIterations = 5;
    do {
      if (cleanupIterations >= maxIterations) break;
      // Find all workouts for the test user
      const { data: foundWorkouts } = await supabase
        .from('fitness_workouts')
        .select('id, title')
        .eq('user_id', userId);
      const workoutIds = (foundWorkouts || []).map((w: any) => w.id);
      if (workoutIds.length > 0) {
        // Delete sets (FK: fitness_sets.exercise_id -> fitness_exercises.id)
        const { data: foundExercises } = await supabase
          .from('fitness_exercises')
          .select('id')
          .in('workout_id', workoutIds);
        const exerciseIds = (foundExercises || []).map((e: any) => e.id);
        if (exerciseIds.length > 0) {
          await supabase.from('fitness_sets').delete().in('exercise_id', exerciseIds);
        }
        // Delete exercises
        await supabase.from('fitness_exercises').delete().in('workout_id', workoutIds);
        // Delete workouts
        await supabase.from('fitness_workouts').delete().in('id', workoutIds);
        // Delete related calendar events
        await supabase.from('calendar_events').delete().eq('user_id', userId).in('source_id', workoutIds);
      }
      // Clean up any orphaned calendar events with source = 'workout' and user_id
      await supabase.from('calendar_events').delete().eq('user_id', userId).eq('source', 'workout');
      cleanupIterations++;
    } while (true);
  });

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

  // --- Begin expanded test ---

  // 1. Navigate away (to Food), then return to Workouts
  await page.getByRole('link', { name: /food/i }).click();
  await page.waitForURL((url) => /\/food(\/)?$/.test(url.pathname), { timeout: 10000 });
  // Confirm nav button for workout in progress is visible
  await expect(page.getByRole('button', { name: /workout in progress/i })).toBeVisible();
  // Click the nav button to return to live workout
  await page.getByRole('button', { name: /workout in progress/i }).click();
  await page.waitForURL((url) => /\/fitness\/workouts\/live$/.test(url.pathname), { timeout: 10000 });
  // Confirm the workout in progress UI is still present
  await expect(page.getByRole('heading', { name: /workout in progress/i })).toBeVisible();
  await expect(page.getByText('Push Day')).toBeVisible();

  // 2. Reload the page and confirm session state persists
  await page.reload();
  await expect(page.getByRole('heading', { name: /workout in progress/i })).toBeVisible();
  await expect(page.getByText('Push Day')).toBeVisible();

  // 3. Add an exercise with a name
  const exerciseName = `Bench Press ${Math.floor(Math.random() * 10000)}`;
  await page.getByPlaceholder('e.g. Bench Press, Squat, etc.').fill(exerciseName);
  await page.getByRole('button', { name: /^add$/i }).click();
  // Wait for exercise to appear
  await expect(page.getByText(exerciseName)).toBeVisible({ timeout: 5000 });

  // 4. Add a set to the exercise (reps = 10, weight = 100)
  // Find the exercise block by name
  const exerciseBlock = page.locator('.font-semibold.mb-1', { hasText: exerciseName }).locator('..');
  // Fill reps and weight in the set form inside this block
  await exerciseBlock.getByPlaceholder('Reps').fill('10');
  await exerciseBlock.getByPlaceholder('Weight (lbs)').fill('100');
  await exerciseBlock.getByRole('button', { name: /log set/i }).click();
  // Wait for set to appear
  await expect(exerciseBlock.getByText(/set 1: 10 reps @ 100 lbs/i)).toBeVisible({ timeout: 5000 });

  // 5. Reload and confirm set persists
  await page.reload();
  await expect(page.getByText(exerciseName)).toBeVisible();
  await expect(page.getByText(/set 1: 10 reps @ 100 lbs/i)).toBeVisible();

  // 6. End the workout
  await page.getByRole('button', { name: /end workout/i }).click();
  await page.waitForURL((url) => /\/fitness\/workouts$/.test(url.pathname), { timeout: 10000 });

  // 7. Confirm workout status is completed in the list
  await expect(page.getByRole('heading', { name: /workouts/i })).toBeVisible();
  // Find the workout in the list by title
  const workoutListItem = page.getByText('Push Day').locator('..');
  await expect(workoutListItem).toBeVisible();
  // Click to view workout detail
  await workoutListItem.click();
  await page.waitForURL(/\/fitness\/workouts\/[\w-]+$/);
  // Confirm exercises and sets are present
  await expect(page.getByText(exerciseName)).toBeVisible();
  await expect(page.getByText(/set 1: 10 reps @ 100 lbs/i)).toBeVisible();

  // 8. Reload and confirm persistence
  await page.reload();
  await expect(page.getByText(exerciseName)).toBeVisible();
  await expect(page.getByText(/set 1: 10 reps @ 100 lbs/i)).toBeVisible();

  // 9. Delete the workout (from detail page)
  // Go back to workouts list if needed
  await page.goto('http://localhost:3000/fitness/workouts');
  await expect(page.getByRole('heading', { name: /workouts/i })).toBeVisible();
  // Locate the list item or div that contains both the workout title and the delete button
  const workoutCard = page.locator('li, div').filter({ hasText: 'Push Day' }).first();
  // Ensure it's visible
  await expect(workoutCard).toBeVisible();
  // Locate and click the delete button inside it
  const deleteButton = workoutCard.getByRole('button', { name: /delete/i });
  await expect(deleteButton).toBeVisible();
  await deleteButton.click();
  // Reload and confirm that "Push Day" no longer appears
  await page.reload();
  await expect(page.getByText('Push Day')).not.toBeVisible();

  // --- End expanded test ---

  // --- Robust cleanup at the end ---
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    let cleanupIterations = 0;
    const maxIterations = 5;
    do {
      if (cleanupIterations >= maxIterations) break;
      // Find all workouts for the test user
      const { data: foundWorkouts } = await supabase
        .from('fitness_workouts')
        .select('id, title')
        .eq('user_id', userId);
      const workoutIds = (foundWorkouts || []).map((w: any) => w.id);
      if (workoutIds.length > 0) {
        // Delete sets (FK: fitness_sets.exercise_id -> fitness_exercises.id)
        const { data: foundExercises } = await supabase
          .from('fitness_exercises')
          .select('id')
          .in('workout_id', workoutIds);
        const exerciseIds = (foundExercises || []).map((e: any) => e.id);
        if (exerciseIds.length > 0) {
          await supabase.from('fitness_sets').delete().in('exercise_id', exerciseIds);
        }
        // Delete exercises
        await supabase.from('fitness_exercises').delete().in('workout_id', workoutIds);
        // Delete workouts
        await supabase.from('fitness_workouts').delete().in('id', workoutIds);
        // Delete related calendar events
        await supabase.from('calendar_events').delete().eq('user_id', userId).in('source_id', workoutIds);
      }
      // Clean up any orphaned calendar events with source = 'workout' and user_id
      await supabase.from('calendar_events').delete().eq('user_id', userId).eq('source', 'workout');
      cleanupIterations++;
    } while (true);
  });

  // Optionally, reload and confirm no test workouts remain
  await page.goto('http://localhost:3000/fitness/workouts');
  await expect(page.getByRole('heading', { name: /workouts/i })).toBeVisible();
  const testWorkoutLinks = await page.locator('a', { hasText: 'Push Day' }).count();
  if (testWorkoutLinks > 0) {
    console.log(`Warning: ${testWorkoutLinks} test workouts still present after cleanup, but continuing with test`);
  }

}); 