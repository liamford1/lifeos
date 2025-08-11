"use client";

import React, { useState } from "react";
import Button from "@/components/shared/Button";
import { useApiError } from '@/lib/hooks/useApiError';
import { useQueryClient } from "@tanstack/react-query";
import { getEventStyle } from '@/lib/utils/eventStyleMap';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import dayjs from 'dayjs';

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
 */
const EventManager = React.memo(({ 
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
  
  const [newEvent, setNewEvent] = useState({
    title: '',
    start_time: '',
    end_time: '',
    description: '',
  });

  const handleAddEvent = async () => {
    if (!user || !newEvent.title || !newEvent.start_time) return;

    const dateStr = dayjs().format('YYYY-MM-DD');
    const startTime = `${dateStr}T${newEvent.start_time}`;
    
    let endTime = null;
    if (newEvent.end_time) {
      endTime = `${dateStr}T${newEvent.end_time}`;
    } else {
      endTime = dayjs(startTime).add(1, 'hour').toISOString();
    }
    
    const payload = {
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description || null,
      start_time: startTime,
      end_time: endTime,
    };

    try {
      const response = await fetch("/api/calendar/insert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: payload }),
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

  const handleAddEventClose = () => {
    onAddEventClose();
    setNewEvent({ title: '', start_time: '', end_time: '', description: '' });
  };

  return (
    <>
      {/* Add Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Event</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full p-2 border rounded bg-surface text-white"
              />
              <input
                type="time"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                className="w-full p-2 border rounded bg-surface text-white"
              />
              <input
                type="time"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                className="w-full p-2 border rounded bg-surface text-white"
              />
              <textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full p-2 border rounded bg-surface text-white"
                rows={3}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddEvent} variant="primary">
                Add Event
              </Button>
              <Button
                onClick={handleAddEventClose} 
                variant="secondary"
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
          <div className="bg-surface p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">
              Events on {dayjs(selectedDayForEvents).format('MMMM D, YYYY')}
            </h3>
            {(() => {
              const eventsForDay = fitnessEvents.filter((event) =>
                dayjs(event.start_time).isSame(selectedDayForEvents, 'day')
              );
              
              if (eventsForDay.length === 0) {
                return (
                  <p className="text-sm text-gray-400">No fitness activities planned for this date.</p>
                );
              }
              
              return (
                <ul className="space-y-2">
                  {eventsForDay.map((event) => {
                    const { colorClass, Icon } = getEventStyle(event.source);
                    
                    return (
                      <li
                        key={event.id}
                        className={`p-3 rounded text-sm ${colorClass} cursor-pointer relative group`}
                        role="button"
                        tabIndex={0}
                        onClick={() => onEventClick(event)}
                      >
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="flex-shrink-0" size={16} />}
                          <span>{event.title}</span>
                          {event.start_time && (
                            <span className="text-xs opacity-75">
                              {dayjs(event.start_time).format('h:mm A')}
                            </span>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              );
            })()}
            <div className="flex gap-2 mt-4">
              <Button 
                onClick={onDayEventsClose} 
                variant="secondary"
                className="w-full"
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
