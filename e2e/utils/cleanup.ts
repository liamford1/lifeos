import { Page } from '@playwright/test';

/**
 * Clean up test data by prefix for the current authenticated user
 */
export async function cleanupByPrefix(page: Page, table: string, nameField: string, prefix: string): Promise<void> {
  await page.evaluate(async ({ table, nameField, prefix }) => {
    const supabase = window.supabase;
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.user?.id) return;

    const userId = session.session.user.id;
    
    // Delete records that match the prefix for this user
    await supabase
      .from(table)
      .delete()
      .eq('user_id', userId)
      .like(nameField, `${prefix}%`);
  }, { table, nameField, prefix });
}

/**
 * Clean up calendar events by title prefix for the current authenticated user
 */
export async function cleanupCalendarEventsByPrefix(page: Page, prefix: string): Promise<void> {
  await cleanupByPrefix(page, 'calendar_events', 'title', prefix);
}

/**
 * Clean up meals by name prefix for the current authenticated user
 */
export async function cleanupMealsByPrefix(page: Page, prefix: string): Promise<void> {
  await cleanupByPrefix(page, 'meals', 'name', prefix);
}

/**
 * Clean up workouts by title prefix for the current authenticated user
 */
export async function cleanupWorkoutsByPrefix(page: Page, prefix: string): Promise<void> {
  await cleanupByPrefix(page, 'fitness_workouts', 'title', prefix);
}

/**
 * Clean up receipts by store_name prefix for the current authenticated user
 */
export async function cleanupReceiptsByPrefix(page: Page, prefix: string): Promise<void> {
  await cleanupByPrefix(page, 'receipts', 'store_name', prefix);
}
