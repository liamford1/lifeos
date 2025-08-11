"use client";

import React from "react";
import Button from "@/components/shared/Button";
import { MdEvent, MdFitnessCenter } from 'react-icons/md';
import dayjs from 'dayjs';

/**
 * ActivitySelector Component
 * 
 * Handles the activity type selection modal for planning workouts and events.
 * Extracted from PlanWorkoutModal.js to provide focused activity selection.
 * 
 * Features:
 * - Activity type selection (General Event vs Workout)
 * - Date-specific planning
 * - Clean modal interface
 */
const ActivitySelector = React.memo(({ 
  isOpen,
  selectedDate,
  onSelect,
  onClose
}) => {
  if (!isOpen) return null;

  const handleSelection = (type) => {
    onSelect(type, selectedDate);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-surface p-6 rounded-lg w-96">
        <h3 className="text-lg font-semibold mb-4">
          What would you like to plan?
          {selectedDate && (
            <div className="text-sm font-normal opacity-75 mt-1">
              for {dayjs(selectedDate).format('MMMM D, YYYY')}
            </div>
          )}
        </h3>
        <div className="space-y-3">
          <Button
            onClick={() => handleSelection('general')}
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
            onClick={() => handleSelection('workout')}
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
            onClick={onClose} 
            variant="secondary" 
            className="w-full"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
});

ActivitySelector.displayName = 'ActivitySelector';

export default ActivitySelector;
