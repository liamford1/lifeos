"use client";
import React from 'react';
import { 
  CardioActivity, 
  WorkoutActivity, 
  SportActivity, 
  FitnessStatsProps, 
  WeeklyMetrics 
} from '@/types/fitness';

// Import lucide-react icons
import { Dumbbell, Flame, HeartPulse, Goal } from "lucide-react";

/**
 * Memoized Skeleton component for metrics
 */
const MetricsSkeleton: React.FC = React.memo(() => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700 animate-pulse">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-4 bg-gray-700 rounded mb-2 w-20"></div>
              <div className="h-8 bg-gray-700 rounded mb-2 w-16"></div>
              <div className="h-4 bg-gray-700 rounded w-24"></div>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
});

MetricsSkeleton.displayName = 'MetricsSkeleton';

/**
 * FitnessStats Component
 * 
 * Displays key fitness metrics and statistics including:
 * - Weekly workout count
 * - Calories burned
 * - Most common activity type
 * - Cardio & sports sessions
 * 
 * @param cardioData - Cardio session data
 * @param workoutData - Workout data
 * @param sportsData - Sports session data
 * @param dataLoading - Loading state for data
 */
const FitnessStats: React.FC<FitnessStatsProps> = React.memo(({ 
  cardioData, 
  workoutData, 
  sportsData, 
  dataLoading = false 
}) => {
  /**
   * Get data for the current week
   */
  const getThisWeekData = (): {
    thisWeekWorkouts: WorkoutActivity[];
    thisWeekCardio: CardioActivity[];
    thisWeekSports: SportActivity[];
  } => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekWorkouts = workoutData.filter(w => new Date(w.date) >= weekAgo);
    const thisWeekCardio = cardioData.filter(c => new Date(c.date) >= weekAgo);
    const thisWeekSports = sportsData.filter(s => new Date(s.date) >= weekAgo);
    
    return { thisWeekWorkouts, thisWeekCardio, thisWeekSports };
  };

  /**
   * Calculate metrics from the data
   */
  const calculateMetrics = (): WeeklyMetrics => {
    const { thisWeekWorkouts, thisWeekCardio, thisWeekSports } = getThisWeekData();
    
    const totalWorkoutsThisWeek = thisWeekWorkouts.length;
    const totalCardioThisWeek = thisWeekCardio.length;
    const totalSportsThisWeek = thisWeekSports.length;
    
    const totalCaloriesBurned = cardioData.reduce((sum: number, session: CardioActivity) => 
      sum + (session.calories_burned || 0), 0
    );
    
    const thisWeekCalories = thisWeekCardio.reduce((sum: number, session: CardioActivity) => 
      sum + (session.calories_burned || 0), 0
    );
    
    // Find most common activity type
    const activityTypes = cardioData.map(c => c.activity_type).filter(Boolean);
    const mostCommonActivity = activityTypes.length > 0 
      ? activityTypes.sort((a, b) => 
          activityTypes.filter(v => v === a).length - 
          activityTypes.filter(v => v === b).length
        ).pop() || 'No activities yet'
      : 'No activities yet';
    
    return {
      totalWorkoutsThisWeek,
      totalCardioThisWeek,
      totalSportsThisWeek,
      totalCaloriesBurned,
      thisWeekCalories,
      mostCommonActivity
    };
  };

  const metrics = calculateMetrics();

  if (dataLoading) {
    return <MetricsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Weekly Workouts */}
      <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">This Week</p>
            <p className="text-2xl font-bold">{metrics.totalWorkoutsThisWeek}</p>
            <p className="text-sm text-gray-500">Workouts</p>
          </div>
          <Dumbbell className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Weekly Calories */}
      <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">This Week</p>
            <p className="text-2xl font-bold">{metrics.thisWeekCalories.toLocaleString()}</p>
            <p className="text-sm text-gray-500">Calories Burned</p>
          </div>
          <Flame className="w-8 h-8 text-orange-500" />
        </div>
      </div>

      {/* Most Common Activity */}
      <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Most Common</p>
            <p className="text-lg font-bold truncate">{metrics.mostCommonActivity}</p>
            <p className="text-sm text-gray-500">Activity Type</p>
          </div>
          <HeartPulse className="w-8 h-8 text-red-500" />
        </div>
      </div>

      {/* Weekly Cardio & Sports */}
      <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">This Week</p>
            <p className="text-2xl font-bold">{metrics.totalCardioThisWeek + metrics.totalSportsThisWeek}</p>
            <p className="text-sm text-gray-500">Cardio & Sports</p>
          </div>
          <Goal className="w-8 h-8 text-green-500" />
        </div>
      </div>
    </div>
  );
});

FitnessStats.displayName = 'FitnessStats';

export default FitnessStats;
