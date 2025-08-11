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
import dynamic from 'next/dynamic';

// Dynamic imports for lucide-react icons to reduce bundle size
const Activity = dynamic(() => import("lucide-react/dist/esm/icons/activity"), { ssr: false });
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), { ssr: false });
const HeartPulse = dynamic(() => import("lucide-react/dist/esm/icons/heart-pulse"), { ssr: false });
const Goal = dynamic(() => import("lucide-react/dist/esm/icons/goal"), { ssr: false });
const StretchHorizontal = dynamic(() => import("lucide-react/dist/esm/icons/stretch-horizontal"), { ssr: false });
const X = dynamic(() => import("lucide-react/dist/esm/icons/x"), { ssr: false });

/**
 * WorkoutPlanner Component
 * 
 * Handles activity start functionality including:
 * - Start activity modal with activity type selection
 * - Workout form creation and submission
 * - Cardio form creation and submission
 * - Form validation and error handling
 * 
 * @param {Object} props
 * @param {boolean} props.showStartActivityModal - Controls start activity modal visibility
 * @param {Function} props.setShowStartActivityModal - Function to control start activity modal
 * @param {Function} props.onOpenStretchingModal - Callback to open stretching modal
 */
const WorkoutPlanner = React.memo(({ 
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
      showSuccess('Workout created! Opening workout session...');
      setShowWorkoutForm(false);
      setWorkoutFormData({ title: '', notes: '' });
      // Refresh the workout session context to update navbar
      await refreshWorkout();
      // Return the workout data for parent to handle modal opening
      return data;
    } else {
      setFormError(error?.message || 'Failed to start workout');
      return null;
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

  return (
    <>
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
              
              <button
                onClick={() => {
                  setShowStartActivityModal(false);
                  onOpenStretchingModal && onOpenStretchingModal();
                }}
                className="w-full p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-all duration-200 border border-gray-600 hover:border-blue-500 group text-left"
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
    </>
  );
});

WorkoutPlanner.displayName = 'WorkoutPlanner';

export default WorkoutPlanner;
