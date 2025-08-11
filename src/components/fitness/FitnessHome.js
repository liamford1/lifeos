"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCardioSessions } from '@/lib/hooks/useCardioSessions';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';
import Button from '@/components/shared/Button';
import dynamic from 'next/dynamic';

// Dynamic imports for lucide-react icons to reduce bundle size
const Activity = dynamic(() => import("lucide-react/dist/esm/icons/activity"), { ssr: false });

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
const FitnessHome = React.memo(() => {
  const { user, loading } = useUser();
  const router = useRouter();
  const { fetchCardioSessions } = useCardioSessions();
  const { fetchWorkouts } = useWorkouts();
  const { fetchSportsSessions } = useSportsSessions();
  
  const [cardioData, setCardioData] = useState([]);
  const [workoutData, setWorkoutData] = useState([]);
  const [sportsData, setSportsData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modal states
  const [showStartActivityModal, setShowStartActivityModal] = useState(false);
  const [showRecentActivityModal, setShowRecentActivityModal] = useState(false);
  const [showStretchingMobilityModal, setShowStretchingMobilityModal] = useState(false);
  const [stretchingModalMode, setStretchingModalMode] = useState('list');
  const [stretchingModalSessionId, setStretchingModalSessionId] = useState(null);
  const [showDailyActivityModal, setShowDailyActivityModal] = useState(false);
  const [showPlanWorkoutModal, setShowPlanWorkoutModal] = useState(false);
  const [showWorkoutSessionModal, setShowWorkoutSessionModal] = useState(false);

  const loadFitnessData = useCallback(async () => {
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
      console.error('Error loading fitness data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [user?.id, fetchCardioSessions, fetchWorkouts, fetchSportsSessions]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      loadFitnessData();
    }
  }, [user, loadFitnessData]);

  // Modal handlers
  const handleOpenStretchingModal = () => {
    setShowStretchingMobilityModal(true);
  };

  const handleOpenRecentActivity = () => {
    setShowRecentActivityModal(true);
  };

  const handleOpenDailyActivity = () => {
    setShowDailyActivityModal(true);
  };

  const handleOpenPlanWorkout = () => {
    setShowPlanWorkoutModal(true);
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center" data-testid="home-header">
          <Activity className="w-8 h-8 text-blue-500 mr-3" />
          Fitness Dashboard
        </h1>
        
        {/* Start Activity Button */}
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowStartActivityModal(true)}
            variant="primary"
            className="flex items-center gap-2"
            data-testid="start-activity-button"
          >
            <Activity className="w-4 h-4" />
            Start Activity
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      <FitnessGoals 
        dataLoading={dataLoading}
        cardioData={cardioData}
        workoutData={workoutData}
      />

      {/* Metrics Grid */}
      <FitnessStats 
        cardioData={cardioData}
        workoutData={workoutData}
        sportsData={sportsData}
        dataLoading={dataLoading}
      />

      {/* Quick Actions Section */}
      <ExerciseLibrary 
        dataLoading={dataLoading}
        onOpenRecentActivity={handleOpenRecentActivity}
        onOpenDailyActivity={handleOpenDailyActivity}
        onOpenPlanWorkout={handleOpenPlanWorkout}
      />

      {/* Empty State */}
      {!dataLoading && cardioData.length === 0 && workoutData.length === 0 && sportsData.length === 0 && (
        <div className="bg-surface rounded-xl p-8 text-center border border-gray-700">
          <Activity className="w-16 h-16 text-gray-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Welcome to your Fitness Dashboard!</h3>
          <p className="text-gray-400 mb-6">
            Start tracking your fitness journey by logging your first workout, cardio session, or sports activity.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button 
              onClick={() => setShowStartActivityModal(true)}
              variant="primary"
              className="flex items-center gap-2"
            >
              <Activity className="w-4 h-4" />
              Start Activity
            </Button>
          </div>
        </div>
      )}

      {/* Workout Planner - Activity Start Modals */}
      <WorkoutPlanner 
        showStartActivityModal={showStartActivityModal}
        setShowStartActivityModal={setShowStartActivityModal}
        onOpenStretchingModal={handleOpenStretchingModal}
      />

      {/* Fitness Modals */}
      <RecentActivityModal 
        isOpen={showRecentActivityModal} 
        onClose={() => setShowRecentActivityModal(false)}
        onOpenStretchingModal={(mode, sessionId) => {
          setStretchingModalMode(mode);
          setStretchingModalSessionId(sessionId);
          setShowRecentActivityModal(false);
          setShowStretchingMobilityModal(true);
        }}
      />
      
      <StretchingMobilityModal 
        isOpen={showStretchingMobilityModal} 
        onClose={() => setShowStretchingMobilityModal(false)}
        initialMode={stretchingModalMode}
        initialSessionId={stretchingModalSessionId}
      />
      
      <DailyActivityModal 
        isOpen={showDailyActivityModal} 
        onClose={() => setShowDailyActivityModal(false)} 
      />
      
      <PlanWorkoutModal 
        isOpen={showPlanWorkoutModal} 
        onClose={() => setShowPlanWorkoutModal(false)} 
      />
      
      <WorkoutSessionModal 
        isOpen={showWorkoutSessionModal} 
        onClose={() => setShowWorkoutSessionModal(false)} 
      />
    </div>
  );
});

FitnessHome.displayName = 'FitnessHome';

export default FitnessHome;
