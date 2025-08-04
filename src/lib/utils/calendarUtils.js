import { supabase } from '../supabaseClient'

// Constants for consistent source values
export const CALENDAR_SOURCES = {
  MEAL: 'meal',
  PLANNED_MEAL: 'planned_meal',
  WORKOUT: 'workout',
  CARDIO: 'cardio',
  SPORT: 'sport',
  EXPENSE: 'expense',
  NOTE: 'note'
}

/**
 * Returns the route path for a calendar event based on its source and source_id
 * @param {string} source - The source type (e.g., 'meal', 'workout', etc.)
 * @param {string|number} source_id - The ID of the source entity
 * @returns {string} The relative path for routing to the source entity
 */
export const getCalendarEventRoute = (source, source_id) => {
  switch (source) {
    case CALENDAR_SOURCES.MEAL:
      return `/food/meals/${source_id}/cook`
    case CALENDAR_SOURCES.PLANNED_MEAL:
      return `/food` // Redirect to food page since planning is now done via modal
    case CALENDAR_SOURCES.WORKOUT:
      return `/fitness/workouts/${source_id}`
    case CALENDAR_SOURCES.CARDIO:
      return `/fitness/cardio/${source_id}`
    case CALENDAR_SOURCES.SPORT:
      return `/fitness/sports/${source_id}`
    case CALENDAR_SOURCES.EXPENSE:
      return `/finances/expenses/${source_id}`
    case CALENDAR_SOURCES.NOTE:
      return `/scratchpad` // Notes don't have individual pages, redirect to scratchpad
    default:
      return '/'
  }
}

/**
 * Updates a calendar event when an entity is edited
 * @param {string} source - The source type (e.g., 'meal', 'workout', etc.)
 * @param {string|number} source_id - The ID of the source entity
 * @param {string} title - The new title for the calendar event
 * @param {string} startTime - The new start time (ISO string)
 * @param {string|null} endTime - The new end time (ISO string, optional)
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const updateCalendarEvent = async (source, source_id, title, startTime, endTime = null) => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .update({
        title,
        start_time: startTime,
        end_time: endTime,
      })
      .eq('source', source)
      .eq('source_id', source_id);

    if (error) {
      return error;
    }

    return null; // Success
  } catch (error) {
    return error;
  }
}

/**
 * Updates a calendar event for a given source and source_id with arbitrary fields.
 * @param {string} source - The source type (e.g., 'meal', 'workout', etc.)
 * @param {string|number} source_id - The ID of the source entity
 * @param {Object} updatedFields - Fields to update (e.g., { title, start_time, end_time, description })
 * @returns {Promise<Object|null>} - Returns any Supabase error encountered or null on success
 */
export const updateCalendarEventFromSource = async (source, source_id, updatedFields) => {
  try {
    const { error } = await supabase
      .from('calendar_events')
      .update(updatedFields)
      .eq('source', source)
      .eq('source_id', source_id);

    if (error) {
      return error;
    }
    return null;
  } catch (error) {
    return error;
  }
}

export const addCalendarEvent = async ({
  userId,
  title,
  description = '',
  startTime,
  endTime = null,
  source,
  sourceId,
}) => {
  // Validate source value
  const validSources = Object.values(CALENDAR_SOURCES)
  if (!validSources.includes(source)) {
    return { error: `Invalid source value: ${source}` }
  }

  const { error } = await supabase.from('calendar_events').insert([
    {
      user_id: userId,
      title,
      description,
      start_time: startTime,
      end_time: endTime,
      source,
      source_id: sourceId,
    },
  ]);

  if (error) {
    return error;
  }
}
