import { supabase } from './supabaseClient';
import { CALENDAR_SOURCES, type CalendarSource } from './utils/calendarUtils';
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/calendar';

interface EntityData {
  user_id: string;
  id: string | number;
  name?: string;
  title?: string;
  date?: string;
  planned_date?: string;
  meal_time?: string;
  meal_name?: string;
  description?: string;
  notes?: string;
  performance_notes?: string;
  amount?: number;
  start_time?: string;
  end_time?: string;
  activity_type?: string;
}

/**
 * Creates a calendar event for a given entity type and entity data.
 * @param type - The source type (e.g., 'meal', 'planned_meal', 'workout', etc.)
 * @param entity - The entity data (should include user_id, id, and relevant fields)
 * @returns Returns any Supabase error encountered or null on success
 */
export const createCalendarEventForEntity = async (
  type: CalendarSource, 
  entity: EntityData
): Promise<any | null> => {
  try {
    let title = '';
    let start_time = '';
    let end_time: string | null = null;
    let description = '';
    
    switch (type) {
      case CALENDAR_SOURCES.MEAL:
        title = `Meal: ${entity.name}`;
        start_time = entity.date ? new Date(entity.date).toISOString() : new Date().toISOString();
        description = entity.description || '';
        break;
      case CALENDAR_SOURCES.PLANNED_MEAL:
        let mealTimeDisplay = 'Meal';
        const mealTime = entity.meal_time;
        if (mealTime && typeof mealTime === 'string' && mealTime.length > 0) {
          const firstChar = mealTime.charAt(0);
          const rest = mealTime.substring(1);
          mealTimeDisplay = firstChar.toUpperCase() + rest;
        }
        title = `${mealTimeDisplay}: ${entity.meal_name || entity.name || ''}`;
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
    
    // Set default end time to 1 hour after start time if not provided
    let finalEndTime = end_time;
    if (!finalEndTime && start_time) {
      finalEndTime = dayjs(start_time).add(1, 'hour').toISOString();
    }

    const { error } = await supabase.from('calendar_events').insert([
      {
        user_id: entity.user_id,
        title,
        description,
        start_time,
        end_time: finalEndTime,
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
 * Updates a linked entity when its calendar event is rescheduled
 * @param event - The calendar event with updated start_time/end_time
 * @returns Returns any Supabase error encountered or null on success
 */
export const updateLinkedEntityOnCalendarChange = async (event: CalendarEvent): Promise<any | null> => {
  try {
    const newDate = new Date(event.start_time);
    const newDateStr = newDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    switch (event.source) {
      case CALENDAR_SOURCES.MEAL:
        // Update meal date
        const { error: mealError } = await supabase
          .from('meals')
          .update({ date: newDateStr })
          .eq('id', event.source_id)
          .eq('user_id', event.user_id);
        if (mealError) return mealError;
        break;
        
      case CALENDAR_SOURCES.PLANNED_MEAL:
        // Update planned meal date
        const { error: plannedMealError } = await supabase
          .from('planned_meals')
          .update({ planned_date: newDateStr })
          .eq('id', event.source_id)
          .eq('user_id', event.user_id);
        if (plannedMealError) return plannedMealError;
        break;
        
      case CALENDAR_SOURCES.WORKOUT:
        // Update workout date and times
        const workoutUpdate: any = { date: newDateStr };
        if (event.end_time) {
          workoutUpdate.start_time = event.start_time;
          workoutUpdate.end_time = event.end_time;
        }
        const { error: workoutError } = await supabase
          .from('fitness_workouts')
          .update(workoutUpdate)
          .eq('id', event.source_id)
          .eq('user_id', event.user_id);
        if (workoutError) return workoutError;
        break;
        
      case CALENDAR_SOURCES.CARDIO:
        // Update cardio date and times
        const cardioUpdate: any = { date: newDateStr };
        if (event.end_time) {
          cardioUpdate.start_time = event.start_time;
          cardioUpdate.end_time = event.end_time;
        }
        const { error: cardioError } = await supabase
          .from('fitness_cardio')
          .update(cardioUpdate)
          .eq('id', event.source_id)
          .eq('user_id', event.user_id);
        if (cardioError) return cardioError;
        break;
        
      case CALENDAR_SOURCES.SPORT:
        // Update sport date and times
        const sportUpdate: any = { date: newDateStr };
        if (event.end_time) {
          sportUpdate.start_time = event.start_time;
          sportUpdate.end_time = event.end_time;
        }
        const { error: sportError } = await supabase
          .from('fitness_sports')
          .update(sportUpdate)
          .eq('id', event.source_id)
          .eq('user_id', event.user_id);
        if (sportError) return sportError;
        break;
        
      case CALENDAR_SOURCES.EXPENSE:
        // Update expense date
        const { error: expenseError } = await supabase
          .from('expenses')
          .update({ date: newDateStr })
          .eq('id', event.source_id)
          .eq('user_id', event.user_id);
        if (expenseError) return expenseError;
        break;
        
      default:
        // Unknown source type, don't update anything
        return null;
    }
    
    return null; // Success
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error in updateLinkedEntityOnCalendarChange:', error);
    }
    return error;
  }
};

/**
 * Deletes a calendar event for a given source type and source_id.
 * @param type - The source type (e.g., 'meal', 'planned_meal', 'workout', etc.)
 * @param source_id - The ID of the source entity
 * @returns Returns any Supabase error encountered or null on success
 */
export const deleteCalendarEventForEntity = async (
  type: CalendarSource, 
  source_id: string | number
): Promise<any | null> => {
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
 * @param type - The source type (e.g., 'workout', 'cardio', 'sport')
 * @param source_id - The ID of the source entity
 * @returns Returns any Supabase error encountered or null on success
 */
export const updateCalendarEventForCompletedEntity = async (
  type: CalendarSource, 
  source_id: string | number
): Promise<any | null> => {
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
 * @param type - The source type ('workout', 'cardio', 'sport')
 * @param sessionId - The ID of the completed session
 * @param userId - The user ID
 * @returns Returns any Supabase error encountered or null on success
 */
export const cleanupPlannedSessionOnCompletion = async (
  type: CalendarSource, 
  sessionId: string, 
  userId: string
): Promise<any | null> => {
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
    const tableMap: Record<CalendarSource, string> = {
      'workout': 'fitness_workouts',
      'cardio': 'fitness_cardio',
      'sport': 'fitness_sports',
      'meal': 'meals',
      'planned_meal': 'planned_meals',
      'stretching': 'fitness_stretching',
      'expense': 'expenses',
      'note': 'scratchpad_notes'
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
