import { supabase } from './supabaseClient';

/**
 * Deletes a workout and all its child data (exercises, sets, calendar event) safely.
 * @param {Object} params - The parameters for deletion
 * @param {string} params.workoutId - The ID of the workout to delete
 * @param {string} params.user_id - The user ID for the entity
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const deleteWorkoutCascade = async ({ workoutId, user_id }) => {
  try {
    // 1. Get all exercises for the workout
    const { data: exercises, error: exError } = await supabase
      .from('fitness_exercises')
      .select('id')
      .eq('workout_id', workoutId);
    if (exError) {
      console.error('Error fetching exercises:', exError);
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
        console.error('Error deleting sets:', setsError);
        return setsError;
      }
    }

    // 3. Delete all exercises for the workout
    const { error: delExError } = await supabase
      .from('fitness_exercises')
      .delete()
      .eq('workout_id', workoutId);
    if (delExError) {
      console.error('Error deleting exercises:', delExError);
      return delExError;
    }

    // 4. Delete the workout itself
    const { error: workoutError } = await supabase
      .from('fitness_workouts')
      .delete()
      .eq('id', workoutId)
      .eq('user_id', user_id);
    if (workoutError) {
      console.error('Error deleting workout:', workoutError);
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
      console.error('Error deleting calendar event:', calendarError);
      return calendarError;
    }

    console.log(`✅ Successfully deleted workout ${workoutId} and all child data.`);
    return null;
  } catch (error) {
    console.error('Unexpected error in deleteWorkoutCascade:', error);
    return error;
  }
};

/**
 * Deletes an entity from the specified table and also deletes its corresponding calendar event
 * @param {Object} params - The parameters for deletion
 * @param {string} params.table - The table name to delete from
 * @param {string|number} params.id - The ID of the entity to delete
 * @param {string} params.user_id - The user ID for the entity
 * @param {string} params.source - The source type for calendar events (e.g., "workout", "cardio", "meal", etc.)
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const deleteEntityWithCalendarEvent = async ({ table, id, user_id, source }) => {
  try {
    // First, delete the calendar event if it exists
    const { error: calendarError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('source', source)
      .eq('source_id', id)
      .eq('user_id', user_id);

    if (calendarError) {
      console.error('Error deleting calendar event:', calendarError);
      return calendarError;
    }

    // Then, delete the entity from the specified table
    const { error: entityError } = await supabase
      .from(table)
      .delete()
      .eq('id', id)
      .eq('user_id', user_id);

    if (entityError) {
      console.error('Error deleting entity:', entityError);
      return entityError;
    }

    console.log(`✅ Successfully deleted ${source} with ID ${id} and its calendar event`);
    return null; // Success
  } catch (error) {
    console.error('Unexpected error in deleteEntityWithCalendarEvent:', error);
    return error;
  }
}; 