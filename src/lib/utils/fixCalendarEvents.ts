import { supabase } from '../supabaseClient';
import type { CalendarSource } from './calendarUtils';

interface CalendarEvent {
  id: string;
  source: CalendarSource;
  title: string;
  created_at: string;
}

interface EventUpdate {
  id: string;
  source: CalendarSource;
}

interface SourceCounts {
  [source: string]: number;
}

interface SourceExamples {
  [source: string]: string[];
}

/**
 * Utility to check and fix existing calendar events that might have incorrect source types
 * This is a one-time fix for existing data
 */
export const checkAndFixCalendarEvents = async (): Promise<void> => {
  try {
    // Get all calendar events
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('*')
      .order('created_at');

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error fetching calendar events:', error);
      }
      return;
    }

    // Check for events that might be planned meals but have wrong source
    const eventsToUpdate: EventUpdate[] = [];
    
    for (const event of events as CalendarEvent[]) {
      // If the title contains "Dinner:", "Lunch:", "Breakfast:", "Snack:" and source is 'meal'
      // it's likely a planned meal that should have source 'planned_meal'
      if (event.source === 'meal' && 
          (event.title.includes('Dinner:') || 
           event.title.includes('Lunch:') || 
           event.title.includes('Breakfast:') || 
           event.title.includes('Snack:'))) {
        
        eventsToUpdate.push({
          id: event.id,
          source: 'planned_meal'
        });
      }
    }

    if (eventsToUpdate.length > 0) {
      
      for (const update of eventsToUpdate) {
        const { error: updateError } = await supabase
          .from('calendar_events')
          .update({ source: update.source })
          .eq('id', update.id);
        
        if (updateError) {
          if (process.env.NODE_ENV !== "production") {
            console.error('❌ Error updating event', update.id, ':', updateError);
          }
        }
      }
    }

  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error:', error);
    }
  }
};

/**
 * Check what source types exist in the database
 */
export const checkSourceTypes = async (): Promise<void> => {
  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select('source, title')
      .order('created_at');

    if (error) {
      if (process.env.NODE_ENV !== "production") {
        console.error('Error fetching calendar events:', error);
      }
      return;
    }

    const sourceCounts: SourceCounts = {};
    events?.forEach((event: { source: string; title: string }) => {
      sourceCounts[event.source] = (sourceCounts[event.source] || 0) + 1;
    });

    // Show some examples of each source type
    const examples: SourceExamples = {};
    events?.forEach((event: { source: string; title: string }) => {
      if (!examples[event.source]) {
        examples[event.source] = [];
      }
      const sourceExamples = examples[event.source];
      if (sourceExamples && sourceExamples.length < 3) {
        sourceExamples.push(event.title);
      }
    });

  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error('Unexpected error:', error);
    }
  }
};
