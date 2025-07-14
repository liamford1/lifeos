import { supabase } from './supabaseClient';

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