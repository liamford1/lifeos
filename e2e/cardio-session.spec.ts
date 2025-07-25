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

test('Complete Cardio Session Flow', async ({ page }) => {
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

  // --- Cleanup existing cardio sessions for test user ---
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    console.log('[E2E] Cleaning up existing cardio sessions for user:', userId);
    
    // Delete all cardio sessions for the test user
    const { data: existingCardio } = await supabase
      .from('fitness_cardio')
      .select('id')
      .eq('user_id', userId);
    
    if (existingCardio && existingCardio.length > 0) {
      const cardioIds = existingCardio.map((c: any) => c.id);
      console.log('[E2E] Deleting', cardioIds.length, 'existing cardio sessions');
      
      // Delete related calendar events first
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('source', 'cardio')
        .in('source_id', cardioIds);
      
      // Delete cardio sessions
      await supabase
        .from('fitness_cardio')
        .delete()
        .in('id', cardioIds);
    }
    
    // Also clean up any in-progress cardio sessions
    await supabase
      .from('fitness_cardio')
      .delete()
      .eq('user_id', userId)
      .eq('in_progress', true);
  });

  // ✅ Sanity check: window.supabase is defined
  await page.evaluate(() => {
    if (!window.supabase) throw new Error('[E2E] ❌ window.supabase is still not defined');
    console.log('[E2E] ✅ window.supabase is defined');
  });

  // Navigate to Fitness section
  await page.getByRole('link', { name: /fitness/i }).click();
  await page.waitForURL((url) => /\/fitness(\/)?$/.test(url.pathname), { timeout: 10000 });

  // Navigate to Cardio section
  await page.getByRole('link', { name: /cardio/i }).click();
  await page.waitForURL((url) => /\/fitness\/cardio$/.test(url.pathname), { timeout: 10000 });

  // Verify the "Add Cardio Session" button does NOT exist
  await expect(page.getByRole('link', { name: /add cardio session/i })).not.toBeVisible();

  // Verify only "Start Cardio" button exists
  await expect(page.getByRole('button', { name: /start cardio/i })).toBeVisible();

  // Click "Start Cardio" button
  await page.getByRole('button', { name: /start cardio/i }).click();
  await page.waitForURL((url) => /\/fitness\/cardio\/live$/.test(url.pathname), { timeout: 10000 });

  // Verify we're on the live cardio page
  await expect(page).toHaveURL(/\/fitness\/cardio\/live$/);

  // Check that the start form is visible (no active session)
  await expect(page.getByRole('heading', { name: /start a new cardio session/i })).toBeVisible();

  // Fill in the cardio session form
  const activityType = 'Run';
  const location = 'Central Park';
  const notes = 'Test cardio session for E2E testing';

  await page.getByPlaceholder(/e\.g\. Running, Cycling, Swimming, Walking/i).fill(activityType);
  await page.getByPlaceholder(/e\.g\. Central Park, Gym, Home/i).fill(location);
  await page.getByPlaceholder(/add any notes or goals for this session/i).fill(notes);

  // Submit the form to start the session
  await page.getByRole('button', { name: /start cardio/i }).click();

  // Wait for the session to start and UI to update
  await page.waitForURL((url) => /\/fitness\/cardio\/live$/.test(url.pathname), { timeout: 10000 });

  // Verify the session is now active
  await expect(page.getByRole('heading', { name: /cardio session in progress/i })).toBeVisible();
  await expect(page.getByText(activityType)).toBeVisible();
  await expect(page.getByText(location)).toBeVisible();
  await expect(page.getByText(notes)).toBeVisible();

  // Verify the "End Cardio Session" button is visible
  await expect(page.getByRole('button', { name: /end cardio session/i })).toBeVisible();

  // Test 1: Verify session appears in navbar
  await expect(page.getByRole('button', { name: /cardio in progress/i })).toBeVisible();

  // Test 2: Navigate away and back to verify session persistence
  await page.getByRole('link', { name: /food/i }).click();
  await page.waitForURL((url) => /\/food(\/)?$/.test(url.pathname), { timeout: 10000 });
  
  // Verify cardio session indicator is still in navbar
  await expect(page.getByRole('button', { name: /cardio in progress/i })).toBeVisible();
  
  // Click the navbar button to return to live session
  await page.getByRole('button', { name: /cardio in progress/i }).click();
  await page.waitForURL((url) => /\/fitness\/cardio\/live$/.test(url.pathname), { timeout: 10000 });
  
  // Verify session is still active
  await expect(page.getByRole('heading', { name: /cardio session in progress/i })).toBeVisible();
  await expect(page.getByText(activityType)).toBeVisible();

  // Test 3: Page reload persistence
  await page.reload();
  await expect(page.getByRole('heading', { name: /cardio session in progress/i })).toBeVisible();
  await expect(page.getByText(activityType)).toBeVisible();

  // Test 4: End the cardio session
  await page.getByRole('button', { name: /end cardio session/i }).click();
  
  // Wait for redirect to cardio dashboard
  await page.waitForURL((url) => /\/fitness\/cardio$/.test(url.pathname), { timeout: 10000 });

  // Verify we're back on the cardio dashboard
  await expect(page).toHaveURL(/\/fitness\/cardio$/);

  // Verify the session appears in the cardio history
  await expect(page.getByText(activityType)).toBeVisible();
  await expect(page.getByText(location)).toBeVisible();
  await expect(page.getByText(notes)).toBeVisible();

  // Verify the navbar no longer shows "Cardio in Progress"
  await expect(page.getByRole('button', { name: /cardio in progress/i })).not.toBeVisible();

  // Wait a moment for the session to be fully saved
  await page.waitForTimeout(1000);

  // Test 5: Verify session was properly saved in database
  const sessionData = await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    const { data: cardioSessions, error } = await supabase
      .from('fitness_cardio')
      .select('*')
      .eq('user_id', userId)
      .eq('in_progress', false)
      .order('inserted_at', { ascending: false })
      .limit(1);
    
    if (error) {
      console.error('[E2E] Error querying cardio sessions:', error);
      return null;
    }
    
    return cardioSessions?.[0] || null;
  });

  expect(sessionData).toBeTruthy();
  expect(sessionData.activity_type).toBe(activityType);
  expect(sessionData.location).toBe(location);
  expect(sessionData.notes).toBe(notes);
  expect(sessionData.in_progress).toBe(false);
  expect(sessionData.start_time).toBeTruthy();
  expect(sessionData.end_time).toBeTruthy();
  // Duration might be 0 if the session ended very quickly, which is valid
  expect(sessionData.duration_minutes).toBeGreaterThanOrEqual(0);

  // Test 6: Verify no duplicate sessions were created
  const sessionCount = await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    const { data: cardioSessions } = await supabase
      .from('fitness_cardio')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'Run');
    
    return cardioSessions?.length || 0;
  });

  expect(sessionCount).toBe(1);

  // Test 7: Verify no in-progress sessions remain
  const inProgressCount = await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    const { data: inProgressSessions } = await supabase
      .from('fitness_cardio')
      .select('id')
      .eq('user_id', userId)
      .eq('in_progress', true);
    
    return inProgressSessions?.length || 0;
  });

  expect(inProgressCount).toBe(0);

  // Test 8: Try to start another session and verify it works
  await page.getByRole('button', { name: /start cardio/i }).click();
  await page.waitForURL((url) => /\/fitness\/cardio\/live$/.test(url.pathname), { timeout: 10000 });
  
  // Verify we can start a new session
  await expect(page.getByRole('heading', { name: /start a new cardio session/i })).toBeVisible();

  // Clean up the test session at the end
  await page.evaluate(async () => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Delete the test cardio session
    const { data: testSessions } = await supabase
      .from('fitness_cardio')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'Run');
    
    if (testSessions && testSessions.length > 0) {
      const sessionIds = testSessions.map((s: any) => s.id);
      
      // Delete related calendar events
      await supabase
        .from('calendar_events')
        .delete()
        .eq('user_id', userId)
        .eq('source', 'cardio')
        .in('source_id', sessionIds);
      
      // Delete cardio sessions
      await supabase
        .from('fitness_cardio')
        .delete()
        .in('id', sessionIds);
    }
    
    // Clean up any remaining in-progress sessions
    await supabase
      .from('fitness_cardio')
      .delete()
      .eq('user_id', userId)
      .eq('in_progress', true);
  });

  console.log('[E2E] ✅ Cardio session flow test completed successfully');
}); 