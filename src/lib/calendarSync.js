import { supabase } from './supabaseClient';
import { CALENDAR_SOURCES } from './calendarUtils';

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
        description = entity.notes || '';
        break;
      case CALENDAR_SOURCES.CARDIO:
        title = `Cardio: ${entity.activity_type}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        description = entity.notes || '';
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