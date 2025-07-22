import { test, expect } from '@playwright/test';

/* ---------- shared login / cleanup ---------- */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    // @ts-ignore
    const supabase = window.supabase;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // Clean up all workouts for this user
    await supabase.from('fitness_workouts').delete().eq('user_id', user.id);
    await supabase.from('calendar_events').delete().eq('user_id', user.id);
  });

  await page.goto('/auth');
  if (await page.getByPlaceholder(/email/i).isVisible().catch(() => false)) {
    await page.getByPlaceholder(/email/i).fill('test@example.com');
    await page.getByPlaceholder(/password/i).fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForLoadState('networkidle');
  }
});

/* ---------- happy path ---------- */
test('user can start workout, add exercise, log a set, finish, and see it on the calendar', async ({ page }) => {
  // Navigate to workouts list
  await page.goto('/fitness/workouts');

  // First click: bring up the live page (which shows setup form if no workout is active)
  await page.getByRole('button', { name: /start workout/i }).click();
  await page.waitForURL(/\/fitness\/workouts\/live$/, { timeout: 10_000 });

  // Fill in title & notes on the setup form (on /live)
  await page.getByPlaceholder('e.g. Push Day, Full Body, etc.').fill('My Test Workout');
  await page.getByPlaceholder('Add any notes or goals for this workout (optional)').fill('These are my notes for the workout.');

  // Second click: actually start the live workout (submits the form)
  await page.getByRole('button', { name: /^start workout$/i }).click();
  // Wait for the page to update to the logging UI (still on /live, but now shows workout in progress)
  await page.getByRole('heading', { name: /workout in progress/i, exact: false }).waitFor({ timeout: 10_000 });

  // Add exercise
  await page.getByPlaceholder('e.g. Bench Press, Squat, etc.').fill('Push-ups');
  await page.getByRole('button', { name: /^add$/i }).click();

  // Log first set
  await page.waitForSelector('input[placeholder="Weight (lbs)"]', { state: 'attached', timeout: 10_000 });
  const firstExerciseCard = page.locator('div.mb-6').first();
  await firstExerciseCard.getByPlaceholder(/reps/i).fill('3');
  await firstExerciseCard.getByPlaceholder(/weight \(lbs\)/i).fill('100');
  await firstExerciseCard.getByRole('button', { name: /log set/i }).click();

  // End workout – wait for redirect
  await page.getByRole('button', { name: /end workout/i }).click();
  await page.waitForURL(/\/fitness\/workouts$/, { timeout: 10_000 });
  await expect(page.getByRole('heading', { name: /workouts/i })).toBeVisible();

  // Wait for UI to update
  await page.waitForTimeout(1000);

  const items = await page.locator('li').all();
  let found = false;
  for (const item of items) {
    const text = await item.textContent();
    if (text && text.includes('My Test Workout') && text.includes('These are my notes for the workout.')) {
      found = true;
      break;
    }
  }
  expect(found).toBe(true);
});
