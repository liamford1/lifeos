import { supabase } from './supabaseClient'

export const addCalendarEvent = async ({
  userId,
  title,
  description = '',
  startTime,
  endTime = null,
  source,
  sourceId,
}) => {
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
    console.error('Error adding calendar event:', error.message);
  }
}
