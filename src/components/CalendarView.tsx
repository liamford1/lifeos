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
import { supabase } from '@/lib/supabaseClient';
import { MdRestaurant, MdFitnessCenter, MdEvent, MdAdd, MdDragIndicator, MdFlashOn } from 'react-icons/md';
import { toYMD } from '@/lib/date';
import dynamic from 'next/dynamic';
import { 
  CalendarEvent, 
  DragState, 
  CalendarEventClickHandler,
  CalendarEventDeleteHandler,
  CalendarDragStartHandler
} from '@/types/calendar';

// Dynamic imports for heavy modal components
const MealDetailsModal = dynamic(() => import('@/components/modals/MealDetailsModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading meal details...</div>,
  ssr: false
});

const PlannedMealDetailsModal = dynamic(() => import('@/components/modals/PlannedMealDetailsModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading planned meal details...</div>,
  ssr: false
});

const CookingSessionModal = dynamic(() => import('@/components/modals/CookingSessionModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading cooking session...</div>,
  ssr: false
});

/**
 * Props for the CalendarEventItem component
 */
interface CalendarEventItemProps {
  event: CalendarEvent;
  isBeingDragged: boolean;
  onEventClick: CalendarEventClickHandler;
  onDelete: CalendarEventDeleteHandler;
  onStartDrag: CalendarDragStartHandler;
  isCompact?: boolean;
}

// Memoized Calendar Event Item Component
const CalendarEventItem: React.FC<CalendarEventItemProps> = React.memo(({ 
  event, 
  isBeingDragged, 
  onEventClick, 
  onDelete, 
  onStartDrag,
  isCompact = false 
}) => {
  const { colorClass, Icon } = getEventStyle(event.source);
  
  const handleStartDrag = (e: React.PointerEvent | React.KeyboardEvent, dragState: DragState) => {
    e.stopPropagation();
    onStartDrag(e as React.PointerEvent, dragState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleStartDrag(e, { 
        id: event.id, 
        originalStart: event.start_time, 
        originalEnd: event.end_time || event.start_time
      });
    }
  };
  
  if (isCompact) {
    return (
      <div
        data-testid={`calendar-event-${event.id}`}
        className={`w-[85%] h-4 text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis rounded px-0.5 py-0.25 text-left ${colorClass} relative group cursor-pointer`}
        data-dragging={isBeingDragged}
        style={{
          opacity: isBeingDragged ? 0.5 : 1,
          transform: isBeingDragged ? 'scale(0.95)' : 'none',
          transition: 'opacity 0.2s, transform 0.2s'
        }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onEventClick(event);
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
            onPointerDown={(e: React.PointerEvent) => {
                          handleStartDrag(e, { 
              id: event.id, 
              originalStart: event.start_time, 
              originalEnd: event.end_time || event.start_time
            });
            }}
            aria-label="Drag event"
            role="button"
            tabIndex={0}
            data-dragging={isBeingDragged}
            onKeyDown={handleKeyDown}
          >
            <MdDragIndicator size={12} className="text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-200 cursor-pointer ${
        isBeingDragged ? 'opacity-50 scale-95' : ''
      }`}
      onClick={() => onEventClick(event)}
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
          onPointerDown={(e: React.PointerEvent) => {
            handleStartDrag(e, { 
              id: event.id, 
              originalStart: event.start_time, 
              originalEnd: event.end_time || event.start_time
            });
          }}
          aria-label="Drag event"
        >
          <MdDragIndicator size={14} className="text-gray-400" />
        </button>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(event);
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
});

CalendarEventItem.displayName = 'CalendarEventItem';

/**
 * Main CalendarView Component
 * 
 * Provides a comprehensive calendar interface with drag-and-drop functionality,
 * event management, and modal interactions for various event types.
 */
const CalendarView: React.FC = () => {
  const { handleError, handleSuccess } = useApiError();
  const { showSuccess } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { user } = useUser();
  
  // Modal state management
  const [showMealDetailsModal, setShowMealDetailsModal] = useState<boolean>(false);
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [showPlannedMealDetailsModal, setShowPlannedMealDetailsModal] = useState<boolean>(false);
  const [selectedPlannedMealId, setSelectedPlannedMealId] = useState<string | null>(null);
  const [showCookingSessionModal, setShowCookingSessionModal] = useState<boolean>(false);
  const [cookingMealId, setCookingMealId] = useState<string | null>(null);
  


  const router = useRouter();

  // useQuery for events
  const eventsQuery = useQuery({
    queryKey: ["events", (user as any)?.id],
    enabled: !!user,
    queryFn: async (): Promise<CalendarEvent[]> => {
      const response = await fetch("/api/calendar/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: (user as any)?.id }),
      });
      return response.json();
    },
  });

  const events = useMemo<CalendarEvent[]>(() => eventsQuery.data || [], [eventsQuery.data]);

  // Drag and drop functionality
  const handleEventDrop = useCallback(async ({ 
    id, 
    newStartISO, 
    originalStart, 
    originalEnd 
  }: {
    id: string;
    newStartISO: string;
    originalStart: string;
    originalEnd?: string;
  }) => {
    if (!user) return;

    // Find the event to update
    const eventIndex = events.findIndex(e => e.id === id);
    if (eventIndex === -1) return;

    const event = events[eventIndex];
    if (!event) return;

    // Optimistic update: immediately update local state
    const updatedEvents = [...events];
    const updatedEvent = {
      ...event,
      start_time: newStartISO,
      ...(event.end_time && {
        end_time: dayjs(newStartISO).add(dayjs(event.end_time).diff(dayjs(event.start_time))).toISOString()
      })
    };
    updatedEvents[eventIndex] = updatedEvent;

    // Optimistically update the query cache
    queryClient.setQueryData(["events", (user as any)?.id], updatedEvents);

    try {
      const response = await fetch("/api/calendar/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          userId: (user as any).id,
          newStart: newStartISO,
          newEnd: updatedEvent.end_time,
          updateLinkedEntity: true
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      // Show success toast with undo option
      const newDate = dayjs(newStartISO).format('ddd MMM D');
      showSuccess(`Event moved to ${newDate}`, 5000, () => {
        // Undo function
        handleEventDrop({
          id,
          newStartISO: originalStart,
          originalStart: newStartISO,
          ...(originalEnd && { originalEnd })
        });
        // Invalidate the query cache to ensure UI updates
        queryClient.invalidateQueries({ queryKey: ["events", (user as any)?.id] });
      });

    } catch (error) {
      // Rollback on error
      queryClient.setQueryData(["events", (user as any)?.id], events);
      handleError(error as Error, { 
        customMessage: 'Failed to move event. Changes reverted.' 
      });
    }
  }, [events, user, queryClient, handleError, showSuccess]);

  const { draggingId, startDrag } = useCalendarDragAndDrop({
    onDrop: handleEventDrop
  });







  const handleFitnessEventClick = async (event: CalendarEvent, type: 'workout' | 'cardio' | 'sport' | 'stretching'): Promise<void> => {
    try {
      // Determine the table name based on type
      const tableMap: Record<'workout' | 'cardio' | 'sport' | 'stretching', string> = {
        'workout': 'fitness_workouts',
        'cardio': 'fitness_cardio', 
        'sport': 'fitness_sports',
        'stretching': 'fitness_stretching'
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
          const routeMap: Record<'workout' | 'cardio' | 'sport' | 'stretching', string> = {
          'workout': '/fitness/workouts/live',
          'cardio': '/fitness/cardio/live',
          'sport': '/fitness/sports/live',
          'stretching': '/fitness/stretching/live'
        };
        const baseRoute = routeMap[type];
        
        // Create URL parameters with pre-filled data
        const params = new URLSearchParams({
          plannedId: event.source_id.toString(),
          title: sourceEntity.title || sourceEntity.activity_type || '',
          notes: sourceEntity.notes || sourceEntity.performance_notes || '',
          date: sourceEntity.date || '',
          startTime: sourceEntity.start_time || '',
          endTime: sourceEntity.end_time || ''
        });
        
        router.push(`${baseRoute}?${params.toString()}`);
              } else {
          // If it's completed/in-progress, route to the overview page
          const routeMap: Record<'workout' | 'cardio' | 'sport' | 'stretching', string> = {
          'workout': `/fitness`, // Redirect to fitness page since workout details are now in modal
          'cardio': `/fitness`, // Redirect to fitness page since cardio details are now in modal
          'sport': `/fitness/sports/${event.source_id}`,
          'stretching': `/fitness` // Redirect to fitness page since stretching details are now in modal
        };
        router.push(routeMap[type]);
      }
    } catch (error) {
      console.error('Error handling fitness event click:', error);
      handleError(error as Error, { 
        customMessage: 'Could not process event click.' 
      });
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent): Promise<void> => {
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
          queryClient.invalidateQueries({ queryKey: ["events", (user as any)?.id] });
        }
      } catch (error) {
        handleError(error as Error, { 
          customMessage: 'Could not delete event.' 
        });
      }
      return;
    }
  
    // Map source to table names
    let sourceTable: string | null = null;
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
  
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const user_id = authUser?.id;
    
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
        workoutId: event.source_id.toString(),
        user_id: user_id,
      });
    } else {
      // Call deleteEntityWithCalendarEvent with correct params for other entities
      error = await deleteEntityWithCalendarEvent({
        table: sourceTable,
        id: event.source_id.toString(),
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
      queryClient.invalidateQueries({ queryKey: ["events", (user as any)?.id] });
      handleSuccess('Event deleted successfully!');
    }
  };  

  const handlePlannedMealClick = async (event: CalendarEvent): Promise<void> => {
    try {
      // Check if source_id looks like a valid UUID
      if (!event.source_id || typeof event.source_id !== 'string') {
        handleError(new Error('Invalid meal ID.'), { 
          customMessage: 'Invalid meal ID.' 
        });
        return;
      }

      // Check if user is available
      if (!user?.id) {
        handleError(new Error('User not authenticated.'), { 
          customMessage: 'User not authenticated.' 
        });
        return;
      }

      // Set the selected planned meal and open the planned meal details modal
      // The modal will handle its own data fetching and error handling
      setSelectedPlannedMealId(event.source_id);
      setShowPlannedMealDetailsModal(true);
    } catch (error) {
      console.error('Error handling planned meal click:', error);
      handleError(error as Error, { 
        customMessage: 'Could not process meal click.' 
      });
    }
  };

  const handleEventClick = async (event: CalendarEvent): Promise<void> => {
    try {
      switch (event.source) {
        case CALENDAR_SOURCES.MEAL:
          // For regular meals, open meal details modal
          setSelectedMealId(event.source_id.toString());
          setShowMealDetailsModal(true);
          break;
        case CALENDAR_SOURCES.PLANNED_MEAL:
          // For planned meals, handle differently
          await handlePlannedMealClick(event);
          break;
        case CALENDAR_SOURCES.WORKOUT:
        case CALENDAR_SOURCES.CARDIO:
        case CALENDAR_SOURCES.SPORT:
          // For fitness events, handle based on type
          await handleFitnessEventClick(event, event.source as 'workout' | 'cardio' | 'sport' | 'stretching');
          break;
        case CALENDAR_SOURCES.EXPENSE:
          // For expenses, navigate to the expense page
          router.push(`/finances/expenses/${event.source_id}`);
          break;
        default:
          // For other events, try to navigate to the source route
          const route = getCalendarEventRoute(event.source, event.source_id);
          if (route) {
            router.push(route);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling event click:', error);
      handleError(error as Error, { 
        customMessage: 'Could not process event click.' 
      });
    }
  };

  const handleShowDayEvents = (_date: Date): void => {
    // TODO: Implement day events modal
  };

  const handleShowSelectionModalForDate = (_dateStr: string): void => {
    // TODO: Implement selection modal for date
  };

  // Loading state
  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Error state
  if (eventsQuery.isError) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Failed to load calendar events.</p>
        <Button onClick={() => eventsQuery.refetch()} className="mt-4" aria-label="Retry loading calendar events">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Quick Actions */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2 text-gray-300 flex items-center">
          <MdFlashOn className="w-5 h-5 mr-2" />
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={() => {}}
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
      
      {/* Calendar Title */}
      <h3 className="text-lg font-semibold mb-2 mt-2 text-gray-300 flex items-center">
        <MdOutlineCalendarToday className="w-5 h-5 mr-2" />
        Calendar
      </h3>

      {/* Calendar Grid */}
      <div className="w-full my-6">
        <div className="w-full">
          <div className="p-2 rounded">
            <Calendar
              onChange={(value: any) => {
                if (value instanceof Date) {
                  setSelectedDate(value);
                }
              }}
              value={selectedDate}
              locale="en-US"
              className="!w-full !text-white !max-w-none"
              tileClassName={({ date, view }: { date: Date; view: string }) => {
                if (view !== 'month') return '';
                const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
                return isSelectedDay ? 'selected-day' : '';
              }}
              {...{
                tileProps: ({ date, view }: { date: Date; view: string }) => {
                  if (view !== 'month') return {};
                  const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
                  return {
                    'data-selected': isSelectedDay,
                    className: isSelectedDay ? 'selected-day' : ''
                  };
                },
                tileContent: ({ date, view }: { date: Date; view: string }) => {
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
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleShowDayEvents(date);
                        }}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShowDayEvents(date);
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
                        const isBeingDragged = draggingId === event.id;
                        
                        return (
                          <CalendarEventItem
                            key={event.id}
                            event={event}
                            isBeingDragged={isBeingDragged}
                            isCompact={true}
                            onEventClick={handleEventClick}
                            onDelete={handleDeleteEvent}
                            onStartDrag={startDrag}
                          />
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
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleShowSelectionModalForDate(toYMD(date));
                        }}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handleShowSelectionModalForDate(toYMD(date));
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
              }
            }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showMealDetailsModal && selectedMealId && (
        <MealDetailsModal
          isOpen={showMealDetailsModal}
          mealId={selectedMealId}
          onClose={() => {
            setShowMealDetailsModal(false);
            setSelectedMealId(null);
          }}
        />
      )}

      {showPlannedMealDetailsModal && selectedPlannedMealId && (
        <PlannedMealDetailsModal
          isOpen={showPlannedMealDetailsModal}
          plannedMealId={selectedPlannedMealId}
          onClose={() => {
            setShowPlannedMealDetailsModal(false);
            setSelectedPlannedMealId(null);
          }}
        />
      )}

      {showCookingSessionModal && cookingMealId && (
        <CookingSessionModal
          isOpen={showCookingSessionModal}
          mealId={cookingMealId}
          onClose={() => {
            setShowCookingSessionModal(false);
            setCookingMealId(null);
          }}
        />
      )}
    </div>
  );
};

export default CalendarView;