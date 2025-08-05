import { Page } from '@playwright/test';

// Utility functions for generating unique test data
export function generateUniqueId(prefix: string = 'test'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateUniqueTitle(baseTitle: string): string {
  return `${baseTitle} ${Date.now()}`;
}

export function generateUniqueActivityType(baseType: string): string {
  return `${baseType} ${Date.now()}`;
}

export function generateUniqueMealName(baseName: string): string {
  return `${baseName} ${Date.now()}`;
}

export function generateUniqueFoodName(baseName: string): string {
  return `${baseName} ${Date.now()}`;
}

// Cleanup functions for different data types
export async function cleanupTestWorkout(page: Page, workoutTitle: string) {
  await page.evaluate(async (title) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Get all workouts that contain the title (for partial matches)
    const { data: workouts } = await supabase
      .from('fitness_workouts')
      .select('id, title')
      .eq('user_id', userId)
      .ilike('title', `%${title}%`);
    
    if (workouts && workouts.length > 0) {
      for (const workout of workouts) {
        // Delete exercises first
        await supabase
          .from('fitness_exercises')
          .delete()
          .eq('workout_id', workout.id);
        
        // Delete the workout
        await supabase
          .from('fitness_workouts')
          .delete()
          .eq('id', workout.id);
        
        // Delete related calendar events
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('title', `Workout: ${workout.title}`);
      }
    }
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }, workoutTitle);
}

export async function cleanupTestCardio(page: Page, activityType: string) {
  await page.evaluate(async (type) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Delete the cardio session
    await supabase
      .from('fitness_cardio')
      .delete()
      .eq('user_id', userId)
      .eq('activity_type', type);
    
    // Delete related calendar events
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .eq('title', `Cardio: ${type}`);
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }, activityType);
}

export async function cleanupTestSports(page: Page, activityType: string) {
  await page.evaluate(async (type) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Delete all sports sessions that contain the activity type (for partial matches)
    const { data: sportsSessions } = await supabase
      .from('fitness_sports')
      .select('id, activity_type')
      .eq('user_id', userId)
      .ilike('activity_type', `%${type}%`);
    
    if (sportsSessions && sportsSessions.length > 0) {
      const sessionIds = sportsSessions.map((s: any) => s.id);
      
      // Delete the sports sessions
      await supabase
        .from('fitness_sports')
        .delete()
        .in('id', sessionIds);
      
      // Delete related calendar events
      for (const session of sportsSessions) {
        await supabase
          .from('calendar_events')
          .delete()
          .eq('user_id', userId)
          .eq('title', `Sport: ${session.activity_type}`);
      }
    }
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }, activityType);
}

export async function cleanupTestMeal(page: Page, mealName: string) {
  await page.evaluate(async (name) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Delete the meal
    await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId)
      .eq('name', name);
    
    // Delete related planned meals
    await supabase
      .from('planned_meals')
      .delete()
      .eq('user_id', userId);
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }, mealName);
}

export async function cleanupTestFoodItem(page: Page, foodName: string) {
  await page.evaluate(async (name) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Delete the food item
    await supabase
      .from('food_items')
      .delete()
      .eq('user_id', userId)
      .eq('name', name);
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }, foodName);
}

export async function cleanupTestReceipt(page: Page, receiptId: string) {
  await page.evaluate(async (id) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Delete receipt items first
    await supabase
      .from('receipt_items')
      .delete()
      .eq('receipt_id', id);
    
    // Delete the receipt
    await supabase
      .from('receipts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 500));
  }, receiptId);
}

// Pre-test cleanup functions (clean up any leftover test data)
export async function cleanupTestDataBeforeTest(page: Page, testId: string) {
  await page.evaluate(async (id) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    // Clean up any test data that might have been left from previous failed runs
    // This uses the testId pattern to identify test data
    
    // Clean up workouts with test pattern
    await supabase
      .from('fitness_workouts')
      .delete()
      .eq('user_id', userId)
      .like('title', `%${id}%`);
    
    // Clean up cardio with test pattern
    await supabase
      .from('fitness_cardio')
      .delete()
      .eq('user_id', userId)
      .like('activity_type', `%${id}%`);
    
    // Clean up sports with test pattern
    await supabase
      .from('fitness_sports')
      .delete()
      .eq('user_id', userId)
      .like('activity_type', `%${id}%`);
    
    // Clean up meals with test pattern
    await supabase
      .from('meals')
      .delete()
      .eq('user_id', userId)
      .like('name', `%${id}%`);
    
    // Clean up food items with test pattern
    await supabase
      .from('food_items')
      .delete()
      .eq('user_id', userId)
      .like('name', `%${id}%`);
    
    // Clean up related calendar events
    await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId)
      .or(`title.like.%${id}%,description.like.%${id}%`);
    
    // Small delay to ensure cleanup completes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }, testId);
}

// Helper function to wait for database operations to complete
export async function waitForDatabaseOperation(page: Page, delayMs: number = 500) {
  await page.waitForTimeout(delayMs);
}

// Helper function to retry database operations with exponential backoff
export async function retryDatabaseOperation<T>(
  page: Page, 
  operation: () => Promise<T>, 
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`[E2E] Database operation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`[E2E] Retrying in ${delay}ms...`);
        await page.waitForTimeout(delay);
      }
    }
  }
  
  throw lastError!;
}

// Helper function to verify test data was created
export async function verifyTestDataExists(page: Page, table: string, conditions: Record<string, any>): Promise<boolean> {
  return await page.evaluate(async ({ table, conditions }) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    const userId = session.session.user.id;
    
    let query = supabase.from(table).select('*').eq('user_id', userId);
    
    // Add additional conditions
    Object.entries(conditions).forEach(([key, value]) => {
      query = query.eq(key, value);
    });
    
    const { data, error } = await query;
    
    if (error) {
      console.error(`Error checking ${table}:`, error);
      return false;
    }
    
    return data && data.length > 0;
  }, { table, conditions });
}

/**
 * Wait for user context to be ready and page to be fully loaded
 * This ensures the authentication state is properly established before proceeding
 */
export async function waitForUserContext(page: Page, timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check if supabase is available and user is authenticated
      const isReady = await page.evaluate(async () => {
        if (!window.supabase) {
          console.log('[E2E] window.supabase not available yet');
          return false;
        }
        
        try {
          const { data: session } = await window.supabase.auth.getSession();
          if (!session?.session?.user) {
            console.log('[E2E] No user session available yet');
            return false;
          }
          
          console.log('[E2E] ✅ User context is ready');
          return true;
        } catch (error) {
          console.log('[E2E] Error checking session:', error);
          return false;
        }
      });
      
      if (isReady) {
        return;
      }
    } catch (error) {
      console.log('[E2E] Error in waitForUserContext:', error);
    }
    
    await page.waitForTimeout(500);
  }
  
  throw new Error(`User context not ready after ${timeoutMs}ms`);
}

/**
 * Helper function to handle API errors and retry with proper authentication
 */
export async function handleApiError(page: Page, error: any): Promise<void> {
  console.log('[E2E] API Error encountered:', error);
  
  // If it's a 406 error, it might be an authentication issue
  if (error?.message?.includes('406') || error?.status === 406) {
    console.log('[E2E] 406 error detected, attempting to refresh authentication...');
    
    try {
      await page.evaluate(async () => {
        const supabase = window.supabase;
        if (supabase) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.log('[E2E] Session refresh failed:', refreshError);
          } else {
            console.log('[E2E] Session refreshed successfully');
          }
        }
      });
      
      // Wait a bit for the refresh to take effect
      await page.waitForTimeout(1000);
    } catch (refreshError) {
      console.log('[E2E] Error during session refresh:', refreshError);
    }
  }
}

/**
 * Wait for a specific page to be fully loaded with data
 * This waits for either the data list, empty state, or loading state to be present
 */
export async function waitForPageReady(page: Page, pageType: 'workouts' | 'sports', timeoutMs: number = 10000): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check for any of the expected states
      const pageState = await page.evaluate((type) => {
        const listSelector = `[data-testid="${type}-list"]`;
        const loadingSelector = `[data-testid="${type}-loading"]`;
        const emptySelector = `[data-testid="${type}-empty"]`;
        const noUserSelector = `[data-testid="${type}-no-user"]`;
        
        const list = document.querySelector(listSelector);
        const loading = document.querySelector(loadingSelector);
        const empty = document.querySelector(emptySelector);
        const noUser = document.querySelector(noUserSelector);
        
        return {
          list: !!list,
          loading: !!loading,
          empty: !!empty,
          noUser: !!noUser,
          anyReady: !!(list || loading || empty || noUser)
        };
      }, pageType);
      
      if (pageState.anyReady) {
        console.log(`[E2E] ✅ ${pageType} page is ready:`, pageState);
        return;
      }
      
      // Log the current state for debugging
      if (Date.now() - startTime > 5000) { // Only log after 5 seconds to avoid spam
        console.log(`[E2E] ⏳ ${pageType} page state:`, pageState);
        
        // Also log what's actually on the page
        const pageContent = await page.evaluate(() => {
          const body = document.body.textContent;
          const h1s = Array.from(document.querySelectorAll('h1')).map(h => h.textContent);
          const h2s = Array.from(document.querySelectorAll('h2')).map(h => h.textContent);
          return { body: body?.substring(0, 200), h1s, h2s };
        });
        console.log(`[E2E] 📄 ${pageType} page content:`, pageContent);
      }
    } catch (error) {
      console.log(`[E2E] ⚠️ Error checking ${pageType} page state:`, error);
    }
    
    await page.waitForTimeout(100);
  }
  
  throw new Error(`${pageType} page not ready within ${timeoutMs}ms`);
} 