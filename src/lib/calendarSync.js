import { supabase } from './supabaseClient';
import { CALENDAR_SOURCES } from './utils/calendarUtils';

/**
 * Creates a calendar event for a given entity type and entity data.
 * @param {string} type - The source type (e.g., 'meal', 'planned_meal', 'workout', etc.)
 * @param {Object} entity - The entity data (should include user_id, id, and relevant fields)
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const createCalendarEventForEntity = async (type, entity) => {
  try {
    let title = '';
    let start_time = '';
    let end_time = null;
    let description = '';
    switch (type) {
      case CALENDAR_SOURCES.MEAL:
        title = `Meal: ${entity.name}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        description = entity.description || '';
        break;
      case CALENDAR_SOURCES.PLANNED_MEAL:
        title = `${entity.meal_time ? entity.meal_time[0].toUpperCase() + entity.meal_time.slice(1) : 'Meal'}: ${entity.meal_name || entity.name || ''}`;
        start_time = entity.planned_date ? new Date(entity.planned_date).toISOString() : new Date().toISOString();
        description = entity.description || '';
        break;
      case CALENDAR_SOURCES.WORKOUT:
        title = `Workout: ${entity.title}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        end_time = entity.end_time ? new Date(entity.end_time).toISOString() : null;
        description = entity.notes || '';
        break;
      case CALENDAR_SOURCES.CARDIO:
        title = `Cardio: ${entity.activity_type}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        end_time = entity.end_time ? new Date(entity.end_time).toISOString() : null;
        description = entity.notes || '';
        break;
      case CALENDAR_SOURCES.SPORT:
        title = `Sport: ${entity.activity_type}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        end_time = entity.end_time ? new Date(entity.end_time).toISOString() : null;
        description = entity.performance_notes || entity.notes || '';
        break;
      case CALENDAR_SOURCES.EXPENSE:
        title = `Expense: ${entity.name} - $${entity.amount}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        description = entity.notes || '';
        break;
      default:
        title = entity.title || 'Event';
        start_time = entity.start_time || new Date().toISOString();
        description = entity.description || '';
    }
    const { error } = await supabase.from('calendar_events').insert([
      {
        user_id: entity.user_id,
        title,
        description,
        start_time,
        end_time,
        source: type,
        source_id: entity.id,
      },
    ]);
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error creating calendar event:', error);
      }
      return error;
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in createCalendarEventForEntity:', error);
    }
    return error;
  }
};

/**
 * Deletes a calendar event for a given source type and source_id.
 * @param {string} type - The source type (e.g., 'meal', 'planned_meal', 'workout', etc.)
 * @param {string|number} source_id - The ID of the source entity
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const deleteCalendarEventForEntity = async (type, source_id) => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('source', type)
      .eq('source_id', source_id);
    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error deleting calendar event:', error);
      }
      return error;
    }
    return null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in deleteCalendarEventForEntity:', error);
    }
    return error;
  }
};

/**
 * Updates a calendar event when the source entity status changes from planned to completed
 * @param {string} type - The source type (e.g., 'workout', 'cardio', 'sport')
 * @param {string|number} source_id - The ID of the source entity
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const updateCalendarEventForCompletedEntity = async (type, source_id) => {
  try {
    // When a planned event is completed, we can either:
    // 1. Delete the calendar event (since it's no longer "planned")
    // 2. Update the calendar event to reflect completion
    // For now, we'll delete it to keep the calendar clean
    return await deleteCalendarEventForEntity(type, source_id);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in updateCalendarEventForCompletedEntity:', error);
    }
    return error;
  }
};

/**
 * Cleans up planned fitness session data when a session is completed
 * This function should be called when a user finishes a session that was started from a planned event
 * @param {string} type - The source type ('workout', 'cardio', 'sport')
 * @param {string} sessionId - The ID of the completed session
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const cleanupPlannedSessionOnCompletion = async (type, sessionId, userId) => {
  try {
    // First, check if this session was originally planned by looking at the calendar event
    const { data: calendarEvent, error: calendarError } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('source', type)
      .eq('source_id', sessionId)
      .maybeSingle();

    if (calendarError) {
      console.error('Error checking calendar event:', calendarError);
      return calendarError;
    }

    // If there's no calendar event, this wasn't a planned session or it was already cleaned up
    if (!calendarEvent) {
      return null;
    }

    // Delete the calendar event since the session is now completed
    const deleteError = await deleteCalendarEventForEntity(type, sessionId);
    if (deleteError) {
      console.error('Error deleting calendar event:', deleteError);
      return deleteError;
    }

    // Ensure the session is marked as completed (not planned)
    const tableMap = {
      'workout': 'fitness_workouts',
      'cardio': 'fitness_cardio',
      'sport': 'fitness_sports'
    };
    
    const table = tableMap[type];
    if (!table) {
      return { error: 'Unknown fitness type' };
    }

    const { error: updateError } = await supabase
      .from(table)
      .update({ 
        status: 'completed',
        in_progress: false 
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating session status:', updateError);
      return updateError;
    }

    return null; // Success
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in cleanupPlannedSessionOnCompletion:', error);
    }
    return error;
  }
}; 