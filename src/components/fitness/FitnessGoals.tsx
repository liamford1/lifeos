"use client";
import React from 'react';
import { 
  CardioActivity, 
  WorkoutActivity
} from '@/types/fitness';

// Import lucide-react icons
import { Flame, Target, TrendingUp, Calendar } from "lucide-react";

/**
 * Memoized Skeleton component for charts
 */
const ChartsSkeleton: React.FC = React.memo(() => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, index) => (
        <div key={index} className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700 animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-6 bg-gray-700 rounded w-32"></div>
            <div className="h-8 bg-gray-700 rounded w-20"></div>
          </div>
          <div className="h-48 bg-gray-800 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
});

ChartsSkeleton.displayName = 'ChartsSkeleton';

/**
 * Chart metrics interface
 */
interface ChartMetrics {
  totalCaloriesBurned: number;
  totalWorkoutsThisWeek: number;
}

/**
 * Extended props for FitnessGoals component
 */
interface FitnessGoalsExtendedProps {
  dataLoading?: boolean;
  cardioData: CardioActivity[];
  workoutData: WorkoutActivity[];
}

/**
 * FitnessGoals Component
 * 
 * Displays fitness progress charts and goal tracking including:
 * - Calories burned over time
 * - Workout consistency tracking
 * - Progress visualization placeholders
 * 
 * @param dataLoading - Loading state for data
 * @param cardioData - Cardio session data for calculations
 * @param workoutData - Workout data for calculations
 */
const FitnessGoals: React.FC<FitnessGoalsExtendedProps> = React.memo(({ 
  dataLoading = false, 
  cardioData, 
  workoutData 
}) => {
  /**
   * Calculate metrics for charts
   */
  const calculateChartMetrics = (): ChartMetrics => {
    const totalCaloriesBurned = cardioData.reduce((sum: number, session: CardioActivity) => 
      sum + (session.calories_burned || 0), 0
    );
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisWeekWorkouts = workoutData.filter(w => new Date(w.date) >= weekAgo);
    const totalWorkoutsThisWeek = thisWeekWorkouts.length;
    
    return {
      totalCaloriesBurned,
      totalWorkoutsThisWeek
    };
  };

  const metrics = calculateChartMetrics();

  if (dataLoading) {
    return <ChartsSkeleton />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calories Burned Chart */}
      <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Flame className="w-5 h-5 text-orange-500 mr-2" />
            Calories Burned
          </h2>
          <span className="text-2xl font-bold text-orange-500">
            {metrics.totalCaloriesBurned.toLocaleString()}
          </span>
        </div>
        <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <TrendingUp className="w-12 h-12 mx-auto mb-2" />
            <p>Chart placeholder</p>
            <p className="text-sm">Calories over time visualization</p>
          </div>
        </div>
      </div>

      {/* Workout Consistency Chart */}
      <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Target className="w-5 h-5 text-green-500 mr-2" />
            Workout Consistency
          </h2>
          <span className="text-2xl font-bold text-green-500">
            {metrics.totalWorkoutsThisWeek}
          </span>
        </div>
        <div className="h-48 bg-gray-800 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2" />
            <p>Chart placeholder</p>
            <p className="text-sm">Workouts per week visualization</p>
          </div>
        </div>
      </div>
    </div>
  );
});

FitnessGoals.displayName = 'FitnessGoals';

export default FitnessGoals;
