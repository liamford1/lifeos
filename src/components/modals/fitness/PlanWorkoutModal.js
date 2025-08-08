"use client";

import { useState } from 'react';
import BaseModal from '@/components/shared/BaseModal';
import Button from '@/components/shared/Button';
import PlannedWorkoutForm from '@/components/forms/PlannedWorkoutForm';
import dynamic from "next/dynamic";
const Calendar = dynamic(() => import("lucide-react/dist/esm/icons/calendar"), { ssr: false, loading: () => <span className="inline-block w-4 h-4" /> });

export default function PlanWorkoutModal({ isOpen, onClose }) {
  const [showForm, setShowForm] = useState(false);

  const handleFormSuccess = () => {
    setShowForm(false);
    // The form will handle calendar sync internally
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Workouts"
      subtitle="Schedule and plan your fitness activities"
      icon={Calendar}
      iconBgColor="bg-indigo-500/10"
      iconColor="text-indigo-500"
      maxWidth="max-w-6xl"
      data-testid="plan-workout-modal"
    >
      <div className="space-y-6">
        {/* Calendar View - Temporarily disabled for testing */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-md font-semibold mb-3">Fitness Calendar</h4>
          <p className="text-sm text-gray-400">Calendar view temporarily disabled for testing</p>
        </div>

        {/* Add Planned Activity Button */}
        <div className="flex justify-center">
          <Button 
            onClick={() => setShowForm(!showForm)}
            variant="primary"
            size="lg"
            className="flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            {showForm ? 'Cancel' : '+ Add Planned Activity'}
          </Button>
        </div>

        {/* Planned Workout Form */}
        {showForm && (
          <div className="bg-card border border-border rounded-lg p-4">
            <h4 className="text-md font-semibold mb-3">Add Planned Activity</h4>
            <PlannedWorkoutForm onSuccess={handleFormSuccess} />
          </div>
        )}
      </div>
    </BaseModal>
  );
} 