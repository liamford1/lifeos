import { supabase } from '../supabaseClient';
import dayjs from 'dayjs';

// Constants for consistent source values
export const CALENDAR_SOURCES = {
  MEAL: 'meal',
  PLANNED_MEAL: 'planned_meal',
  WORKOUT: 'workout',
  CARDIO: 'cardio',
  SPORT: 'sport',
  STRETCHING: 'stretching',
  EXPENSE: 'expense',
  NOTE: 'note'
} as const;

export type CalendarSource = typeof CALENDAR_SOURCES[keyof typeof CALENDAR_SOURCES];

/**
 * Returns the route path for a calendar event based on its source and source_id
 * @param source - The source type (e.g., 'meal', 'workout', etc.)
 * @param source_id - The ID of the source entity
 * @returns The relative path for routing to the source entity
 */
export const getCalendarEventRoute = (source: CalendarSource, source_id: string | number): string => {
  switch (source) {
    case CALENDAR_SOURCES.MEAL:
      return `/food` // Meals now use modals instead of pages, so redirect to food page
    case CALENDAR_SOURCES.PLANNED_MEAL:
      return `/food` // Redirect to food page since planning is now done via modal
    case CALENDAR_SOURCES.WORKOUT:
      return `/fitness` // Redirect to fitness page since workout details are now in modal
    case CALENDAR_SOURCES.CARDIO:
      return `/fitness` // Redirect to fitness page since cardio details are now in modal
    case CALENDAR_SOURCES.SPORT:
      return `/fitness/sports/${source_id}`
    case CALENDAR_SOURCES.STRETCHING:
      return `/fitness` // Redirect to fitness page since stretching details are now in modal
    case CALENDAR_SOURCES.EXPENSE:
      return `/finances/expenses/${source_id}`
    case CALENDAR_SOURCES.NOTE:
      return `/scratchpad` // Notes don't have individual pages, redirect to scratchpad
    default:
      return '/'
  }
}

interface CalendarEventUpdateFields {
  title?: string;
  start_time?: string;
  end_time?: string | null;
  description?: string;
  [key: string]: any;
}

/**
 * Updates a calendar event when an entity is edited
 * @param source - The source type (e.g., 'meal', 'workout', etc.)
 * @param source_id - The ID of the source entity
 * @param title - The new title for the calendar event
 * @param startTime - The new start time (ISO string)
 * @param endTime - The new end time (ISO string, optional)
 * @returns Returns any Supabase error encountered or null on success
 */
export const updateCalendarEvent = async (
  source: CalendarSource, 
  source_id: string | number, 
  title: string, 
  startTime: string, 
  endTime: string | null = null
): Promise<any | null> => {
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
 * @param source - The source type (e.g., 'meal', 'workout', etc.)
 * @param source_id - The ID of the source entity
 * @param updatedFields - Fields to update (e.g., { title, start_time, end_time, description })
 * @returns Returns any Supabase error encountered or null on success
 */
export const updateCalendarEventFromSource = async (
  source: CalendarSource, 
  source_id: string | number, 
  updatedFields: CalendarEventUpdateFields
): Promise<any | null> => {
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

interface AddCalendarEventParams {
  userId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime?: string | null;
  source: CalendarSource;
  sourceId: string | number;
}

export const addCalendarEvent = async ({
  userId,
  title,
  description = '',
  startTime,
  endTime = null,
  source,
  sourceId,
}: AddCalendarEventParams): Promise<any | null> => {
  // Validate source value
  const validSources = Object.values(CALENDAR_SOURCES);
  if (!validSources.includes(source)) {
    return { error: `Invalid source value: ${source}` };
  }

  // Set default end time to 1 hour after start time if not provided
  let finalEndTime = endTime;
  if (!finalEndTime && startTime) {
    finalEndTime = dayjs(startTime).add(1, 'hour').toISOString();
  }

  const { error } = await supabase.from('calendar_events').insert([
    {
      user_id: userId,
      title,
      description,
      start_time: startTime,
      end_time: finalEndTime,
      source,
      source_id: sourceId,
    },
  ]);

  if (error) {
    return error;
  }

  return null;
}
