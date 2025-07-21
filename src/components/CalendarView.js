'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import Calendar from "@/components/client/CalendarClient";
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { CALENDAR_SOURCES, getCalendarEventRoute } from '@/lib/calendarUtils';
import { getEventStyle } from '@/lib/eventStyleMap';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { navigateToSource } from '@/lib/navigateToSource';
import { MdOutlineCalendarToday } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';

export default function CalendarView() {
  const { showSuccess, showError } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [user, setUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start_time: '',
    end_time: '',
    description: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchUserAndEvents = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        if (!user) return;

        const { data, error } = await supabase
          .from('calendar_events')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          showError('Failed to fetch calendar events.');
        } else {
          setEvents(data || []);
        }
      } catch (error) {
        showError('Error in fetchUserAndEvents.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndEvents();
  }, [showError]);

  const eventsForSelectedDate = events.filter((event) =>
    dayjs(event.start_time).isSame(selectedDate, 'day')
  );

  const handleAddEvent = async () => {
    if (!user || !newEvent.title || !newEvent.start_time) return;

    const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
    const payload = {
      user_id: user.id,
      title: newEvent.title,
      description: newEvent.description || null,
      start_time: `${dateStr}T${newEvent.start_time}`,
      end_time: newEvent.end_time ? `${dateStr}T${newEvent.end_time}` : null,
    };

    const { error } = await supabase.from('calendar_events').insert([payload]);

    if (error) {
      showError('Failed to add event.');
    } else {
      setShowAddModal(false);
      setNewEvent({ title: '', start_time: '', end_time: '', description: '' });

      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);

      setEvents(data || []);
      showSuccess('Event added successfully!');
    }
  };

  const handleDeleteEvent = async (event) => {
    const confirm = window.confirm('Delete this event? This will also remove the linked workout/cardio/sports entry if one exists.');
    if (!confirm) return;
  
    if (!event.source || !event.source_id) {
      // If no source entity, just delete the calendar event
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', event.id);
      
      if (error) {
        showError('Could not delete event.');
      } else {
        setEvents((prev) => {
          const filtered = prev.filter((ev) => ev.id !== event.id);
          return filtered;
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
      showError('Unknown event type.');
      return;
    }
  
    const { data: { user } } = await supabase.auth.getUser();
    const user_id = user?.id;
    
    if (!user_id) {
      showError('You must be logged in.');
      return;
    }
  
    // Call deleteEntityWithCalendarEvent with correct params
    const error = await deleteEntityWithCalendarEvent({
      table: sourceTable,
      id: event.source_id,
      user_id: user_id,
      source: event.source,
    });
  
    if (error) {
      showError('Could not fully delete event.');
    } else {
      setEvents((prev) => {
        const filtered = prev.filter((ev) => ev.id !== event.id);
        return filtered;
      });
      showSuccess('Event deleted successfully!');
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

              return (
                <div className="space-y-1 overflow-hidden w-full h-full max-w-full relative">
                  {eventsOnThisDay.slice(0, 2).map((event) => {
                    const { colorClass, Icon } = getEventStyle(event.source);
                    // Make meal, planned_meal, expense, and workout events clickable
                    const isMealPlannedMealExpenseOrWorkout =
                      event.source === CALENDAR_SOURCES.MEAL ||
                      event.source === CALENDAR_SOURCES.PLANNED_MEAL ||
                      event.source === CALENDAR_SOURCES.EXPENSE ||
                      event.source === CALENDAR_SOURCES.WORKOUT;
                    const eventDivProps = isMealPlannedMealExpenseOrWorkout
                      ? {
                          role: 'button',
                          tabIndex: 0,
                          onClick: (e) => {
                            e.stopPropagation();
                            if (event.source === CALENDAR_SOURCES.MEAL) {
                              router.push(`/food/meals/${event.source_id}`);
                            } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                              const plannedMeal = events.find(ev => ev.source === CALENDAR_SOURCES.PLANNED_MEAL && ev.id === event.id);
                              if (plannedMeal && plannedMeal.meal_id) {
                                router.push(`/food/meals/${plannedMeal.meal_id}`);
                              } else {
                                router.push(`/food/planner/${event.source_id}`);
                              }
                            } else if (event.source === CALENDAR_SOURCES.EXPENSE) {
                              router.push(`/finances/expenses/${event.source_id}`);
                            } else if (event.source === CALENDAR_SOURCES.WORKOUT) {
                              router.push(`/fitness/workouts/${String(event.source_id)}`);
                            }
                          },
                          onKeyDown: (e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation();
                              if (event.source === CALENDAR_SOURCES.MEAL) {
                                router.push(`/food/meals/${event.source_id}`);
                              } else if (event.source === CALENDAR_SOURCES.PLANNED_MEAL) {
                                const plannedMeal = events.find(ev => ev.source === CALENDAR_SOURCES.PLANNED_MEAL && ev.id === event.id);
                                if (plannedMeal && plannedMeal.meal_id) {
                                  router.push(`/food/meals/${plannedMeal.meal_id}`);
                                } else {
                                  router.push(`/food/planner/${event.source_id}`);
                                }
                              } else if (event.source === CALENDAR_SOURCES.EXPENSE) {
                                router.push(`/finances/expenses/${event.source_id}`);
                              } else if (event.source === CALENDAR_SOURCES.WORKOUT) {
                                router.push(`/fitness/workouts/${event.source_id}`);
                              }
                            }
                          },
                          style: { boxSizing: 'border-box', display: 'block', cursor: 'pointer' },
                        }
                      : { style: { boxSizing: 'border-box', display: 'block' } };
                    return (
                      <div
                        key={event.id}
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
                </div>
              );
            }}
          />
          </div>
        </div>
        {/* Floating Add Button */}
        <button
          onClick={() => setShowAddModal(true)}
          aria-label="Add calendar event"
          className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-card text-base shadow-lg flex items-center justify-center text-3xl hover:bg-panel transition-colors border border-border focus:outline-none focus:ring-2 focus:ring-primary"
          type="button"
        >
          +
        </button>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">
          Events on {dayjs(selectedDate).format('MMMM D, YYYY')}
        </h3>

        {isLoading ? (
          <LoadingSpinner />
        ) : eventsForSelectedDate.length === 0 ? (
          <p className="text-muted-foreground text-sm mt-2">No entries yet. Add one above ⬆️</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {eventsForSelectedDate.map((event) => {
              const { colorClass, Icon } = getEventStyle(event.source);
              return (
                <li
                  key={event.id}
                  className={`p-3 rounded hover:opacity-80 ${colorClass}`}
                  onClick={() => {
                    if (!event.source || !event.source_id) return;
                    const route = getCalendarEventRoute(event.source, event.source_id);
                    router.push(route);
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
              <Button onClick={() => setShowAddModal(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
