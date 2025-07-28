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