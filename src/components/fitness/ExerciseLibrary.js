"use client";
import React from 'react';
import dynamic from 'next/dynamic';

// Dynamic imports for lucide-react icons to reduce bundle size
const Activity = dynamic(() => import("lucide-react/dist/esm/icons/activity"), { ssr: false });
const Timer = dynamic(() => import("lucide-react/dist/esm/icons/timer"), { ssr: false });
const Calendar = dynamic(() => import("lucide-react/dist/esm/icons/calendar"), { ssr: false });

// Dynamic import for CalendarIconClient
const CalendarIconClient = dynamic(() => import("@/components/client/CalendarIconClient"), { ssr: false });

// Memoized Skeleton component for quick actions
const QuickActionsSkeleton = React.memo(() => {
  return (
    <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="h-6 bg-gray-700 rounded mb-4 w-48"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="p-5 bg-gray-800 rounded-lg animate-pulse">
            <div className="w-6 h-6 bg-gray-700 rounded mb-3"></div>
            <div className="h-6 bg-gray-700 rounded mb-2 w-32"></div>
            <div className="h-4 bg-gray-700 rounded w-40"></div>
          </div>
        ))}
      </div>
    </div>
  );
});

QuickActionsSkeleton.displayName = 'QuickActionsSkeleton';

/**
 * ExerciseLibrary Component
 * 
 * Displays fitness tools and quick actions including:
 * - Recent activity viewer
 * - Daily activity tracking
 * - Workout planning tools
 * 
 * @param {Object} props
 * @param {boolean} props.dataLoading - Loading state for data
 * @param {Function} props.onOpenRecentActivity - Callback to open recent activity modal
 * @param {Function} props.onOpenDailyActivity - Callback to open daily activity modal
 * @param {Function} props.onOpenPlanWorkout - Callback to open workout planning modal
 */
const ExerciseLibrary = React.memo(({ 
  dataLoading, 
  onOpenRecentActivity, 
  onOpenDailyActivity, 
  onOpenPlanWorkout 
}) => {
  if (dataLoading) {
    return <QuickActionsSkeleton />;
  }

  return (
    <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Activity className="w-5 h-5 text-blue-500 mr-2" />
        Fitness Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <button 
          onClick={onOpenRecentActivity}
          className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group text-left w-full"
        >
          <Activity className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-lg block mb-1">Recent Activity</span>
          <div className="text-sm text-gray-400">All workouts, cardio & sports</div>
        </button>
        
        <button 
          onClick={onOpenDailyActivity}
          className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-yellow-500 group text-left w-full"
        >
          <Timer className="w-6 h-6 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-lg block mb-1">Daily Activity</span>
          <div className="text-sm text-gray-400">Steps, mood, energy</div>
        </button>
        
        <button 
          onClick={onOpenPlanWorkout}
          className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-indigo-500 group text-left w-full"
        >
          <CalendarIconClient className="w-6 h-6 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
          <span className="font-semibold text-lg block mb-1">Plan Workouts</span>
          <div className="text-sm text-gray-400">Schedule fitness sessions</div>
        </button>
      </div>
    </div>
  );
});

ExerciseLibrary.displayName = 'ExerciseLibrary';

export default ExerciseLibrary;
