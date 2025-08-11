import { supabase } from '../supabaseClient';
import type { CalendarSource } from './calendarUtils';

interface DeleteWorkoutCascadeParams {
  workoutId: string;
  user_id: string;
}

interface DeleteEntityWithCalendarEventParams {
  table: string;
  id: string | number;
  user_id: string;
  source: CalendarSource;
}

/**
 * Deletes a workout and all its child data (exercises, sets, calendar event) safely.
 * @param params - The parameters for deletion
 * @param params.workoutId - The ID of the workout to delete
 * @param params.user_id - The user ID for the entity
 * @returns Returns any Supabase error encountered or null on success
 */
export const deleteWorkoutCascade = async ({ 
  workoutId, 
  user_id 
}: DeleteWorkoutCascadeParams): Promise<Error | null> => {
  try {
    // 1. Get all exercises for the workout
    const { data: exercises, error: exError } = await supabase
      .from('fitness_exercises')
      .select('id')
      .eq('workout_id', workoutId);
    if (exError) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error fetching exercises:', exError);
      }
      return exError;
    }
    const exerciseIds = exercises?.map(e => e.id) || [];

    // 2. Delete all sets for those exercises
    if (exerciseIds.length > 0) {
      const { error: setsError } = await supabase
        .from('fitness_sets')
        .delete()
        .in('exercise_id', exerciseIds);
      if (setsError) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Error deleting sets:', setsError);
        }
        return setsError;
      }
    }

    // 3. Delete all exercises for the workout
    const { error: delExError } = await supabase
      .from('fitness_exercises')
      .delete()
      .eq('workout_id', workoutId);
    if (delExError) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error deleting exercises:', delExError);
      }
      return delExError;
    }

    // 4. Delete the workout itself
    const { error: workoutError } = await supabase
      .from('fitness_workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', user_id);
    if (workoutError) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error deleting workout:', workoutError);
      }
      return workoutError;
    }

    // 5. Delete the calendar event if it exists
    const { error: calendarError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('source', 'workout')
      .eq('source_id', workoutId)
      .eq('user_id', user_id);
    if (calendarError) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error deleting calendar event:', calendarError);
      }
      return calendarError;
    }

    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in deleteWorkoutCascade:', error);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
};

/**
 * Deletes an entity from the specified table and also deletes its corresponding calendar event
 * @param params - The parameters for deletion
 * @param params.table - The table name to delete from
 * @param params.id - The ID of the entity to delete
 * @param params.user_id - The user ID for the entity
 * @param params.source - The source type for calendar events (e.g., "workout", "cardio", "meal", etc.)
 * @returns Returns any Supabase error encountered or null on success
 */
export const deleteEntityWithCalendarEvent = async ({ 
  table, 
  id, 
  user_id, 
  source 
}: DeleteEntityWithCalendarEventParams): Promise<Error | null> => {
  try {
    // First, delete the calendar event if it exists
    // Ensure id is a string for the query
    const sourceId = String(id);
    
    const { error: calendarError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('source', source)
      .eq('source_id', sourceId)
      .eq('user_id', user_id);

    if (calendarError) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error deleting calendar event:', calendarError);
      }
      return calendarError;
    }

    // Then, delete the entity from the specified table
    // Ensure id is a string for the query
    const entityId = String(id);
    
    const { error: entityError } = await supabase
      .from(table)
      .delete()
      .eq('id', entityId)
      .eq('user_id', user_id);

    if (entityError) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error deleting entity:', entityError);
      }
      return entityError;
    }

    return null; // Success
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in deleteEntityWithCalendarEvent:', error);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
};
