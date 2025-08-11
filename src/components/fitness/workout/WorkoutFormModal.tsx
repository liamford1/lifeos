"use client";

import React from "react";
import PlannedWorkoutForm from "@/components/forms/PlannedWorkoutForm";
import { MdClose } from 'react-icons/md';
import { WorkoutFormModalComponentProps } from '@/types/fitness';

/**
 * WorkoutFormModal Component
 * 
 * Handles the planned workout form modal for creating fitness activities.
 * Extracted from PlanWorkoutModal.js to provide focused workout form management.
 * 
 * Features:
 * - Planned workout form integration
 * - Date-specific workout planning
 * - Success callback handling
 * - Clean modal interface
 * 
 * @param isOpen - Controls modal visibility
 * @param selectedDate - The date for which to plan the workout (YYYY-MM-DD format)
 * @param onClose - Callback to close the modal
 * @param onSuccess - Callback when the form is successfully submitted
 */
const WorkoutFormModal: React.FC<WorkoutFormModalComponentProps> = React.memo(({ 
  isOpen,
  selectedDate,
  onClose,
  onSuccess
}) => {
  if (!isOpen) return null;

  /**
   * Handle form success submission
   */
  const handleFormSuccess = (): void => {
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Planned Activity</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            aria-label="Close modal"
          >
            <MdClose className="w-5 h-5" />
          </button>
        </div>
        <PlannedWorkoutForm 
          onSuccess={handleFormSuccess} 
          selectedDate={selectedDate}
        />
      </div>
    </div>
  );
});

WorkoutFormModal.displayName = 'WorkoutFormModal';

export default WorkoutFormModal;
