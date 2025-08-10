"use client";

import { useState, useCallback, useMemo } from "react";
import BaseModal from "@/components/shared/BaseModal";
import Button from "@/components/shared/Button";
import PlannedWorkoutForm from "@/components/forms/PlannedWorkoutForm";
import dynamic from "next/dynamic";
import { useUser } from '@/context/UserContext';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from 'dayjs';
import Calendar from "@/components/client/CalendarClient";
import 'react-calendar/dist/Calendar.css';
import { getEventStyle } from '@/lib/utils/eventStyleMap';
import { CALENDAR_SOURCES, getCalendarEventRoute } from '@/lib/utils/calendarUtils';
import { useCalendarDragAndDrop } from '@/lib/hooks/useCalendarDragAndDrop';
import { useApiError } from '@/lib/hooks/useApiError';
import { useToast } from '@/components/client/Toast';
import { MdRestaurant, MdFitnessCenter, MdEvent, MdAdd, MdDragIndicator, MdClose } from 'react-icons/md';
import { toYMD } from '@/lib/date';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

const CalendarIcon = dynamic(() => import("lucide-react/dist/esm/icons/calendar"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});

export default function PlanWorkoutModal({ isOpen, onClose }) {
  const { handleError, handleSuccess } = useApiError();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();
  
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateForForm, setSelectedDateForForm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showSelectionModalForDate, setShowSelectionModalForDate] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [selectedDayForEvents, setSelectedDayForEvents] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start_time: '',
    end_time: '',
    description: '',
  });
  
  const { user } = useUser();

  // Fetch calendar events
  const eventsQuery = useQuery({
    queryKey: ["events", user?.id],
    enabled: !!user && isOpen,
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

  const eventsForSelectedDate = fitnessEvents.filter((event) =>
    dayjs(event.start_time).isSame(selectedDate, 'day')
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

  const handleAddEvent = async () => {
    if (!user || !newEvent.title || !newEvent.start_time) return;

    // Use the date from the selection modal if available, otherwise use selectedDate
    const dateToUse = showSelectionModalForDate || selectedDate;
    const dateStr = dayjs(dateToUse).format('YYYY-MM-DD');
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
        setShowAddModal(false);
        setNewEvent({ title: '', start_time: '', end_time: '', description: '' });
        setShowSelectionModalForDate(null);
        
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

  const handlePlanningSelection = (type, selectedDateForPlanning = null) => {
    setShowSelectionModal(false);
    
    // Use the provided date or fall back to the currently selected date
    const dateToUse = selectedDateForPlanning || selectedDate;
    const dateStr = dayjs(dateToUse).format('YYYY-MM-DD');
    
    switch (type) {
      case 'general':
        setNewEvent({
          ...newEvent,
          start_time: '',
          end_time: '',
          description: '',
        });
        setShowAddModal(true);
        break;
      case 'workout':
        // Open the planned workout form with the selected date
        setSelectedDateForForm(dateStr);
        setShowForm(true);
        break;
      default:
        break;
    }
  };

  const handleFitnessEventClick = async (event, type) => {
    try {
      // Determine the table name based on type
      const tableMap = {
        'workout': 'fitness_workouts',
        'cardio': 'fitness_cardio', 
        'sport': 'fitness_sports'
      };
      const table = tableMap[type];
      
      if (!table) {
        handleError(new Error('Unknown fitness event type.'), { 
          customMessage: 'Unknown fitness event type.' 
        });
        return;
      }

      // Fetch the source entity to check its status
      const { data: sourceEntity, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', event.source_id)
        .single();

      if (error) {
        handleError(new Error('Could not fetch event details.'), { 
          customMessage: 'Could not fetch event details.' 
        });
        return;
      }

      // If it's a planned event, route to live session with pre-filled data
      if (sourceEntity.status === 'planned') {
        const routeMap = {
          'workout': '/fitness/workouts/live',
          'cardio': '/fitness/cardio/live',
          'sport': '/fitness/sports/live'
        };
        const baseRoute = routeMap[type];
        
        // Create URL parameters with pre-filled data
        const params = new URLSearchParams({
          plannedId: event.source_id,
          title: sourceEntity.title || '',
          description: sourceEntity.description || ''
        });
        
        router.push(`${baseRoute}?${params.toString()}`);
      } else {
        // For completed events, route to the details page
        const routeMap = {
          'workout': `/fitness/workouts/${event.source_id}`,
          'cardio': `/fitness/cardio/${event.source_id}`,
          'sport': `/fitness/sports/${event.source_id}`
        };
        router.push(routeMap[type]);
      }
    } catch (error) {
      handleError(error, { 
        customMessage: 'Could not process event click.' 
      });
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedDateForForm(null);
    // Refresh the events query to show the new planned workout
    eventsQuery.refetch();
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Workouts"
      subtitle="Schedule and plan your fitness activities"
      icon={CalendarIcon}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-4xl"
      data-testid="plan-workout-modal"
    >
      <div 
        className="space-y-6"
        onPointerMove={moveDrag}
        onPointerUp={(e) => endDrag(e, { computeTargetDate })}
      >
        {/* Calendar View */}
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-semibold">
              Fitness Calendar - 2 Week View
              <span className="text-sm font-normal text-gray-400 ml-2">
                {dayjs(selectedDate).startOf('week').format('MMM D')} - {dayjs(selectedDate).startOf('week').add(13, 'day').format('MMM D, YYYY')}
              </span>
            </h4>
            <button
              onClick={() => {
                setSelectedDateForForm(null);
                setShowForm(true);
              }}
              className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm"
              aria-label="Add planned activity"
            >
              <MdAdd className="w-5 h-5" />
            </button>
          </div>
          
          {eventsQuery.isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading calendar...</div>
            </div>
          ) : (
            <div className="w-full">
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
                          onClick={() => setSelectedDate(date.toDate())}
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
                                setSelectedDayForEvents(date.toDate());
                                setShowDayEventsModal(true);
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
                                    if (event.source === CALENDAR_SOURCES.WORKOUT) {
                                      handleFitnessEventClick(event, 'workout');
                                    } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                                      handleFitnessEventClick(event, 'cardio');
                                    } else if (event.source === CALENDAR_SOURCES.SPORT) {
                                      handleFitnessEventClick(event, 'sport');
                                    }
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
                                setSelectedDateForForm(toYMD(date.toDate()));
                                setShowForm(true);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedDateForForm(toYMD(date.toDate()));
                                  setShowForm(true);
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
          )}
        </div>



        {/* Selection Modal */}
        {(showSelectionModal || showSelectionModalForDate) && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface p-6 rounded-lg w-96">
              <h3 className="text-lg font-semibold mb-4">
                What would you like to plan?
                {showSelectionModalForDate && (
                  <div className="text-sm font-normal opacity-75 mt-1">
                    for {dayjs(showSelectionModalForDate).format('MMMM D, YYYY')}
                  </div>
                )}
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => handlePlanningSelection('general', showSelectionModalForDate)}
                  variant="secondary"
                  className="w-full justify-start p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <MdEvent className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">General Event</div>
                      <div className="text-sm opacity-75">Add a calendar event</div>
                    </div>
                  </div>
                </Button>
                
                <Button
                  onClick={() => handlePlanningSelection('workout', showSelectionModalForDate)}
                  variant="secondary"
                  className="w-full justify-start p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    <MdFitnessCenter className="w-6 h-6" />
                    <div className="text-left">
                      <div className="font-semibold">Workout</div>
                      <div className="text-sm opacity-75">Plan a fitness activity</div>
                    </div>
                  </div>
                </Button>
              </div>
              <div className="flex gap-2 mt-4">
                <Button 
                  onClick={() => {
                    setShowSelectionModal(false);
                    setShowSelectionModalForDate(null);
                  }} 
                  variant="secondary" 
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Add Event Modal */}
        {showAddModal && (
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
                  onClick={() => {
                    setShowAddModal(false);
                    setShowSelectionModalForDate(null);
                  }} 
                  variant="secondary"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Day Events Modal */}
        {showDayEventsModal && selectedDayForEvents && (
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
                      const isBeingDragged = draggingId === event.id;
                      
                      return (
                        <li
                          key={event.id}
                          className={`p-3 rounded text-sm ${colorClass} cursor-pointer relative group`}
                          role="button"
                          tabIndex={0}
                          data-dragging={isBeingDragged}
                          style={{
                            opacity: isBeingDragged ? 0.5 : 1,
                            transform: isBeingDragged ? 'scale(0.95)' : 'none',
                            transition: 'opacity 0.2s, transform 0.2s'
                          }}
                          onClick={() => {
                            if (event.source === CALENDAR_SOURCES.WORKOUT) {
                              handleFitnessEventClick(event, 'workout');
                            } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                              handleFitnessEventClick(event, 'cardio');
                            } else if (event.source === CALENDAR_SOURCES.SPORT) {
                              handleFitnessEventClick(event, 'sport');
                            }
                          }}
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
                  onClick={() => {
                    setShowDayEventsModal(false);
                    setSelectedDayForEvents(null);
                  }} 
                  variant="secondary"
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Planned Workout Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Add Planned Activity</h3>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setSelectedDateForForm(null);
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  aria-label="Close modal"
                >
                  <MdClose className="w-5 h-5" />
                </button>
              </div>
              <PlannedWorkoutForm 
                onSuccess={handleFormSuccess} 
                selectedDate={selectedDateForForm}
              />
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
