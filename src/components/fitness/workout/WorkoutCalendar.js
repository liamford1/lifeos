"use client";

import React, { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from 'dayjs';
import { useCalendarDragAndDrop } from '@/lib/hooks/useCalendarDragAndDrop';
import { useApiError } from '@/lib/hooks/useApiError';
import { useToast } from '@/components/client/Toast';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import { getEventStyle } from '@/lib/utils/eventStyleMap';
import { MdAdd, MdDragIndicator } from 'react-icons/md';
import { toYMD } from '@/lib/date';

/**
 * WorkoutCalendar Component
 * 
 * Handles the 2-week calendar view with drag-and-drop functionality for fitness events.
 * Extracted from PlanWorkoutModal.js to provide focused calendar management.
 * 
 * Features:
 * - 2-week calendar grid view
 * - Drag-and-drop event rescheduling
 * - Event click handling for fitness activities
 * - Optimistic updates with rollback on error
 * - Keyboard accessibility
 */
const WorkoutCalendar = React.memo(({ 
  user,
  selectedDate,
  onDateSelect,
  onEventClick,
  onAddEvent,
  onViewDayEvents
}) => {
  const { handleError, handleSuccess } = useApiError();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();

  // Fetch calendar events
  const eventsQuery = useQuery({
    queryKey: ["events", user?.id],
    enabled: !!user,
    queryFn: () =>
      fetch("/api/calendar/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      }).then((r) => r.json()),
  });

  const events = useMemo(() => eventsQuery.data || [], [eventsQuery.data]);
  
  // Filter for fitness-related events only
  const fitnessEvents = useMemo(() => 
    events.filter(event => 
      event.source === CALENDAR_SOURCES.WORKOUT ||
      event.source === CALENDAR_SOURCES.CARDIO ||
      event.source === CALENDAR_SOURCES.SPORT
    ), 
    [events]
  );

  // Drag and drop functionality
  const handleEventDrop = useCallback(async ({ id, newStartISO, originalStart, originalEnd }) => {
    if (!user) return;

    // Find the event to update
    const eventIndex = events.findIndex(e => e.id === id);
    if (eventIndex === -1) return;

    const event = events[eventIndex];
    const originalEvent = { ...event };

    // Optimistic update: immediately update local state
    const updatedEvents = [...events];
    const updatedEvent = {
      ...event,
      start_time: newStartISO,
      end_time: event.end_time ? 
        dayjs(newStartISO).add(dayjs(event.end_time).diff(dayjs(event.start_time))).toISOString() : 
        null
    };
    updatedEvents[eventIndex] = updatedEvent;

    // Optimistically update the query cache
    queryClient.setQueryData(["events", user?.id], updatedEvents);

    try {
      const response = await fetch("/api/calendar/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          userId: user.id,
          newStart: newStartISO,
          newEnd: updatedEvent.end_time,
          updateLinkedEntity: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      const result = await response.json();
      
      // Show success toast with undo option
      const newDate = dayjs(newStartISO).format('ddd MMM D');
      showSuccess(`Event moved to ${newDate}`, 5000, () => {
        // Undo function
        handleEventDrop({
          id,
          newStartISO: originalStart,
          originalStart: newStartISO,
          originalEnd: originalEnd
        });
    
        queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      });

    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(["events", user?.id], events);
      handleError(error, { 
        customMessage: 'Failed to move event. Changes reverted.' 
      });
    }
  }, [events, user, queryClient, handleError, showSuccess]);

  const { draggingId, startDrag, moveDrag, endDrag, isDragging } = useCalendarDragAndDrop({
    onDrop: handleEventDrop
  });

  // Compute target date from pointer position
  const computeTargetDate = useCallback((evt) => {
    const el = document.elementFromPoint(evt.clientX, evt.clientY);
    if (!el) return null;
    // Our calendar renders `data-date="YYYY-MM-DD"` on the inner daycell div.
    const dayCell = el.closest('[data-date]');
    if (!dayCell) return null;
    const dateStr = dayCell.getAttribute('data-date'); // e.g., "2025-08-09"
    if (!dateStr) return null;
    // Normalize to start of that day (preserve duration elsewhere)
    return dayjs(dateStr).startOf('day').toISOString();
  }, []);

  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  return (
    <div 
      className="w-full"
      onPointerMove={moveDrag}
      onPointerUp={(e) => endDrag(e, { computeTargetDate })}
    >
      {/* Custom 2-Week Calendar Grid */}
      <div className="bg-surface rounded-lg shadow p-4">
        {/* Calendar Header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-gray-400 py-2">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Days Grid */}
        <div className="grid grid-cols-7 gap-1">
          {(() => {
            const startOfWeek = dayjs(selectedDate).startOf('week');
            const days = [];
            
            // Generate 14 days (2 weeks)
            for (let i = 0; i < 14; i++) {
              const date = startOfWeek.add(i, 'day');
              const dateStr = date.format('YYYY-MM-DD');
              const eventsOnThisDay = fitnessEvents.filter(event =>
                dayjs(event.start_time).isSame(date, 'day')
              );
              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              const isToday = dayjs(date).isSame(dayjs(), 'day');
              
              days.push(
                <div
                  key={dateStr}
                  className={`min-h-24 p-2 border border-border rounded-lg relative ${
                    isSelectedDay ? 'bg-primary/20 border-primary' : 
                    isToday ? 'bg-blue-500/10 border-blue-500' : 
                    'bg-card hover:bg-card/80'
                  }`}
                  data-testid={`calendar-daycell-${dateStr}`}
                  data-date={dateStr}
                  onClick={() => onDateSelect(date.toDate())}
                >
                  {/* Date Number and Menu Button */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${
                      isSelectedDay ? 'text-primary' : 
                      isToday ? 'text-blue-500' : 
                      'text-foreground'
                    }`}>
                      {date.format('D')}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewDayEvents(date.toDate());
                      }}
                      className="w-4 h-4 text-gray-400 hover:text-white transition-colors opacity-60 hover:opacity-100"
                      aria-label="View events for this day"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                      </svg>
                    </button>
                  </div>
                  
                  {/* Events */}
                  <div className="space-y-1">
                    {eventsOnThisDay.slice(0, 2).map((event) => {
                      const { colorClass, Icon } = getEventStyle(event.source);
                      const isBeingDragged = draggingId === event.id;
                      
                      return (
                        <div
                          key={event.id}
                          data-testid={`calendar-event-${event.id}`}
                          className={`w-full h-5 text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis rounded px-1 py-0.5 text-left ${colorClass} relative group cursor-pointer`}
                          data-dragging={isBeingDragged}
                          style={{
                            opacity: isBeingDragged ? 0.5 : 1,
                            transform: isBeingDragged ? 'scale(0.95)' : 'none',
                            transition: 'opacity 0.2s, transform 0.2s'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center min-w-0 flex-1">
                              {Icon && <Icon className="inline mr-1 align-text-bottom flex-shrink-0" size={16} />} 
                              <span className="truncate">{event.title}</span>
                            </div>
                            {/* Drag handle */}
                            <div
                              data-testid={`calendar-event-drag-handle-${event.id}`}
                              className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[dragging=true]:opacity-100 transition-opacity ml-1 flex-shrink-0 p-0.5 rounded hover:bg-black/20 cursor-grab active:cursor-grabbing w-4 h-4 flex items-center justify-center"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                startDrag(e, { 
                                  id: event.id, 
                                  originalStart: event.start_time, 
                                  originalEnd: event.end_time 
                                });
                              }}
                              aria-label="Drag event"
                              role="button"
                              tabIndex={0}
                              data-dragging={isBeingDragged}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  startDrag(e, { 
                                    id: event.id, 
                                    originalStart: event.start_time, 
                                    originalEnd: event.end_time 
                                  });
                                }
                              }}
                            >
                              <MdDragIndicator size={12} className="text-gray-400" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {eventsOnThisDay.length > 2 && (
                      <div className="text-[10px] text-gray-400">
                        +{eventsOnThisDay.length - 2} more
                      </div>
                    )}
                  </div>
                  
                  {/* Add button for selected day */}
                  {isSelectedDay && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddEvent(toYMD(date.toDate()));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onAddEvent(toYMD(date.toDate()));
                        }
                      }}
                      className="absolute bottom-1 right-1 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm z-10 cursor-pointer"
                      aria-label="Add event for this day"
                      role="button"
                      tabIndex={0}
                    >
                      +
                    </div>
                  )}
                </div>
              );
            }
            
            return days;
          })()}
        </div>
      </div>
    </div>
  );
});

WorkoutCalendar.displayName = 'WorkoutCalendar';

export default WorkoutCalendar;
