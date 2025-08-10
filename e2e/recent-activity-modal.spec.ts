/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';
import { 
  generateUniqueTitle, 
  cleanupTestDataBeforeTest,
  waitForDatabaseOperation,
  waitForUserContext,
  waitForPageReady
} from './test-utils';

test.describe('Recent Activity Modal', () => {
  test('should display unified recent activity modal with all activity types', async ({ page }) => {
    const testId = Date.now().toString();
    
    // Login
    await page.goto('http://localhost:3000/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });

    // Clean up any existing test data
    await cleanupTestDataBeforeTest(page, testId);

    // Navigate to Fitness dashboard
    await page.goto('http://localhost:3000/fitness');
    await expect(page.getByTestId('home-header')).toBeVisible();

    // Click on the "Recent Activity" button
    await page.getByRole('button', { name: /recent activity/i }).click();
    
    // Verify the modal opens
    await expect(page.getByTestId('recent-activity-modal')).toBeVisible();
    
    // Verify the modal title and subtitle
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
    await expect(page.getByText('View your workouts, cardio sessions, and sports activities')).toBeVisible();
    
    // Verify the "Start New Activity" button is present in the modal
    await expect(page.getByTestId('recent-activity-modal').getByTestId('start-activity-button')).toBeVisible();
    
    // If there are no activities, verify the empty state
    const emptyState = page.getByText('No activities yet');
    const hasActivities = await emptyState.isVisible().catch(() => false);
    
    if (hasActivities) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByText('Start your first activity to begin tracking')).toBeVisible();
    } else {
      // If there are activities, verify the activity list is present
      await expect(page.getByTestId('activity-list')).toBeVisible();
    }
    
    // Close the modal
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.getByTestId('recent-activity-modal')).not.toBeVisible();
  });

  test('should show activity type icons and labels correctly', async ({ page }) => {
    const testId = Date.now().toString();
    
    // Login
    await page.goto('http://localhost:3000/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });

    // Clean up any existing test data
    await cleanupTestDataBeforeTest(page, testId);

    // Create some test activities
    await page.evaluate(async () => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Create a test workout
      await supabase
        .from('fitness_workouts')
        .insert({
          user_id: userId,
          title: 'Test Workout',
          date: today,
          notes: 'Test workout notes',
          in_progress: false,
          status: 'completed'
        });
      
      // Create a test cardio session
      await supabase
        .from('fitness_cardio')
        .insert({
          user_id: userId,
          activity_type: 'Running',
          date: today,
          duration_minutes: 30,
          distance_miles: 3.1,
          location: 'Central Park',
          notes: 'Test cardio session',
          in_progress: false,
          status: 'completed'
        });
      
      // Create a test sports session
      await supabase
        .from('fitness_sports')
        .insert({
          user_id: userId,
          activity_type: 'Basketball',
          date: today,
          duration_minutes: 60,
          location: 'Gym',
          performance_notes: 'Test sports session',
          in_progress: false,
          status: 'completed'
        });
    });

    // Navigate to Fitness dashboard
    await page.goto('http://localhost:3000/fitness');
    await expect(page.getByTestId('home-header')).toBeVisible();

    // Open Recent Activity modal
    await page.getByRole('button', { name: /recent activity/i }).click();
    await expect(page.getByTestId('recent-activity-modal')).toBeVisible();

    // Wait for activities to load
    await page.waitForSelector('[data-testid="activity-list"]', { timeout: 10000 });

    // Verify activity type labels are present in the modal
    await expect(page.getByTestId('recent-activity-modal').getByText('Workout')).toBeVisible();
    await expect(page.getByTestId('recent-activity-modal').getByText('Cardio')).toBeVisible();
    await expect(page.getByTestId('recent-activity-modal').getByText('Sports')).toBeVisible();

    // Verify activity titles are present in the modal
    await expect(page.getByTestId('recent-activity-modal').getByRole('heading', { name: 'Test Workout' })).toBeVisible();
    await expect(page.getByTestId('recent-activity-modal').getByRole('heading', { name: 'Running' })).toBeVisible();
    await expect(page.getByTestId('recent-activity-modal').getByRole('heading', { name: 'Basketball' })).toBeVisible();

    // Verify activity details are present in the modal
    await expect(page.getByTestId('recent-activity-modal').getByText('Test workout notes')).toBeVisible();
    await expect(page.getByTestId('recent-activity-modal').getByText('Central Park')).toBeVisible();
    await expect(page.getByTestId('recent-activity-modal').getByText('Test sports session')).toBeVisible();

    // Close the modal
    await page.getByRole('button', { name: /close/i }).click();
  });

  test('should handle different activity click behaviors correctly', async ({ page }) => {
    const testId = Date.now().toString();
    
    // Login
    await page.goto('http://localhost:3000/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });

    // Clean up any existing test data
    await cleanupTestDataBeforeTest(page, testId);

    // Create a test workout
    await page.evaluate(async () => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      const today = new Date().toISOString().split('T')[0];
      
      // Create a test workout
      await supabase
        .from('fitness_workouts')
        .insert({
          user_id: userId,
          title: 'Test Workout for Details',
          date: today,
          notes: 'Test workout for details modal',
          in_progress: false,
          status: 'completed'
        });
    });

    // Navigate to Fitness dashboard
    await page.goto('http://localhost:3000/fitness');
    await expect(page.getByTestId('home-header')).toBeVisible();

    // Open Recent Activity modal
    await page.getByRole('button', { name: /recent activity/i }).click();
    await expect(page.getByTestId('recent-activity-modal')).toBeVisible();

    // Wait for activities to load
    await page.waitForSelector('[data-testid="activity-list"]', { timeout: 10000 });

    // Click on a workout - should open workout details modal
    await page.getByTestId('recent-activity-modal').getByRole('heading', { name: 'Test Workout for Details' }).click();
    
    // Verify workout details modal opens
    await expect(page.getByTestId('workout-details-modal')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Workout Details' })).toBeVisible();

    // Close the workout details modal
    await page.getByTestId('workout-details-modal').getByRole('button', { name: /close/i }).click();
    await expect(page.getByTestId('workout-details-modal')).not.toBeVisible();

    // Verify we're still in the recent activity modal
    await expect(page.getByTestId('recent-activity-modal')).toBeVisible();

    // Close the recent activity modal
    await page.getByRole('button', { name: /close/i }).click();
  });
});
