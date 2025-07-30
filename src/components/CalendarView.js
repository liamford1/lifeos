'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import Calendar from "@/components/client/CalendarClient";
import 'react-calendar/dist/Calendar.css';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteEntityWithCalendarEvent, deleteWorkoutCascade } from '@/lib/deleteUtils';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { CALENDAR_SOURCES, getCalendarEventRoute } from '@/lib/calendarUtils';
import { getEventStyle } from '@/lib/eventStyleMap';
import Button from '@/components/Button';

import { useApiError } from '@/lib/hooks/useApiError';
import { MdOutlineCalendarToday } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { supabase } from '@/lib/supabaseClient';
import { MdRestaurant, MdFitnessCenter, MdEvent } from 'react-icons/md';

export default function CalendarView() {
  const { handleError, handleSuccess } = useApiError();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  // Remove local events state, use eventsQuery.data
  const { user } = useUser();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showSelectionModalForDate, setShowSelectionModalForDate] = useState(null);
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

  const events = eventsQuery.data || [];
  const eventsForSelectedDate = events.filter((event) =>
    dayjs(event.start_time).isSame(selectedDate, 'day')
  );

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
        // Navigate to food planner with the selected date
        router.push(`/food/planner?date=${dateStr}`);
        break;
      case 'workout':
        // Navigate to fitness planner with the selected date
        router.push(`/fitness/planner?date=${dateStr}`);
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
      const { data: plannedMeal, error } = await supabase
        .from('planned_meals')
        .select('meal_id')
        .eq('id', event.source_id)
        .single();

      if (error) {
        handleError(new Error('Could not fetch planned meal details.'), { 
          customMessage: 'Could not fetch planned meal details.' 
        });
        return;
      }

      if (plannedMeal && plannedMeal.meal_id) {
        router.push(`/food/meals/${plannedMeal.meal_id}/cook`);
      } else {
        router.push(`/food/planner/${event.source_id}`);
      }
    } catch (error) {
      handleError(error, { 
        customMessage: 'Could not process planned meal click.' 
      });
    }
  };

  return (
    <div className="relative w-full p-6 bg-surface text-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">
        <MdOutlineCalendarToday className="inline w-5 h-5 mr-2 align-text-bottom" />
        Calendar
      </h2>
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
              
              return (
                <div className="space-y-1 overflow-hidden w-full h-full max-w-full relative">
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
                          style: { boxSizing: 'border-box', display: 'block', cursor: 'pointer' },
                        }
                      : { style: { boxSizing: 'border-box', display: 'block' } };
                    return (
                      <div
                        key={event.id}
                        data-testid={`calendar-event-${event.id}`}
                        className={`w-full h-5 text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis rounded px-1 py-0.5 text-left ${colorClass}`}
                        {...eventDivProps}
                      >
                        {Icon && <Icon className="inline mr-1 align-text-bottom" size={16} />} {event.title}
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowSelectionModalForDate(date);
                      }}
                      className="absolute bottom-0 right-0 w-5 h-5 bg-primary text-white rounded-full text-xs flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm z-10"
                      aria-label="Add event for this day"
                    >
                      +
                    </button>
                  )}
                </div>
              );
            }}
          />
          </div>
        </div>
        {/* Floating Add Button */}
        <Button
          onClick={() => setShowSelectionModal(true)}
          aria-label="Add calendar event"
          variant="secondary"
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-card text-base shadow-lg flex items-center justify-center text-3xl hover:bg-panel transition-colors border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          type="button"
        >
          +
        </Button>
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
              return (
                <li
                  key={event.id}
                  className={`p-3 rounded hover:opacity-80 ${colorClass} cursor-pointer`}
                  role="button"
                  tabIndex={0}
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
                    <div className="font-semibold">
                      {Icon && <Icon className="inline mr-1 align-text-bottom" size={18} />} {event.title}
                    </div>
                    <SharedDeleteButton
                      size="sm"
                      onClick={() => handleDeleteEvent(event)}
                      aria-label="Delete event"
                      label="Delete"
                    />
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
    </div>
  );
}
