'use client';

/**
 * Calendar View Component with Drag-and-Drop Rescheduling
 * 
 * Features:
 * - Drag handles (≡) appear on hover for each event
 * - Events can be dragged to new days with optimistic updates
 * - Snaps to day boundaries (midnight) for simplicity
 * - Undo functionality via toast notifications
 * - Keyboard accessible (Tab to handle, Enter to start drag)
 * - Scroll-friendly: only drag handle captures pointer events
 * - Linked entity sync: updates source entities (meals, workouts, etc.)
 * 
 * Drag Logic:
 * - 5px movement threshold prevents accidental drags during scroll
 * - Visual feedback: opacity/scale changes during drag
 * - Target date computed from pointer position over calendar cells
 */

import React, { useState, useCallback, useMemo } from 'react';
import { useUser } from '@/context/UserContext';
import Calendar from "@/components/client/CalendarClient";
import 'react-calendar/dist/Calendar.css';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteEntityWithCalendarEvent, deleteWorkoutCascade } from '@/lib/utils/deleteUtils';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { CALENDAR_SOURCES, getCalendarEventRoute } from '@/lib/utils/calendarUtils';
import { getEventStyle } from '@/lib/utils/eventStyleMap';
import Button from '@/components/shared/Button';
import { useCalendarDragAndDrop } from '@/lib/hooks/useCalendarDragAndDrop';

import { useApiError } from '@/lib/hooks/useApiError';
import { MdOutlineCalendarToday } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { supabase } from '@/lib/supabaseClient';
import { MdRestaurant, MdFitnessCenter, MdEvent, MdAdd, MdDragIndicator } from 'react-icons/md';
import PlanMealModal from '@/components/modals/PlanMealModal';
import { toYMD } from '@/lib/date';

export default function CalendarView() {
  const { handleError, handleSuccess } = useApiError();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Remove local events state, use eventsQuery.data
  const { user } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showSelectionModalForDate, setShowSelectionModalForDate] = useState(null);
  const [showPlanMealModal, setShowPlanMealModal] = useState(false);
  const [selectedDateForMealPlanning, setSelectedDateForMealPlanning] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start_time: '',
    end_time: '',
    description: '',
  });

  const router = useRouter();

  // useQuery for events
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
  const eventsForSelectedDate = events.filter((event) =>
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
      handleSuccess(`Event moved to ${newDate}`, 5000, () => {
        // Undo function
        handleEventDrop({
          id,
          newStartISO: originalStart,
          originalStart: newStartISO,
          originalEnd: originalEnd
        });
      });

    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(["events", user?.id], events);
      handleError(error, { 
        customMessage: 'Failed to move event. Changes reverted.' 
      });
    }
  }, [events, user, queryClient, handleError, handleSuccess]);

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
    const payload = {
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description || null,
      start_time: `${dateStr}T${newEvent.start_time}`,
      end_time: newEvent.end_time ? `${dateStr}T${newEvent.end_time}` : null,
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
        // Pre-fill the start time with the selected date
        setNewEvent({
          ...newEvent,
          start_time: '',
          end_time: '',
          description: '',
        });
        setShowAddModal(true);
        break;
      case 'meal':
        // Open meal planning modal with the selected date
        setSelectedDateForMealPlanning(dateStr);
        setShowPlanMealModal(true);
        break;
      case 'workout':
        // Navigate to Fitness dashboard (planning handled via modal there)
        router.push(`/fitness`);
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
          title: sourceEntity.title || sourceEntity.activity_type || '',
          notes: sourceEntity.notes || sourceEntity.performance_notes || '',
          date: sourceEntity.date || '',
          startTime: sourceEntity.start_time || '',
          endTime: sourceEntity.end_time || ''
        });
        
        router.push(`${baseRoute}?${params.toString()}`);
      } else {
        // If it's completed/in-progress, route to the overview page
        const routeMap = {
          'workout': `/fitness/workouts/${event.source_id}`,
          'cardio': `/fitness/cardio/${event.source_id}`,
          'sport': `/fitness/sports/${event.source_id}`
        };
        router.push(routeMap[type]);
      }
    } catch (error) {
      console.error('Error handling fitness event click:', error);
      handleError(error, { 
        customMessage: 'Could not process event click.' 
      });
    }
  };

  const handleDeleteEvent = async (event) => {
    const confirm = window.confirm('Delete this event? This will also remove the linked workout/cardio/sports entry if one exists.');
    if (!confirm) return;
  
    if (!event.source || !event.source_id) {
      // If no source entity, just delete the calendar event
      try {
        const response = await fetch("/api/calendar/delete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: event.id }),
        });
        
        if (!response.ok) {
          handleError(new Error('Could not delete event.'), { 
            customMessage: 'Could not delete event.' 
          });
        } else {
          // Invalidate the events query to refresh the data
          queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
        }
      } catch (error) {
        handleError(error, { 
          customMessage: 'Could not delete event.' 
        });
      }
      return;
    }
  
    // Map source to table names
    let sourceTable = null;
    if (event.source === CALENDAR_SOURCES.MEAL) sourceTable = 'meals';
    if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) sourceTable = 'planned_meals';
    if (event.source === CALENDAR_SOURCES.WORKOUT) sourceTable = 'fitness_workouts';
    if (event.source === CALENDAR_SOURCES.CARDIO) sourceTable = 'fitness_cardio';
    if (event.source === CALENDAR_SOURCES.SPORT) sourceTable = 'fitness_sports';
    if (event.source === CALENDAR_SOURCES.EXPENSE) sourceTable = 'expenses';
  
    if (!sourceTable) {
      handleError(new Error('Unknown event type.'), { 
        customMessage: 'Unknown event type.' 
      });
      return;
    }
  
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    
    if (!user_id) {
      handleError(new Error('You must be logged in.'), { 
        customMessage: 'You must be logged in.' 
      });
      return;
    }
  

    // For workouts, use the cascade deletion function
    let error = null;
    if (event.source === CALENDAR_SOURCES.WORKOUT) {
      error = await deleteWorkoutCascade({
        workoutId: event.source_id,
        user_id: user_id,
      });
    } else {
      // Call deleteEntityWithCalendarEvent with correct params for other entities
      error = await deleteEntityWithCalendarEvent({
        table: sourceTable,
        id: event.source_id,
        user_id: user_id,
        source: event.source,
      });
    }
  
    if (error) {
      handleError(error, { 
        customMessage: 'Could not fully delete event.' 
      });
    } else {
      // Invalidate the events query to refresh the data
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      handleSuccess('Event deleted successfully!');
    }
  };  

  const handlePlannedMealClick = async (event) => {
    try {
      // Check if source_id looks like a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(event.source_id)) {
        console.warn('Invalid source_id for planned meal:', event.source_id);
        // If source_id is not a valid UUID, try to extract date and open modal
        const dateMatch = event.source_id.match(/^(\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          setSelectedDateForMealPlanning(dateMatch[1]);
          setShowPlanMealModal(true);
        } else {
          setShowPlanMealModal(true);
        }
        return;
      }

      const { data: plannedMeal, error } = await supabase
        .from('planned_meals')
        .select('meal_id')
        .eq('id', event.source_id)
        .single();

      if (error) {
        console.error('Error fetching planned meal:', error);
        handleError(new Error('Could not fetch planned meal details.'), { 
          customMessage: 'Could not fetch planned meal details.' 
        });
        return;
      }

      if (plannedMeal && plannedMeal.meal_id) {
        router.push(`/food/meals/${plannedMeal.meal_id}/cook`);
      } else {
        // If no meal_id, open the modal to show the planned meal
        setShowPlanMealModal(true);
      }
    } catch (error) {
      console.error('Error in handlePlannedMealClick:', error);
      handleError(error, { 
        customMessage: 'Could not process planned meal click.' 
      });
    }
  };

  return (
    <div 
      className="relative w-full p-6 bg-surface text-white rounded shadow"
      onPointerMove={moveDrag}
      onPointerUp={(e) => endDrag(e, { computeTargetDate })}
    >
      <h2 className="text-xl font-semibold mb-4">
        <MdOutlineCalendarToday className="inline w-5 h-5 mr-2 align-text-bottom" />
        Calendar
      </h2>
      
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => setShowSelectionModal(true)}
          className="h-20 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
        >
          <MdAdd className="w-7 h-7 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm text-white">Add Event</span>
        </button>
        
        <button
          onClick={() => router.push('/food/addmeal')}
          className="h-20 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-orange-500 group p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
        >
          <MdRestaurant className="w-7 h-7 text-orange-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm text-white">Add Meal</span>
        </button>
        
        <button
          onClick={() => router.push('/fitness/workouts/live')}
          className="h-20 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
        >
          <MdFitnessCenter className="w-7 h-7 text-blue-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm text-white">Start Workout</span>
        </button>
        
        <button
          onClick={() => router.push('/food/inventory')}
          className="h-20 bg-gray-800 rounded-xl hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-green-500 group p-4 flex flex-col items-center justify-center shadow-sm hover:shadow-md"
        >
          <MdEvent className="w-7 h-7 text-green-500 mb-2 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-sm text-white">Inventory</span>
        </button>
      </div>
      
      <div className="w-full flex justify-center my-6">
        <div className="w-[80rem]">
          <div className="bg-panel p-2 rounded">
            <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="!w-full !bg-surface !text-white rounded-lg shadow"
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;

              const eventsOnThisDay = events.filter(event =>
                dayjs(event.start_time).isSame(date, 'day')
              );

              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              const dateStr = dayjs(date).format('YYYY-MM-DD');
              
              return (
                <div 
                  className="space-y-1 overflow-hidden w-full h-full max-w-full relative"
                  data-testid={`calendar-daycell-${dateStr}`}
                  data-date={dateStr}
                >
                  {eventsOnThisDay.slice(0, 2).map((event) => {
                    const { colorClass, Icon } = getEventStyle(event.source);
                    // Make meal, planned_meal, expense, workout, cardio, and sport events clickable
                    const isClickableEvent =
                      event.source === CALENDAR_SOURCES.MEAL ||
                      event.source === CALENDAR_SOURCES.PLANNED_MEAL ||
                      event.source === CALENDAR_SOURCES.EXPENSE ||
                      event.source === CALENDAR_SOURCES.WORKOUT ||
                      event.source === CALENDAR_SOURCES.CARDIO ||
                      event.source === CALENDAR_SOURCES.SPORT;
                    
                    const isBeingDragged = draggingId === event.id;
                    
                    const eventDivProps = isClickableEvent
                      ? {
                          role: 'button',
                          tabIndex: 0,
                          onClick: (e) => {
                            e.stopPropagation();
                            if (event.source === CALENDAR_SOURCES.MEAL) {
                              router.push(`/food/meals/${event.source_id}/cook`);
                            } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                              // For planned meals, we need to fetch the meal_id from the planned_meals table
                              handlePlannedMealClick(event);
                            } else if (event.source === CALENDAR_SOURCES.EXPENSE) {
                              router.push(`/finances/expenses/${event.source_id}`);
                            } else if (event.source === CALENDAR_SOURCES.WORKOUT) {
                              // Check if this is a planned workout and route to live session
                              handleFitnessEventClick(event, 'workout');
                            } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                              // Check if this is a planned cardio and route to live session
                              handleFitnessEventClick(event, 'cardio');
                            } else if (event.source === CALENDAR_SOURCES.SPORT) {
                              // Check if this is a planned sport and route to live session
                              handleFitnessEventClick(event, 'sport');
                            }
                          },
                          onKeyDown: (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              if (event.source === CALENDAR_SOURCES.MEAL) {
                                router.push(`/food/meals/${event.source_id}/cook`);
                              } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                                // For planned meals, we need to fetch the meal_id from the planned_meals table
                                handlePlannedMealClick(event);
                              } else if (event.source === CALENDAR_SOURCES.EXPENSE) {
                                router.push(`/finances/expenses/${event.source_id}`);
                              } else if (event.source === CALENDAR_SOURCES.WORKOUT) {
                                // Check if this is a planned workout and route to live session
                                handleFitnessEventClick(event, 'workout');
                              } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                                // Check if this is a planned cardio and route to live session
                                handleFitnessEventClick(event, 'cardio');
                              } else if (event.source === CALENDAR_SOURCES.SPORT) {
                                // Check if this is a planned sport and route to live session
                                handleFitnessEventClick(event, 'sport');
                              }
                            }
                          },
                          style: { 
                            boxSizing: 'border-box', 
                            display: 'block', 
                            cursor: 'pointer',
                            opacity: isBeingDragged ? 0.5 : 1,
                            transform: isBeingDragged ? 'scale(0.95)' : 'none',
                            transition: 'opacity 0.2s, transform 0.2s'
                          },
                        }
                      : { 
                          style: { 
                            boxSizing: 'border-box', 
                            display: 'block',
                            opacity: isBeingDragged ? 0.5 : 1,
                            transform: isBeingDragged ? 'scale(0.95)' : 'none',
                            transition: 'opacity 0.2s, transform 0.2s'
                          } 
                        };
                    return (
                      <div
                        key={event.id}
                        data-testid={`calendar-event-${event.id}`}
                        className={`w-full h-5 text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis rounded px-1 py-0.5 text-left ${colorClass} relative group`}
                        data-dragging={isBeingDragged}
                        {...eventDivProps}
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
                    <div className="text-[10px] text-base">
                      +{eventsOnThisDay.length - 2} more
                    </div>
                  )}
                  
                  {/* Add button for selected day */}
                  {isSelectedDay && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSelectionModalForDate(toYMD(date));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowSelectionModalForDate(toYMD(date));
                        }
                      }}
                      className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm z-10 cursor-pointer"
                      aria-label="Add event for this day"
                      role="button"
                      tabIndex={0}
                    >
                      +
                    </div>
                  )}
                </div>
              );
            }}
          />
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">
          Events on {dayjs(selectedDate).format('MMMM D, YYYY')}
        </h3>

        {eventsForSelectedDate.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-2">No entries yet. Add one above ⬆️</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {eventsForSelectedDate.map((event) => {
              const { colorClass, Icon } = getEventStyle(event.source);
              const isBeingDragged = draggingId === event.id;
              
              return (
                <li
                  key={event.id}
                  className={`p-3 rounded hover:opacity-80 ${colorClass} cursor-pointer relative group`}
                  role="button"
                  tabIndex={0}
                  data-dragging={isBeingDragged}
                  style={{
                    opacity: isBeingDragged ? 0.5 : 1,
                    transform: isBeingDragged ? 'scale(0.95)' : 'none',
                    transition: 'opacity 0.2s, transform 0.2s'
                  }}
                  onClick={() => {
                    if (!event.source || !event.source_id) return;
                    
                    // Use the same logic as calendar tile clicks for fitness events
                    if (event.source === CALENDAR_SOURCES.WORKOUT) {
                      handleFitnessEventClick(event, 'workout');
                    } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                      handleFitnessEventClick(event, 'cardio');
                    } else if (event.source === CALENDAR_SOURCES.SPORT) {
                      handleFitnessEventClick(event, 'sport');
                    } else if (event.source === CALENDAR_SOURCES.MEAL) {
                      router.push(`/food/meals/${event.source_id}/cook`);
                    } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                      // For planned meals, we need to fetch the meal_id from the planned_meals table
                      handlePlannedMealClick(event);
                    } else {
                      // For other events, use the existing route logic
                      const route = getCalendarEventRoute(event.source, event.source_id);
                      router.push(route);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (!event.source || !event.source_id) return;
                      
                      // Use the same logic as calendar tile clicks for fitness events
                      if (event.source === CALENDAR_SOURCES.WORKOUT) {
                        handleFitnessEventClick(event, 'workout');
                      } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                        handleFitnessEventClick(event, 'cardio');
                      } else if (event.source === CALENDAR_SOURCES.SPORT) {
                        handleFitnessEventClick(event, 'sport');
                      } else if (event.source === CALENDAR_SOURCES.MEAL) {
                        router.push(`/food/meals/${event.source_id}/cook`);
                      } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                        // For planned meals, we need to fetch the meal_id from the planned_meals table
                        handlePlannedMealClick(event);
                      } else {
                        // For other events, use the existing route logic
                        const route = getCalendarEventRoute(event.source, event.source_id);
                        router.push(route);
                      }
                    }
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-semibold flex items-center min-w-0 flex-1">
                      {Icon && <Icon className="inline mr-1 align-text-bottom flex-shrink-0" size={18} />} 
                      <span className="truncate">{event.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Drag handle */}
                      <div
                        data-testid={`calendar-event-drag-handle-${event.id}`}
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[dragging=true]:opacity-100 transition-opacity p-1 rounded hover:bg-black/20 cursor-grab active:cursor-grabbing w-6 h-6 flex items-center justify-center flex-shrink-0"
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
                        <MdDragIndicator size={16} className="text-gray-400" />
                      </div>
                      <SharedDeleteButton
                        size="sm"
                        onClick={() => handleDeleteEvent(event)}
                        aria-label="Delete event"
                        label="Delete"
                      />
                    </div>
                  </div>
                  {event.description && (
                    <div className="text-sm opacity-90 mt-1">{event.description}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

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
                onClick={() => handlePlanningSelection('meal', showSelectionModalForDate)}
                variant="secondary"
                className="w-full justify-start p-4 h-auto"
              >
                <div className="flex items-center gap-3">
                  <MdRestaurant className="w-6 h-6" />
                  <div className="text-left">
                    <div className="font-semibold">Meal</div>
                    <div className="text-sm opacity-75">Plan a meal for a specific date</div>
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

      {/* Plan Meal Modal */}
      <PlanMealModal 
        isOpen={showPlanMealModal} 
        onClose={() => {
          setShowPlanMealModal(false);
          setSelectedDateForMealPlanning(null);
        }}
        onSuccess={() => {
          // Refresh calendar events when a meal is successfully planned
          queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
        }}
        selectedDate={selectedDateForMealPlanning}
      />
    </div>
  );
}
