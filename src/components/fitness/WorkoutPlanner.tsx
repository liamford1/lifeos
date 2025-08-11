"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useToast } from '@/components/client/Toast';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useCardioSession } from '@/context/CardioSessionContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';

// Import lucide-react icons
import { 
  Activity, 
  Dumbbell, 
  HeartPulse, 
  Goal, 
  StretchHorizontal, 
  X 
} from "lucide-react";

/**
 * Workout form data interface
 */
interface WorkoutFormData {
  title: string;
  notes: string;
}

/**
 * Cardio form data interface
 */
interface CardioFormData {
  activityType: string;
  location: string;
  notes: string;
}

/**
 * Props for WorkoutPlanner component
 */
interface WorkoutPlannerProps {
  showStartActivityModal: boolean;
  setShowStartActivityModal: (show: boolean) => void;
  onOpenStretchingModal?: () => void;
}

/**
 * WorkoutPlanner Component
 * 
 * Handles activity start functionality including:
 * - Start activity modal with activity type selection
 * - Workout form creation and submission
 * - Cardio form creation and submission
 * - Form validation and error handling
 * 
 * @param showStartActivityModal - Controls start activity modal visibility
 * @param setShowStartActivityModal - Function to control start activity modal
 * @param onOpenStretchingModal - Callback to open stretching modal
 */
const WorkoutPlanner: React.FC<WorkoutPlannerProps> = React.memo(({ 
  showStartActivityModal, 
  setShowStartActivityModal,
  onOpenStretchingModal 
}) => {
  const { user } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { refreshWorkout } = useWorkoutSession();
  const { refreshCardio } = useCardioSession();

  // Form states
  const [showWorkoutForm, setShowWorkoutForm] = useState<boolean>(false);
  const [showCardioForm, setShowCardioForm] = useState<boolean>(false);
  const [workoutFormData, setWorkoutFormData] = useState<WorkoutFormData>({
    title: '',
    notes: ''
  });
  const [cardioFormData, setCardioFormData] = useState<CardioFormData>({
    activityType: '',
    location: '',
    notes: ''
  });
  const [formLoading, setFormLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  /**
   * Handle workout form submission
   */
  const handleStartWorkout = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError('');
    if (!workoutFormData.title.trim()) {
      setFormError('Workout title is required.');
      return;
    }
    setFormLoading(true);
    
    try {
      // Check for existing in-progress workout
      const { data: existingWorkout } = await supabase
        .from('fitness_workouts')
        .select('*')
        .eq('user_id', (user as any).id)
        .eq('in_progress', true)
        .maybeSingle();
      
      if (existingWorkout) {
        setFormError('You already have an active workout session.');
        setFormLoading(false);
        return;
      }
      
      const now = new Date();
      const [today] = now.toISOString().split('T');
      const workoutData = {
        user_id: (user as any).id,
        title: workoutFormData.title.trim(),
        notes: workoutFormData.notes.trim(),
        in_progress: true,
        start_time: now.toISOString(),
        date: today,
      };

      const { error } = await supabase
        .from('fitness_workouts')
        .insert(workoutData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setShowWorkoutForm(false);
      setWorkoutFormData({ title: '', notes: '' });
      showSuccess('Workout started successfully!');
      refreshWorkout();
      router.push('/fitness/workouts/live');
    } catch (error) {
      console.error('Error starting workout:', error);
      showError('Failed to start workout. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  /**
   * Handle cardio form submission
   */
  const handleStartCardio = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setFormError('');
    if (!cardioFormData.activityType.trim()) {
      setFormError('Activity type is required.');
      return;
    }
    setFormLoading(true);
    
    try {
      // Check for existing in-progress cardio session
      const { data: existingCardio } = await supabase
        .from('fitness_cardio')
        .select('*')
        .eq('user_id', (user as any).id)
        .eq('in_progress', true)
        .maybeSingle();
      
      if (existingCardio) {
        setFormError('You already have an active cardio session.');
        setFormLoading(false);
        return;
      }
      
      const now = new Date();
      const [today] = now.toISOString().split('T');
      const cardioData = {
        user_id: (user as any).id,
        title: cardioFormData.activityType.trim(),
        activity_type: cardioFormData.activityType.trim(),
        location: cardioFormData.location.trim(),
        notes: cardioFormData.notes.trim(),
        in_progress: true,
        start_time: now.toISOString(),
        date: today,
      };

      const { error } = await supabase
        .from('fitness_cardio')
        .insert(cardioData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setShowCardioForm(false);
      setCardioFormData({ activityType: '', location: '', notes: '' });
      showSuccess('Cardio session started successfully!');
      refreshCardio();
      router.push('/fitness/cardio/live');
    } catch (error) {
      console.error('Error starting cardio session:', error);
      showError('Failed to start cardio session. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <>
      {/* Start Activity Modal */}
      {showStartActivityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-xl p-6 w-full max-w-md border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Activity className="w-5 h-5 text-blue-500 mr-2" />
                Start Activity
              </h2>
              <button
                onClick={() => setShowStartActivityModal(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Close activity modal"
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
                aria-label="Start a new workout session"
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
                aria-label="Start a new cardio session"
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
                aria-label="Start a new sports session"
              >
                <div className="flex items-center">
                  <Goal className="w-6 h-6 text-green-500 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-lg block">Start Sports</span>
                    <div className="text-sm text-gray-400">Basketball, soccer, tennis, golf</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={() => {
                  setShowStartActivityModal(false);
                  onOpenStretchingModal && onOpenStretchingModal();
                }}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group text-left"
                aria-label="Start a stretching session"
              >
                <div className="flex items-center">
                  <StretchHorizontal className="w-6 h-6 text-blue-500 mr-3 group-hover:scale-110 transition-transform" />
                  <div>
                    <span className="font-semibold text-lg block">Start Stretching</span>
                    <div className="text-sm text-gray-400">Yoga, mobility, flexibility work</div>
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
                aria-label="Close workout form"
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setWorkoutFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Push Day, Full Body, etc."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <FormTextarea
                  value={workoutFormData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setWorkoutFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
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
                  aria-label="Start workout session"
                  onClick={() => {}}
                >
                  Start Workout
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowWorkoutForm(false)}
                  disabled={formLoading}
                  aria-label="Cancel workout creation"
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
                aria-label="Close cardio form"
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setCardioFormData(prev => ({ ...prev, activityType: e.target.value }))
                  }
                  placeholder="e.g. Running, Cycling, Swimming, Walking"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Location (optional)</label>
                <FormInput
                  value={cardioFormData.location}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setCardioFormData(prev => ({ ...prev, location: e.target.value }))
                  }
                  placeholder="e.g. Central Park, Gym, Home"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <FormTextarea
                  value={cardioFormData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setCardioFormData(prev => ({ ...prev, notes: e.target.value }))
                  }
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
                  aria-label="Start cardio session"
                  onClick={() => {}}
                >
                  Start Cardio
                </Button>
                <Button 
                  type="button" 
                  variant="secondary"
                  onClick={() => setShowCardioForm(false)}
                  disabled={formLoading}
                  aria-label="Cancel cardio creation"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
});

WorkoutPlanner.displayName = 'WorkoutPlanner';

export default WorkoutPlanner;
