"use client";

import React, { useState } from "react";
import Button from "@/components/shared/Button";
import { useApiError } from '@/lib/hooks/useApiError';
import { useQueryClient } from "@tanstack/react-query";
import { getEventStyle } from '@/lib/utils/eventStyleMap';
import dayjs from 'dayjs';
import { 
  EventManagerProps, 
  WorkoutCalendarEvent, 
  NewEventFormData,
  CalendarEventInsertPayload
} from '@/types/fitness';

/**
 * EventManager Component
 * 
 * Handles the add event modal and day events modal for calendar management.
 * Extracted from PlanWorkoutModal.js to provide focused event management.
 * 
 * Features:
 * - Add new calendar events
 * - View events for specific days
 * - Event click handling
 * - Form validation and submission
 * 
 * @param user - Current user object
 * @param isAddModalOpen - Controls add event modal visibility
 * @param isDayEventsModalOpen - Controls day events modal visibility
 * @param selectedDayForEvents - Selected day for viewing events
 * @param fitnessEvents - Array of fitness calendar events
 * @param onAddEventClose - Callback to close add event modal
 * @param onDayEventsClose - Callback to close day events modal
 * @param onEventClick - Callback when an event is clicked
 */
const EventManager: React.FC<EventManagerProps> = React.memo(({ 
  user,
  isAddModalOpen,
  isDayEventsModalOpen,
  selectedDayForEvents,
  fitnessEvents,
  onAddEventClose,
  onDayEventsClose,
  onEventClick
}) => {
  const { handleError, handleSuccess } = useApiError();
  const queryClient = useQueryClient();
  
  const [newEvent, setNewEvent] = useState<NewEventFormData>({
    title: '',
    start_time: '',
    end_time: '',
    description: '',
  });

  /**
   * Handle adding a new calendar event
   */
  const handleAddEvent = async (): Promise<void> => {
    if (!user || !newEvent.title || !newEvent.start_time) return;

    const dateStr = dayjs().format('YYYY-MM-DD');
    const startTime = `${dateStr}T${newEvent.start_time}`;
    
    let endTime: string;
    if (newEvent.end_time) {
      endTime = `${dateStr}T${newEvent.end_time}`;
    } else {
      endTime = dayjs(startTime).add(1, 'hour').toISOString();
    }
    
    const payload: CalendarEventInsertPayload = {
      event: {
        user_id: user.id,
        title: newEvent.title,
        description: newEvent.description || null,
        start_time: startTime,
        end_time: endTime,
      }
    };

    try {
      const response = await fetch("/api/calendar/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        handleError(new Error('Failed to add event.'), { 
          customMessage: 'Failed to add event.' 
        });
      } else {
        onAddEventClose();
        setNewEvent({ title: '', start_time: '', end_time: '', description: '' });
        
        // Invalidate the events query to refresh the data
        queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
        handleSuccess('Event added successfully!');
      }
    } catch (error) {
      handleError(error, { 
        customMessage: 'Failed to add event.' 
      });
    }
  };

  /**
   * Handle closing the add event modal
   */
  const handleAddEventClose = (): void => {
    onAddEventClose();
    setNewEvent({ title: '', start_time: '', end_time: '', description: '' });
  };

  /**
   * Handle input change for new event form
   */
  const handleInputChange = (field: keyof NewEventFormData, value: string): void => {
    setNewEvent(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Get events for the selected day
   */
  const getDayEvents = (): WorkoutCalendarEvent[] => {
    if (!selectedDayForEvents) return [];
    
    const dayStr = dayjs(selectedDayForEvents).format('YYYY-MM-DD');
    return fitnessEvents.filter(event => 
      dayjs(event.start_time).format('YYYY-MM-DD') === dayStr
    );
  };

  return (
    <>
      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add New Event</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                  placeholder="Event title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Time</label>
                <input
                  type="time"
                  value={newEvent.start_time}
                  onChange={(e) => handleInputChange('start_time', e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Time (Optional)</label>
                <input
                  type="time"
                  value={newEvent.end_time}
                  onChange={(e) => handleInputChange('end_time', e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description (Optional)</label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full p-2 border border-border rounded bg-background text-foreground"
                  rows={3}
                  placeholder="Event description"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={handleAddEvent} 
                disabled={!newEvent.title || !newEvent.start_time}
                aria-label="Add new calendar event"
              >
                Add Event
              </Button>
              <Button 
                onClick={handleAddEventClose} 
                variant="secondary"
                aria-label="Cancel adding event"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Day Events Modal */}
      {isDayEventsModalOpen && selectedDayForEvents && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              Events for {dayjs(selectedDayForEvents).format('MMMM D, YYYY')}
            </h3>
            <div className="space-y-3">
              {getDayEvents().length === 0 ? (
                <p className="text-gray-400 text-center py-4">No events scheduled for this day.</p>
              ) : (
                getDayEvents().map((event) => {
                  const eventStyle = getEventStyle(event.source as any);
                  return (
                    <div
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${eventStyle.colorClass} hover:opacity-80`}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm opacity-75">
                        {dayjs(event.start_time).format('h:mm A')}
                        {event.end_time && ` - ${dayjs(event.end_time).format('h:mm A')}`}
                      </div>
                      {event.description && (
                        <div className="text-sm opacity-75 mt-1">{event.description}</div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex gap-2 mt-6">
              <Button 
                onClick={onDayEventsClose} 
                variant="secondary"
                aria-label="Close day events modal"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

EventManager.displayName = 'EventManager';

export default EventManager;
