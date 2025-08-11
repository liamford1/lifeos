"use client";

/**
 * PlanWorkoutModal Component
 * 
 * This component has been refactored to use a modular structure.
 * The original 744-line component has been broken down into focused components:
 * 
 * - PlanWorkoutModal: Main modal and coordination (src/components/fitness/workout/PlanWorkoutModal.js)
 * - WorkoutCalendar: 2-week calendar view with drag-and-drop (src/components/fitness/workout/WorkoutCalendar.js)
 * - ActivitySelector: Activity type selection modal (src/components/fitness/workout/ActivitySelector.js)
 * - EventManager: Add event and day events modals (src/components/fitness/workout/EventManager.js)
 * - WorkoutFormModal: Planned workout form modal (src/components/fitness/workout/WorkoutFormModal.js)
 * 
 * This wrapper maintains the same API for parent components while
 * delegating all functionality to the new modular structure.
 */

import { PlanWorkoutModal as WorkoutModal } from '@/components/fitness/workout';

export default function PlanWorkoutModal(props) {
  return <WorkoutModal {...props} />;
}
