"use client";
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CalendarIconClient as CalendarIcon } from "@/components/client/CalendarIconClient";
import Activity from "lucide-react/dist/esm/icons/activity";
import Dumbbell from "lucide-react/dist/esm/icons/dumbbell";
import HeartPulse from "lucide-react/dist/esm/icons/heart-pulse";
import Goal from "lucide-react/dist/esm/icons/goal";
import StretchHorizontal from "lucide-react/dist/esm/icons/stretch-horizontal";
import Timer from "lucide-react/dist/esm/icons/timer";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Flame from "lucide-react/dist/esm/icons/flame";
import Target from "lucide-react/dist/esm/icons/target";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import X from "lucide-react/dist/esm/icons/x";
import { useCardioSessions } from '@/lib/hooks/useCardioSessions';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';
import { useToast } from '@/components/client/Toast';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import { supabase } from '@/lib/supabaseClient';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useCardioSession } from '@/context/CardioSessionContext';
import RecentActivityModal from '@/components/modals/fitness/RecentActivityModal';
import StretchingMobilityModal from '@/components/modals/fitness/StretchingMobilityModal';
import DailyActivityModal from '@/components/modals/fitness/DailyActivityModal';
import PlanWorkoutModal from '@/components/modals/fitness/PlanWorkoutModal';
import { useSportsSession } from '@/context/SportsSessionContext';

// Skeleton components for dashboard sections
function MetricsSkeleton() {
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
}

function ChartsSkeleton() {
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
}

function QuickActionsSkeleton() {
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
}

export default function FitnessHomeContent() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { fetchCardioSessions } = useCardioSessions();
  const { fetchWorkouts } = useWorkouts();
  const { fetchSportsSessions } = useSportsSessions();
  const { showSuccess, showError } = useToast();
  const { refreshWorkout } = useWorkoutSession();
  const { refreshCardio } = useCardioSession();
  const { refreshSports } = useSportsSession();
  
  const [cardioData, setCardioData] = useState([]);
  const [workoutData, setWorkoutData] = useState([]);
  const [sportsData, setSportsData] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Modal states
  const [showRecentActivityModal, setShowRecentActivityModal] = useState(false);
  const [showStretchingMobilityModal, setShowStretchingMobilityModal] = useState(false);
  const [showDailyActivityModal, setShowDailyActivityModal] = useState(false);
  const [showPlanWorkoutModal, setShowPlanWorkoutModal] = useState(false);
  const [showStartActivityModal, setShowStartActivityModal] = useState(false);

  // Inline form states
  const [showWorkoutForm, setShowWorkoutForm] = useState(false);
  const [showCardioForm, setShowCardioForm] = useState(false);
  const [workoutFormData, setWorkoutFormData] = useState({
    title: '',
    notes: ''
  });
  const [cardioFormData, setCardioFormData] = useState({
    activityType: '',
    location: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

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

  // Calculate metrics
  const getThisWeekData = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const thisWeekWorkouts = workoutData.filter(w => new Date(w.date) >= weekAgo);
    const thisWeekCardio = cardioData.filter(c => new Date(c.date) >= weekAgo);
    const thisWeekSports = sportsData.filter(s => new Date(s.date) >= weekAgo);
    
    return { thisWeekWorkouts, thisWeekCardio, thisWeekSports };
  };

  const calculateMetrics = () => {
    const { thisWeekWorkouts, thisWeekCardio, thisWeekSports } = getThisWeekData();
    
    const totalWorkoutsThisWeek = thisWeekWorkouts.length;
    const totalCardioThisWeek = thisWeekCardio.length;
    const totalSportsThisWeek = thisWeekSports.length;
    
    const totalCaloriesBurned = cardioData.reduce((sum, session) => 
      sum + (session.calories_burned || 0), 0
    );
    
    const thisWeekCalories = thisWeekCardio.reduce((sum, session) => 
      sum + (session.calories_burned || 0), 0
    );
    
    // Find most common activity type
    const activityTypes = cardioData.map(c => c.activity_type).filter(Boolean);
    const mostCommonActivity = activityTypes.length > 0 
      ? activityTypes.sort((a, b) => 
          activityTypes.filter(v => v === a).length - 
          activityTypes.filter(v => v === b).length
        ).pop()
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

  // Handle workout form submission
  const handleStartWorkout = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!workoutFormData.title.trim()) {
      setFormError('Workout title is required.');
      return;
    }
    setFormLoading(true);
    
    // Check for existing in-progress workout
    const { data: existingWorkout } = await supabase
      .from('fitness_workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('in_progress', true)
      .maybeSingle();
    
    if (existingWorkout) {
      setFormError('You already have an active workout session.');
      setFormLoading(false);
      return;
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const workoutData = {
      user_id: user.id,
      title: workoutFormData.title.trim(),
      notes: workoutFormData.notes.trim(),
      in_progress: true,
      start_time: now.toISOString(),
      date: today,
    };

    const { data, error } = await supabase
      .from('fitness_workouts')
      .insert(workoutData)
      .select()
      .single();
    
    setFormLoading(false);
    if (!error && data) {
      showSuccess('Workout created! Redirecting to workout...');
      setShowWorkoutForm(false);
      setWorkoutFormData({ title: '', notes: '' });
      // Refresh the workout session context to update navbar
      await refreshWorkout();
      // Redirect directly to the session page
      setTimeout(() => {
        router.push(`/fitness/workouts/${data.id}/session`);
      }, 1500);
    } else {
      setFormError(error?.message || 'Failed to start workout');
    }
  };

  // Handle cardio form submission
  const handleStartCardio = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!cardioFormData.activityType.trim()) {
      setFormError('Activity type is required.');
      return;
    }
    setFormLoading(true);
    
    // Check for existing in-progress cardio
    const { data: existingCardio } = await supabase
      .from('fitness_cardio')
      .select('*')
      .eq('user_id', user.id)
      .eq('in_progress', true)
      .maybeSingle();
    
    if (existingCardio) {
      setFormError('You already have an active cardio session.');
      setFormLoading(false);
      return;
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const cardioData = {
      user_id: user.id,
      activity_type: cardioFormData.activityType.trim(),
      notes: cardioFormData.notes.trim(),
      location: cardioFormData.location.trim(),
      in_progress: true,
      start_time: now.toISOString(),
      date: today,
    };

    const { data, error } = await supabase
      .from('fitness_cardio')
      .insert(cardioData)
      .select()
      .single();
    
    setFormLoading(false);
    if (!error && data) {
      showSuccess('Cardio session created! Redirecting to session...');
      setShowCardioForm(false);
      setCardioFormData({ activityType: '', location: '', notes: '' });
      // Refresh the cardio session context to update navbar
      await refreshCardio();
      // Redirect directly to the session page
      setTimeout(() => {
        router.push(`/fitness/cardio/${data.id}/session`);
      }, 1500);
    } else {
      setFormError(error?.message || 'Failed to start cardio session');
    }
  };

  const metrics = calculateMetrics();

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

      {/* Start Activity Modal */}
      {showStartActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Activity className="w-5 h-5 text-blue-500 mr-2" />
                Start New Activity
              </h2>
              <button
                onClick={() => setShowStartActivityModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowStartActivityModal(false);
                  setShowWorkoutForm(true);
                }}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group text-left"
              >
                <div className="flex items-center">
                  <Dumbbell className="w-6 h-6 text-blue-500 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-lg block">Start Workout</span>
                    <div className="text-sm text-gray-400">Weight training, strength exercises</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowStartActivityModal(false);
                  setShowCardioForm(true);
                }}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-red-500 group text-left"
              >
                <div className="flex items-center">
                  <HeartPulse className="w-6 h-6 text-red-500 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-lg block">Start Cardio</span>
                    <div className="text-sm text-gray-400">Running, cycling, swimming</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowStartActivityModal(false);
                  router.push('/fitness/sports/live');
                }}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-green-500 group text-left"
              >
                <div className="flex items-center">
                  <Goal className="w-6 h-6 text-green-500 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-lg block">Start Sports</span>
                    <div className="text-sm text-gray-400">Basketball, soccer, tennis, golf</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Workout Form Modal */}
      {showWorkoutForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Dumbbell className="w-5 h-5 text-blue-500 mr-2" />
                Start New Workout
              </h2>
              <button
                onClick={() => setShowWorkoutForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {formError && <div className="text-red-500 mb-4 text-sm">{formError}</div>}
            
            <form onSubmit={handleStartWorkout} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Workout Title *</label>
                <FormInput
                  value={workoutFormData.title}
                  onChange={e => setWorkoutFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Push Day, Full Body, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <FormTextarea
                  value={workoutFormData.notes}
                  onChange={e => setWorkoutFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes or goals for this workout"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  variant="primary" 
                  loading={formLoading}
                  disabled={formLoading}
                  className="flex-1"
                >
                  Start Workout
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowWorkoutForm(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Cardio Form Modal */}
      {showCardioForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <HeartPulse className="w-5 h-5 text-red-500 mr-2" />
                Start Cardio Session
              </h2>
              <button
                onClick={() => setShowCardioForm(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {formError && <div className="text-red-500 mb-4 text-sm">{formError}</div>}
            
            <form onSubmit={handleStartCardio} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Activity Type *</label>
                <FormInput
                  value={cardioFormData.activityType}
                  onChange={e => setCardioFormData(prev => ({ ...prev, activityType: e.target.value }))}
                  placeholder="e.g. Running, Cycling, Swimming, Walking"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location (optional)</label>
                <FormInput
                  value={cardioFormData.location}
                  onChange={e => setCardioFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g. Central Park, Gym, Home"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <FormTextarea
                  value={cardioFormData.notes}
                  onChange={e => setCardioFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes or goals for this session"
                  rows={3}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button 
                  type="submit" 
                  variant="success" 
                  loading={formLoading}
                  disabled={formLoading}
                  className="flex-1"
                >
                  Start Cardio
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowCardioForm(false)}
                  disabled={formLoading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Charts Section */}
      {dataLoading ? (
        <ChartsSkeleton />
      ) : (
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
      )}

      {/* Metrics Grid */}
      {dataLoading ? (
        <MetricsSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      )}

      {/* Quick Actions Section */}
      {dataLoading ? (
        <QuickActionsSkeleton />
      ) : (
        <div className="bg-surface rounded-xl p-6 shadow-lg border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            Fitness Tools
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => setShowRecentActivityModal(true)}
              className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group text-left w-full"
            >
              <Activity className="w-6 h-6 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg block mb-1">Recent Activity</span>
              <div className="text-sm text-gray-400">All workouts, cardio & sports</div>
            </button>
            
            <button 
              onClick={() => setShowStretchingMobilityModal(true)}
              className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-purple-500 group text-left w-full"
            >
              <StretchHorizontal className="w-6 h-6 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg block mb-1">Stretching / Mobility</span>
              <div className="text-sm text-gray-400">Yoga, rehab, cooldowns</div>
            </button>
            
            <button 
              onClick={() => setShowDailyActivityModal(true)}
              className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-yellow-500 group text-left w-full"
            >
              <Timer className="w-6 h-6 text-yellow-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg block mb-1">Daily Activity</span>
              <div className="text-sm text-gray-400">Steps, mood, energy</div>
            </button>
            
            <button 
              onClick={() => setShowPlanWorkoutModal(true)}
              className="block p-5 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-indigo-500 group text-left w-full"
            >
              <CalendarIcon className="w-6 h-6 text-indigo-500 mb-3 group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-lg block mb-1">Plan Workouts</span>
              <div className="text-sm text-gray-400">Schedule fitness sessions</div>
            </button>
          </div>
        </div>
      )}

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

      {/* Fitness Modals */}
      <RecentActivityModal 
        isOpen={showRecentActivityModal} 
        onClose={() => setShowRecentActivityModal(false)} 
      />
      
      <StretchingMobilityModal 
        isOpen={showStretchingMobilityModal} 
        onClose={() => setShowStretchingMobilityModal(false)} 
      />
      
      <DailyActivityModal 
        isOpen={showDailyActivityModal} 
        onClose={() => setShowDailyActivityModal(false)} 
      />
      
      <PlanWorkoutModal 
        isOpen={showPlanWorkoutModal} 
        onClose={() => setShowPlanWorkoutModal(false)} 
      />
    </div>
  );
} 