'use client';

import React from 'react';
import { MdOutlineCalendarToday, MdFlashOn, MdAdd, MdRestaurant, MdFitnessCenter, MdEvent } from 'react-icons/md';
import { useRouter } from 'next/navigation';
import Button from '@/components/shared/Button';
import { CalendarHeaderProps } from '@/types/calendar';

/**
 * CalendarHeader Component
 * 
 * Contains:
 * - Quick Actions section with buttons for common tasks
 * - Calendar title and navigation
 * - Add event functionality
 * 
 * @param onAddEvent - Callback function to add a new event
 * @param onShowSelectionModal - Callback function to show the event selection modal
 * @param selectedDate - Currently selected date in the calendar
 * @param onDateChange - Callback function when date selection changes
 */
const CalendarHeader: React.FC<CalendarHeaderProps> = ({ 
  onAddEvent,
  onShowSelectionModal,
  selectedDate,
  onDateChange 
}) => {
  const router = useRouter();

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
            onClick={onShowSelectionModal}
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
    </>
  );
};

export default CalendarHeader;
