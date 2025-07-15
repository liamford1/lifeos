'use client';

import { useEffect, useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { CALENDAR_SOURCES, getCalendarEventRoute } from '@/lib/calendarUtils';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CalendarView() {
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
          console.error('Error fetching calendar events:', error);
        } else {
          setEvents(data || []);
        }
      } catch (error) {
        console.error('Error in fetchUserAndEvents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserAndEvents();
  }, []);

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
      alert('Failed to add event.');
      console.error('Error:', error);
    } else {
      setShowAddModal(false);
      setNewEvent({ title: '', start_time: '', end_time: '', description: '' });

      const { data } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user.id);

      setEvents(data || []);
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
        console.error('❌ Failed to delete calendar event:', error);
        alert('Could not delete event.');
      } else {
        setEvents((prev) => prev.filter((ev) => ev.id !== event.id));
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
      console.error('Unknown source type:', event.source);
      alert('Unknown event type.');
      return;
    }
  
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      alert('You must be logged in.');
      return;
    }
  
    const error = await deleteEntityWithCalendarEvent({
      table: sourceTable,
      id: event.source_id,
      user_id: user_id,
    });
  
    if (error) {
      console.error('❌ Failed to delete:', error);
      alert('Could not fully delete event.');
    } else {
      setEvents((prev) => prev.filter((ev) => ev.id !== event.id));
    }
  };  

  const getEventColor = (type) => {
    switch (type) {
      case CALENDAR_SOURCES.MEAL:
        return 'bg-orange-500 text-white';
      case CALENDAR_SOURCES.PLANNED_MEAL:
        return 'bg-orange-400 text-white';
      case CALENDAR_SOURCES.WORKOUT:
        return 'bg-red-500 text-white';
      case CALENDAR_SOURCES.CARDIO:
        return 'bg-green-500 text-white';
      case CALENDAR_SOURCES.SPORT:
        return 'bg-green-500 text-white';
      case CALENDAR_SOURCES.EXPENSE:
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getEventIcon = (type) => {
    switch (type) {
      case CALENDAR_SOURCES.MEAL: return '🍽️ ';
      case CALENDAR_SOURCES.PLANNED_MEAL: return '📅 ';
      case CALENDAR_SOURCES.WORKOUT: return '🏋️ ';
      case CALENDAR_SOURCES.CARDIO: return '🏃 ';
      case CALENDAR_SOURCES.SPORT: return '🏀 ';
      case CALENDAR_SOURCES.EXPENSE: return '💸 ';
      default: return '';
    }
  };

  return (
    <div className="relative w-full p-6 bg-gray-800 text-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">📅 Calendar</h2>
      <div className="w-full flex justify-center my-6">
        <div className="w-[80rem]">
          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            className="!w-full !bg-gray-700 !text-white rounded-lg shadow"
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;

              const eventsOnThisDay = events.filter(event =>
                dayjs(event.start_time).isSame(date, 'day')
              );

              return (
                <div className="mt-1 space-y-0.5">
                  {eventsOnThisDay.slice(0, 2).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs truncate rounded px-1 cursor-pointer hover:opacity-80 ${getEventColor(event.source)}`}
                      onClick={(e) => {
                        e.stopPropagation();

                        if (!event.source || !event.source_id) return;

                        const route = getCalendarEventRoute(event.source, event.source_id);
                        router.push(route);
                      }}
                    >
                      {getEventIcon(event.source)}{event.title}
                    </div>
                  ))}
                  {eventsOnThisDay.length > 2 && (
                    <div className="text-[10px] text-gray-300">
                      +{eventsOnThisDay.length - 2} more
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
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
            {eventsForSelectedDate.map((event) => (
              <li
                key={event.id}
                className={`p-3 rounded cursor-pointer hover:opacity-80 ${getEventColor(event.source)}`}
                onClick={() => {
                  if (!event.source || !event.source_id) return;

                  const route = getCalendarEventRoute(event.source, event.source_id);
                  router.push(route);
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="font-semibold">
                    {getEventIcon(event.source)}{event.title}
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteEvent(event);
                    }}
                    variant="link"
                    size="sm"
                    className="text-white hover:text-red-200"
                  >
                    🗑️
                  </Button>
                </div>
                {event.description && (
                  <div className="text-sm opacity-90 mt-1">{event.description}</div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4">Add Event</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Event title"
                value={newEvent.title}
                onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                className="w-full p-2 border rounded bg-gray-700 text-white"
              />
              <input
                type="time"
                value={newEvent.start_time}
                onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                className="w-full p-2 border rounded bg-gray-700 text-white"
              />
              <input
                type="time"
                value={newEvent.end_time}
                onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                className="w-full p-2 border rounded bg-gray-700 text-white"
              />
              <textarea
                placeholder="Description (optional)"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                className="w-full p-2 border rounded bg-gray-700 text-white"
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
