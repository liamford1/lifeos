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
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { supabase } from '@/lib/supabaseClient';
import { MdRestaurant, MdFitnessCenter, MdEvent, MdAdd, MdDragIndicator, MdFlashOn } from 'react-icons/md';
import MealDetailsModal from '@/components/modals/MealDetailsModal';
import CookingSessionModal from '@/components/modals/CookingSessionModal';
import { toYMD } from '@/lib/date';

export default function CalendarView() {
  const { handleError, handleSuccess } = useApiError();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Remove local events state, use eventsQuery.data
  const { user } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showSelectionModalForDate, setShowSelectionModalForDate] = useState(null);
  const [showMealDetailsModal, setShowMealDetailsModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(null);
  const [showCookingSessionModal, setShowCookingSessionModal] = useState(false);
  const [cookingMealId, setCookingMealId] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [selectedDayForEvents, setSelectedDayForEvents] = useState(null);
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
      showSuccess(`Event moved to ${newDate}`, 5000, () => {
        // Undo function
        handleEventDrop({
          id,
          newStartISO: originalStart,
          originalStart: newStartISO,
          originalEnd: originalEnd
        });
        // Invalidate the query cache to ensure UI updates
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
    
    // Set default end time to 1 hour after start time if not provided
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
        // Handle meal planning - this would need to be implemented differently
        // For now, just show a message that meal planning is handled elsewhere
        handleSuccess('Meal planning is available in the Food section.');
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
          'workout': `/fitness`, // Redirect to fitness page since workout details are now in modal
          'cardio': `/fitness`, // Redirect to fitness page since cardio details are now in modal
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
      console.log('Planned meal click event:', event);
      
      // Check if source_id looks like a valid UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      
      if (!uuidRegex.test(event.source_id)) {
        console.warn('Invalid source_id for planned meal:', event.source_id);
        return;
      }

      console.log('About to query planned_meals with source_id:', event.source_id);
      
      let plannedMeal, error;
      try {
        const response = await supabase
          .from('planned_meals')
          .select('meal_id')
          .eq('id', event.source_id)
          .single();
        
        plannedMeal = response.data;
        error = response.error;
        
        console.log('Raw Supabase response:', response);
      } catch (supabaseError) {
        console.error('Exception during Supabase query:', supabaseError);
        error = supabaseError;
      }

      console.log('Supabase response:', { 
        data: plannedMeal, 
        error: error,
        errorType: typeof error,
        errorKeys: error ? Object.keys(error) : 'no error',
        errorStringified: error ? JSON.stringify(error) : 'no error'
      });

      if (error) {
        console.error('Error fetching planned meal:', error);
        // Don't show error to user for now, just log it
        return;
      }

      if (plannedMeal && plannedMeal.meal_id) {
        console.log('Found planned meal with meal_id:', plannedMeal.meal_id);
        setSelectedMealId(plannedMeal.meal_id);
        setShowMealDetailsModal(true);
      } else {
        console.warn('No meal_id found for planned meal:', plannedMeal);
        
        // Let's also check if the planned meal exists at all
        try {
          const { data: allPlannedMeals } = await supabase
            .from('planned_meals')
            .select('*')
            .eq('id', event.source_id);
          
          console.log('All planned meals with this ID:', allPlannedMeals);
        } catch (checkError) {
          console.error('Error checking all planned meals:', checkError);
        }
      }
    } catch (error) {
      console.error('Error in handlePlannedMealClick:', error);
      // Don't show error to user for now, just log it
    }
  };

  return (
    <>
      {/* Quick Actions */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-300 flex items-center">
          <MdFlashOn className="w-5 h-5 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => setShowSelectionModal(true)}
            className="h-12 bg-[#1e1e1e] rounded-lg hover:bg-gray-700 transition-all duration-200 group p-3 flex items-center justify-center shadow-sm hover:shadow-md gap-2"
          >
            <MdAdd className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm text-white">Add Event</span>
          </button>
          
          <button
            onClick={() => router.push('/food/addmeal')}
            className="h-12 bg-[#1e1e1e] rounded-lg hover:bg-gray-700 transition-all duration-200 group p-3 flex items-center justify-center shadow-sm hover:shadow-md gap-2"
          >
            <MdRestaurant className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm text-white">Add Meal</span>
          </button>
          
          <button
            onClick={() => router.push('/fitness/workouts/live')}
            className="h-12 bg-[#1e1e1e] rounded-lg hover:bg-gray-700 transition-all duration-200 group p-3 flex items-center justify-center shadow-sm hover:shadow-md gap-2"
          >
            <MdFitnessCenter className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm text-white">Start Workout</span>
          </button>
          
          <button
            onClick={() => router.push('/food/inventory')}
            className="h-12 bg-[#1e1e1e] rounded-lg hover:bg-gray-700 transition-all duration-200 group p-3 flex items-center justify-center shadow-sm hover:shadow-md gap-2"
          >
            <MdEvent className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
            <span className="font-medium text-sm text-white">Inventory</span>
          </button>
        </div>
      </div>
      
                <div
            className="relative w-full text-white"
            onPointerMove={moveDrag}
            onPointerUp={(e) => endDrag(e, { computeTargetDate })}
          >
                    <h3 className="text-lg font-semibold mb-2 mt-2 text-gray-300 flex items-center">
                      <MdOutlineCalendarToday className="w-5 h-5 mr-2" />
                      Calendar
                    </h3>
      
      <div className="w-full my-6">
        <div className="w-full">
          <div className="p-2 rounded">
            <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            locale="en-US"
            className="!w-full !text-white !max-w-none"
            tileClassName={({ date, view }) => {
              if (view !== 'month') return '';
              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              return isSelectedDay ? 'selected-day' : '';
            }}
            tileProps={({ date, view }) => {
              if (view !== 'month') return {};
              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              return {
                'data-selected': isSelectedDay,
                className: isSelectedDay ? 'selected-day' : ''
              };
            }}
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
                  data-selected={isSelectedDay}
                >
                  {/* Date Number and Menu Button */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${
                      isSelectedDay ? 'text-primary' : 'text-foreground'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayForEvents(date);
                        setShowDayEventsModal(true);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedDayForEvents(date);
                          setShowDayEventsModal(true);
                        }
                      }}
                      className="w-4 h-4 text-gray-400 hover:text-white transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                      aria-label="View events for this day"
                      role="button"
                      tabIndex={0}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Events preview (only show first 2) */}
                  <div className="space-y-0.5">
                    {eventsOnThisDay.slice(0, 2).map((event) => {
                      const { colorClass, Icon } = getEventStyle(event.source);
                      const isBeingDragged = draggingId === event.id;
                      
                      return (
                        <div
                          key={event.id}
                          data-testid={`calendar-event-${event.id}`}
                          className={`w-[85%] h-4 text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis rounded px-0.5 py-0.25 text-left ${colorClass} relative group cursor-pointer`}
                          data-dragging={isBeingDragged}
                          style={{
                            opacity: isBeingDragged ? 0.5 : 1,
                            transform: isBeingDragged ? 'scale(0.95)' : 'none',
                            transition: 'opacity 0.2s, transform 0.2s'
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (event.source === CALENDAR_SOURCES.MEAL) {
                              setCookingMealId(event.source_id);
                              setShowCookingSessionModal(true);
                            } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                              handlePlannedMealClick(event);
                            } else if (event.source === CALENDAR_SOURCES.EXPENSE) {
                              router.push(`/finances/expenses/${event.source_id}`);
                            } else if (event.source === CALENDAR_SOURCES.WORKOUT) {
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
                              {Icon && <Icon className="inline mr-0.5 align-text-bottom flex-shrink-0" size={14} />} 
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
                        setShowSelectionModalForDate(toYMD(date));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowSelectionModalForDate(toYMD(date));
                        }
                      }}
                      className="absolute -bottom-0.5 -right-1.5 w-6 h-6 bg-primary text-white rounded-full text-sm flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm z-10 cursor-pointer"
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



      {/* Day Events Modal */}
      {showDayEventsModal && selectedDayForEvents && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-xl font-semibold text-foreground">
                Events on {dayjs(selectedDayForEvents).format('MMMM D, YYYY')}
              </h3>
              <button
                onClick={() => {
                  setShowDayEventsModal(false);
                  setSelectedDayForEvents(null);
                }}
                className="p-2 hover:bg-gray-100/10 rounded-lg transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {(() => {
                const eventsForDay = events.filter((event) =>
                  dayjs(event.start_time).isSame(selectedDayForEvents, 'day')
                );
                
                if (eventsForDay.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100/10 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-400 text-sm">No events planned for this date</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-3">
                    {eventsForDay.map((event) => {
                      const { colorClass, Icon } = getEventStyle(event.source);
                      const isBeingDragged = draggingId === event.id;
                      
                      return (
                        <div
                          key={event.id}
                          className={`group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-200 cursor-pointer ${
                            isBeingDragged ? 'opacity-50 scale-95' : ''
                          }`}
                          onClick={() => {
                            if (!event.source || !event.source_id) return;
                            
                            if (event.source === CALENDAR_SOURCES.WORKOUT) {
                              handleFitnessEventClick(event, 'workout');
                            } else if (event.source === CALENDAR_SOURCES.CARDIO) {
                              handleFitnessEventClick(event, 'cardio');
                            } else if (event.source === CALENDAR_SOURCES.SPORT) {
                              handleFitnessEventClick(event, 'sport');
                            } else if (event.source === CALENDAR_SOURCES.MEAL) {
                              router.push(`/food/meals/${event.source_id}/cook`);
                            } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                              handlePlannedMealClick(event);
                            } else {
                              const route = getCalendarEventRoute(event.source, event.source_id);
                              router.push(route);
                            }
                          }}
                        >
                          {/* Event content */}
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                              {Icon && <Icon className="w-4 h-4 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-medium text-foreground truncate">{event.title}</h4>
                                {event.start_time && (
                                  <span className="text-sm text-gray-400 flex-shrink-0 ml-2">
                                    {dayjs(event.start_time).format('h:mm A')}
                                  </span>
                                )}
                              </div>
                              {event.description && (
                                <p className="text-sm text-gray-400 line-clamp-2">{event.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              data-testid={`calendar-event-drag-handle-${event.id}`}
                              className="p-1.5 rounded-md hover:bg-gray-100/10 transition-colors"
                              onPointerDown={(e) => {
                                e.stopPropagation();
                                startDrag(e, { 
                                  id: event.id, 
                                  originalStart: event.start_time, 
                                  originalEnd: event.end_time 
                                });
                              }}
                              aria-label="Drag event"
                            >
                              <MdDragIndicator size={14} className="text-gray-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteEvent(event);
                              }}
                              className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
                              aria-label="Delete event"
                            >
                              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border">
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

      {/* Meal Details Modal */}
      <MealDetailsModal 
        isOpen={showMealDetailsModal} 
        onClose={() => {
          setShowMealDetailsModal(false);
          setSelectedMealId(null);
        }}
        mealId={selectedMealId}
      />

      {/* Cooking Session Modal */}
      <CookingSessionModal
        isOpen={showCookingSessionModal}
        onClose={() => {
          setShowCookingSessionModal(false);
          setCookingMealId(null);
        }}
        mealId={cookingMealId}
      />
        </div>
      </>
    );
}
