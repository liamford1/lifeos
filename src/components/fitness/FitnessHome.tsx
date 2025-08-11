"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCardioSessions } from '@/lib/hooks/useCardioSessions';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';
import Button from '@/components/shared/Button';
import dynamic from 'next/dynamic';
import { 
  CardioActivity, 
  WorkoutActivity, 
  SportActivity, 
  FitnessHomeProps 
} from '@/types/fitness';

// Import lucide-react icon
import { Activity } from "lucide-react";

// Dynamic imports for heavy modal components
const RecentActivityModal = dynamic(() => import('@/components/modals/fitness/RecentActivityModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading activity...</div>,
  ssr: false
});

const StretchingMobilityModal = dynamic(() => import('@/components/modals/fitness/StretchingMobilityModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading stretching...</div>,
  ssr: false
});

const DailyActivityModal = dynamic(() => import('@/components/modals/fitness/DailyActivityModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading daily activity...</div>,
  ssr: false
});

const PlanWorkoutModal = dynamic(() => import('@/components/modals/fitness/PlanWorkoutModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading workout planner...</div>,
  ssr: false
});

const WorkoutSessionModal = dynamic(() => import('@/components/modals/fitness/WorkoutSessionModal'), {
  loading: () => <div className="animate-pulse bg-surface rounded-lg p-4">Loading workout session...</div>,
  ssr: false
});

// Import extracted components
import FitnessStats from './FitnessStats';
import WorkoutPlanner from './WorkoutPlanner';
import ExerciseLibrary from './ExerciseLibrary';
import FitnessGoals from './FitnessGoals';

/**
 * FitnessHome Component
 * 
 * Main container component that coordinates all fitness dashboard functionality:
 * - Data loading and state management
 * - Modal coordination
 * - Layout and component composition
 * - User authentication handling
 * 
 * This component serves as the main orchestrator for the fitness dashboard,
 * breaking down the original 760-line FitnessHomeContent into focused components.
 */
const FitnessHome: React.FC<FitnessHomeProps> = React.memo(() => {
  const { user, loading } = useUser();
  const router = useRouter();
  const { fetchCardioSessions } = useCardioSessions();
  const { fetchWorkouts } = useWorkouts();
  const { fetchSportsSessions } = useSportsSessions();
  
  const [cardioData, setCardioData] = useState<CardioActivity[]>([]);
  const [workoutData, setWorkoutData] = useState<WorkoutActivity[]>([]);
  const [sportsData, setSportsData] = useState<SportActivity[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);

  // Modal states
  const [showStartActivityModal, setShowStartActivityModal] = useState<boolean>(false);
  const [showRecentActivityModal, setShowRecentActivityModal] = useState<boolean>(false);
  const [showStretchingMobilityModal, setShowStretchingMobilityModal] = useState<boolean>(false);
  const [stretchingModalMode, setStretchingModalMode] = useState<'list' | 'session'>('list');
  const [stretchingModalSessionId, setStretchingModalSessionId] = useState<string | null>(null);
  const [showDailyActivityModal, setShowDailyActivityModal] = useState<boolean>(false);
  const [showPlanWorkoutModal, setShowPlanWorkoutModal] = useState<boolean>(false);
  const [showWorkoutSessionModal, setShowWorkoutSessionModal] = useState<boolean>(false);

  const loadFitnessData = useCallback(async (): Promise<void> => {
    if (!user?.id) return;
    
    setDataLoading(true);
    try {
      const [cardio, workouts, sports] = await Promise.all([
        fetchCardioSessions(user.id),
        fetchWorkouts(user.id),
        fetchSportsSessions(user.id)
      ]);
      
      setCardioData(cardio || []);
      setWorkoutData(workouts || []);
      setSportsData(sports || []);
    } catch (error) {
      // Silent error handling for fitness data loading
      // Data will be retried on next render
    } finally {
      setDataLoading(false);
    }
  }, [user?.id, fetchCardioSessions, fetchWorkouts, fetchSportsSessions]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
      return;
    }

    if (user?.id) {
      loadFitnessData();
    }
  }, [user, loading, router, loadFitnessData]);

  const handleOpenStretchingModal = (): void => {
    setStretchingModalMode('list');
    setStretchingModalSessionId(null);
    setShowStretchingMobilityModal(true);
  };

  const handleOpenRecentActivity = (): void => {
    setShowRecentActivityModal(true);
  };

  const handleOpenDailyActivity = (): void => {
    setShowDailyActivityModal(true);
  };

  const handleOpenPlanWorkout = (): void => {
    setShowPlanWorkoutModal(true);
  };



  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Fitness Dashboard</h1>
        <p className="text-gray-400">Track your workouts, cardio, and sports activities</p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Button
          onClick={() => router.push('/fitness/workouts/live')}
          className="h-16 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
          aria-label="Start a new workout session"
        >
          <Activity className="w-5 h-5 mr-2" />
          Start Workout
        </Button>
        
        <Button
          onClick={() => router.push('/fitness/cardio/live')}
          className="h-16 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
          aria-label="Start a new cardio session"
        >
          <Activity className="w-5 h-5 mr-2" />
          Start Cardio
        </Button>
        
        <Button
          onClick={handleOpenStretchingModal}
          className="h-16 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          aria-label="Open stretching and mobility exercises"
        >
          <Activity className="w-5 h-5 mr-2" />
          Stretching
        </Button>
        
        <Button
          onClick={handleOpenPlanWorkout}
          className="h-16 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
          aria-label="Plan a new workout"
        >
          <Activity className="w-5 h-5 mr-2" />
          Plan Workout
        </Button>
      </div>

      {/* Stats and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
                    <FitnessStats 
            cardioData={cardioData}
            workoutData={workoutData}
            sportsData={sportsData}
            dataLoading={dataLoading}
          />
        </div>
        
        <div>
          <FitnessGoals 
            cardioData={cardioData}
            workoutData={workoutData}
            dataLoading={dataLoading}
          />
        </div>
      </div>

      {/* Workout Planner and Exercise Library */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WorkoutPlanner 
          showStartActivityModal={showStartActivityModal}
          setShowStartActivityModal={setShowStartActivityModal}
          onOpenStretchingModal={handleOpenStretchingModal}
        />
        
        <ExerciseLibrary 
          dataLoading={dataLoading}
          onOpenRecentActivity={handleOpenRecentActivity}
          onOpenDailyActivity={handleOpenDailyActivity}
          onOpenPlanWorkout={handleOpenPlanWorkout}
        />
      </div>

      {/* Modals */}
      {showRecentActivityModal && (
        <RecentActivityModal
          {...{
            isOpen: showRecentActivityModal,
            onClose: () => setShowRecentActivityModal(false),
            onOpenStretchingModal: handleOpenStretchingModal,
            cardioData,
            workoutData,
            sportsData
          }}
        />
      )}

      {showStretchingMobilityModal && (
        <StretchingMobilityModal
          {...{
            isOpen: showStretchingMobilityModal,
            mode: stretchingModalMode,
            sessionId: stretchingModalSessionId,
            onClose: () => setShowStretchingMobilityModal(false)
          }}
        />
      )}

      {showDailyActivityModal && (
        <DailyActivityModal
          {...{
            isOpen: showDailyActivityModal,
            onClose: () => setShowDailyActivityModal(false),
            date: new Date()
          }}
        />
      )}

      {showPlanWorkoutModal && (
        <PlanWorkoutModal
          {...{
            isOpen: showPlanWorkoutModal,
            onClose: () => setShowPlanWorkoutModal(false),
            onWorkoutPlanned: () => {
              setShowPlanWorkoutModal(false);
              loadFitnessData();
            }
          }}
        />
      )}

      {showWorkoutSessionModal && (
        <WorkoutSessionModal
          {...{
            isOpen: showWorkoutSessionModal,
            onClose: () => setShowWorkoutSessionModal(false),
            onSessionComplete: () => {
              setShowWorkoutSessionModal(false);
              loadFitnessData();
            }
          }}
        />
      )}
    </div>
  );
});

FitnessHome.displayName = 'FitnessHome';

export default FitnessHome;
