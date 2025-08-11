import { supabase } from '../supabaseClient';
import { updateLinkedEntityOnCalendarChange } from "@/lib/calendarSync";
import dayjs from 'dayjs';
import type { CalendarEvent } from '@/types/calendar';

export async function listEvents(userId: string): Promise<CalendarEvent[]> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId)
    .order("start_time", { ascending: true });
  
  if (error) throw error;
  return data || [];
}

export async function insertEvent(event: CalendarEvent): Promise<void> {
  // Set default end time to 1 hour after start time if not provided
  const finalEvent = { ...event };
  if (!finalEvent.end_time && finalEvent.start_time) {
    finalEvent.end_time = dayjs(finalEvent.start_time).add(1, 'hour').toISOString();
  }

  const { error } = await supabase.from("calendar_events").insert([finalEvent]);
  if (error) throw error;
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

export async function updateEvent({ 
  id, 
  userId, 
  newStart, 
  newEnd, 
  updateLinkedEntity = false 
}: {
  id: string;
  userId: string;
  newStart: string;
  newEnd?: string;
  updateLinkedEntity?: boolean;
}): Promise<{ event: CalendarEvent; linkedEntityUpdated: boolean }> {
  // First, get the current event to check if we need to update linked entity
  const { data: currentEvent, error: fetchError } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError) throw fetchError;
  if (!currentEvent) throw new Error("Event not found");

  // Update the calendar event
  const updateData: Record<string, string> = {
    start_time: newStart,
    updated_at: new Date().toISOString()
  };
  
  if (newEnd !== undefined) {
    updateData['end_time'] = newEnd;
  }

  const { data: updatedEvent, error: updateError } = await supabase
    .from("calendar_events")
    .update(updateData)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) throw updateError;

  // Update linked entity if requested
  let linkedEntityUpdated = false;
  
  if (updateLinkedEntity && currentEvent.source && currentEvent.source_id) {
    const finalEndTime = newEnd !== undefined ? newEnd : (currentEvent.end_time || dayjs(newStart).add(1, 'hour').toISOString());
    const linkedEntityError = await updateLinkedEntityOnCalendarChange({
      ...currentEvent,
      start_time: newStart,
      end_time: finalEndTime
    });
    
    if (!linkedEntityError) {
      linkedEntityUpdated = true;
    }
  }

  return {
    event: updatedEvent,
    linkedEntityUpdated
  };
} 