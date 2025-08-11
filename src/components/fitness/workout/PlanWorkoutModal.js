"use client";

import { useState, useCallback } from "react";
import BaseModal from "@/components/shared/BaseModal";
import dynamic from "next/dynamic";
import { useUser } from '@/context/UserContext';
import { useQuery } from "@tanstack/react-query";
import dayjs from 'dayjs';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import { useApiError } from '@/lib/hooks/useApiError';
import { MdAdd } from 'react-icons/md';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

// Dynamic imports for sub-components
const WorkoutCalendar = dynamic(() => import('./WorkoutCalendar'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading calendar...</div>,
  ssr: false
});

const ActivitySelector = dynamic(() => import('./ActivitySelector'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading selector...</div>,
  ssr: false
});

const EventManager = dynamic(() => import('./EventManager'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading event manager...</div>,
  ssr: false
});

const WorkoutFormModal = dynamic(() => import('./WorkoutFormModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading workout form...</div>,
  ssr: false
});

const CalendarIcon = dynamic(() => import("lucide-react/dist/esm/icons/calendar"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});

/**
 * PlanWorkoutModal Component
 * 
 * Main modal component for planning workouts and managing fitness calendar.
 * Refactored from a 744-line complex component into focused sub-components.
 * 
 * Features:
 * - 2-week calendar view with drag-and-drop
 * - Activity type selection
 * - Event management (add/view)
 * - Workout form integration
 * - Fitness event navigation
 */
export default function PlanWorkoutModal({ isOpen, onClose }) {
  const { handleError } = useApiError();
  const router = useRouter();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDateForForm, setSelectedDateForForm] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [showSelectionModalForDate, setShowSelectionModalForDate] = useState(null);
  const [showDayEventsModal, setShowDayEventsModal] = useState(false);
  const [selectedDayForEvents, setSelectedDayForEvents] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const { user } = useUser();

  // Fetch calendar events for EventManager
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

  const events = eventsQuery.data || [];
  
  // Filter for fitness-related events only
  const fitnessEvents = events.filter(event => 
    event.source === CALENDAR_SOURCES.WORKOUT ||
    event.source === CALENDAR_SOURCES.CARDIO ||
    event.source === CALENDAR_SOURCES.SPORT
  );

  // Calendar event handlers
  const handleDateSelect = useCallback((date) => {
    setSelectedDate(date);
  }, []);

  const handleAddEvent = useCallback((dateStr) => {
    setSelectedDateForForm(dateStr);
    setShowForm(true);
  }, []);

  const handleViewDayEvents = useCallback((date) => {
    setSelectedDayForEvents(date);
    setShowDayEventsModal(true);
  }, []);

  // Activity selection handlers
  const handlePlanningSelection = useCallback((type, selectedDateForPlanning = null) => {
    setShowSelectionModal(false);
    setShowSelectionModalForDate(null);
    
    switch (type) {
      case 'general':
        setShowAddModal(true);
        break;
      case 'workout':
        const dateToUse = selectedDateForPlanning || selectedDate;
        const dateStr = dayjs(dateToUse).format('YYYY-MM-DD');
        setSelectedDateForForm(dateStr);
        setShowForm(true);
        break;
      default:
        break;
    }
  }, [selectedDate]);

  // Event click handler
  const handleFitnessEventClick = useCallback(async (event) => {
    try {
      // Determine the table name based on type
      const tableMap = {
        'workout': 'fitness_workouts',
        'cardio': 'fitness_cardio', 
        'sport': 'fitness_sports'
      };
      const table = tableMap[event.source];
      
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
        const baseRoute = routeMap[event.source];
        
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
        router.push(routeMap[event.source]);
      }
    } catch (error) {
      handleError(error, { 
        customMessage: 'Could not process event click.' 
      });
    }
  }, [handleError, router]);

  // Form success handler
  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setSelectedDateForForm(null);
    // Refresh the events query to show the new planned workout
    eventsQuery.refetch();
  }, [eventsQuery]);

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
      <div className="space-y-6">
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
          
          <WorkoutCalendar
            user={user}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            onEventClick={handleFitnessEventClick}
            onAddEvent={handleAddEvent}
            onViewDayEvents={handleViewDayEvents}
          />
        </div>

        {/* Sub-components */}
        <ActivitySelector
          isOpen={showSelectionModal || showSelectionModalForDate}
          selectedDate={showSelectionModalForDate}
          onSelect={handlePlanningSelection}
          onClose={() => {
            setShowSelectionModal(false);
            setShowSelectionModalForDate(null);
          }}
        />

        <EventManager
          user={user}
          isAddModalOpen={showAddModal}
          isDayEventsModalOpen={showDayEventsModal}
          selectedDayForEvents={selectedDayForEvents}
          fitnessEvents={fitnessEvents}
          onAddEventClose={() => setShowAddModal(false)}
          onDayEventsClose={() => {
            setShowDayEventsModal(false);
            setSelectedDayForEvents(null);
          }}
          onEventClick={handleFitnessEventClick}
        />

        <WorkoutFormModal
          isOpen={showForm}
          selectedDate={selectedDateForForm}
          onClose={() => {
            setShowForm(false);
            setSelectedDateForForm(null);
          }}
          onSuccess={handleFormSuccess}
        />
      </div>
    </BaseModal>
  );
}
