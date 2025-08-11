'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';

import { useToast } from '@/components/client/Toast';
import { updateCalendarEventForCompletedEntity, cleanupPlannedSessionOnCompletion } from '@/lib/calendarSync';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import BaseModal from '@/components/shared/BaseModal';
import { Dumbbell } from 'lucide-react';

interface WorkoutSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutId?: string | null;
  plannedId?: string | null;
  plannedTitle?: string | null;
  plannedNotes?: string | null;
}

interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  notes?: string;
  created_at: string;
}

interface Set {
  id: string;
  exercise_id: string;
  reps: number;
  weight: number | null;
  created_at: string;
}

interface SetsByExercise {
  [exerciseId: string]: Set[];
}

interface AddSetForm {
  [exerciseId: string]: {
    reps: string;
    weight: string;
    loading: boolean;
    error: string;
  };
}

export default function WorkoutSessionModal({ 
  isOpen, 
  onClose, 
  workoutId = null, 
  plannedId = null, 
  plannedTitle = null, 
  plannedNotes = null 
}: WorkoutSessionModalProps) {
  const { user, loading: userLoading } = useUser();
  const { activeWorkoutId, workoutData, refreshWorkout, loading: workoutLoading } = useWorkoutSession();
  
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState(() => {
    if (plannedTitle) return plannedTitle;
    const now = new Date();
    return `Workout - ${now.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })}`;
  });
  const [notes, setNotes] = useState(plannedNotes || '');
  const [formError, setFormError] = useState('');

  // Exercise state
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [exLoading, setExLoading] = useState(false);
  const [addExerciseName, setAddExerciseName] = useState('');
  const [addExerciseLoading, setAddExerciseLoading] = useState(false);
  const [exerciseError, setExerciseError] = useState('');

  // Sets state (per exercise)
  const [setsByExercise, setSetsByExercise] = useState<SetsByExercise>({}); // { [exerciseId]: [sets] }
  const [addSetForm, setAddSetForm] = useState<AddSetForm>({}); // { [exerciseId]: { reps, weight, loading, error } }


  const { showSuccess, showError } = useToast();

  // Check if the requested workout ID matches the active session
  useEffect(() => {
    if (workoutId && activeWorkoutId && workoutId !== activeWorkoutId) {
      // If there's a mismatch, refresh the session to get the correct one
      refreshWorkout();
    }
  }, [workoutId, activeWorkoutId, refreshWorkout]);

  // Fetch exercises for the current workout
  useEffect(() => {
    if (!activeWorkoutId) return;
    setExLoading(true);
    supabase
      .from('fitness_exercises')
      .select('*')
      .eq('workout_id', activeWorkoutId)
      .order('id', { ascending: true })
      .then(({ data, error }) => {
        if (!error) setExercises(data || []);
        setExLoading(false);
      });
  }, [activeWorkoutId]);

  // Fetch sets for each exercise
  useEffect(() => {
    if (!exercises.length) return;
    const fetchSets = async () => {
      const newSetsByExercise: SetsByExercise = {};
      for (const ex of exercises) {
        const { data } = await supabase
          .from('fitness_sets')
          .select('*')
          .eq('exercise_id', ex.id)
          .order('created_at', { ascending: true });
        newSetsByExercise[ex.id] = data || [];
      }
      setSetsByExercise(newSetsByExercise);
    };
    fetchSets();
  }, [exercises]);

  // Add exercise handler
  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddExerciseLoading(true);
    setExerciseError('');
    if (!addExerciseName.trim()) {
      setExerciseError('Exercise name required');
      setAddExerciseLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('fitness_exercises')
      .insert({
        workout_id: activeWorkoutId,
        name: addExerciseName.trim(),
      })
      .select()
      .single();
    if (error) {
      setExerciseError(error.message || 'Failed to add exercise');
      setAddExerciseLoading(false);
      return;
    }
    setExercises((prev) => [...prev, data]);
    setAddExerciseName('');
    setAddExerciseLoading(false);
  };

  // Add set handler (per exercise)
  const handleAddSet = (exerciseId: string) => async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get the current form state for this exercise
    const currentForm = addSetForm[exerciseId] || { reps: '', weight: '', loading: false, error: '' };
    const reps = Number(currentForm.reps);
    const weight = Number(currentForm.weight);
    
    if (!reps || reps < 1) {
      setAddSetForm((prev) => ({ 
        ...prev, 
        [exerciseId]: { 
          ...currentForm, 
          loading: false, 
          error: 'Reps required' 
        } 
      }));
      return;
    }
    
    // Start loading
    setAddSetForm((prev) => ({ 
      ...prev, 
      [exerciseId]: { 
        ...currentForm, 
        loading: true, 
        error: '' 
      } 
    }));
    
    try {
      const { data, error } = await supabase
        .from('fitness_sets')
        .insert({
          exercise_id: exerciseId,
          reps,
          weight: isNaN(weight) ? null : weight,
        })
        .select()
        .single();
      
      if (error) {
        setAddSetForm((prev) => ({ 
          ...prev, 
          [exerciseId]: { 
            ...(prev[exerciseId] || { reps: '', weight: '', loading: false, error: '' }), 
            loading: false, 
            error: error.message || 'Failed to add set' 
          } 
        }));
        return;
      }
      
      // Update sets
      setSetsByExercise((prev) => ({
        ...prev,
        [exerciseId]: [...(prev[exerciseId] || []), data],
      }));
      
      // Reset form
      setAddSetForm((prev) => ({ 
        ...prev, 
        [exerciseId]: { 
          reps: '', 
          weight: '', 
          loading: false, 
          error: '' 
        } 
      }));
    } catch (err) {
      setAddSetForm((prev) => ({ 
        ...prev, 
        [exerciseId]: { 
          ...(prev[exerciseId] || { reps: '', weight: '', loading: false, error: '' }), 
          loading: false, 
          error: 'Failed to add set' 
        } 
      }));
    }
  };

  const handleEndWorkout = async () => {
    if (!activeWorkoutId) return;
    
    // Update the workout to mark it as completed
    const { error } = await supabase
      .from('fitness_workouts')
      .update({ 
        in_progress: false, 
        end_time: new Date().toISOString(),
        status: 'completed' // Ensure it's marked as completed
      })
      .eq('id', activeWorkoutId);
    
    if (error) {
      showError('Failed to end workout.');
      return;
    }

    // Clean up any planned session data (calendar events, etc.)
    if (user?.id) {
      const cleanupError = await cleanupPlannedSessionOnCompletion('workout', activeWorkoutId, user.id);
      if (cleanupError) {
        console.error('Error cleaning up planned session:', cleanupError);
        // Don't fail the workout end if cleanup fails
      }
    }

    // Clear session state in context immediately
    if (typeof refreshWorkout === 'function') await refreshWorkout();
    
    // Show success message
    showSuccess('Workout ended!');
    
    // Close the modal
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  // Show loading while workout session is loading
  if (workoutLoading || userLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
        subtitle="Please wait"
        icon={Dumbbell}
        iconBgColor="bg-blue-500/10"
        iconColor="text-blue-500"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Show the form if there is no active workout (workoutData is falsy)
  if (!workoutData) {
    const handleStartWorkout = async (e: React.FormEvent) => {
      e.preventDefault();
      setFormError('');
      if (!title.trim()) {
        setFormError('Workout title is required.');
        return;
      }
      setCreating(true);
      
      if (!user?.id) {
        setFormError('User not found');
        setCreating(false);
        return;
      }

      // Double-check that there's no in-progress workout before creating a new one
      const { data: existingWorkout } = await supabase
        .from('fitness_workouts')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_progress', true)
        .maybeSingle();
      
      if (existingWorkout) {
        // There's already an in-progress workout, refresh the context and return
        await refreshWorkout();
        setCreating(false);
        return;
      }
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      let workoutData = {
        user_id: user.id,
        title: title.trim(),
        notes: notes.trim(),
        in_progress: true,
        start_time: now.toISOString(),
        date: today,
      };

      // If this is from a planned event, update the planned entry instead of creating new
      if (plannedId) {
        const { data, error } = await supabase
          .from('fitness_workouts')
          .update({
            ...workoutData,
            status: 'completed' // Mark as completed since we're starting it
          })
          .eq('id', plannedId)
          .eq('user_id', user.id)
          .select()
          .single();
        
        setCreating(false);
        if (!error && data) {
          // Clean up the calendar event since it's no longer planned
          await updateCalendarEventForCompletedEntity(CALENDAR_SOURCES.WORKOUT, plannedId);
          await refreshWorkout();
        } else {
          setFormError(error?.message || 'Failed to start planned workout');
        }
      } else {
        // Create new workout
        const { data, error } = await supabase
          .from('fitness_workouts')
          .insert(workoutData)
          .select()
          .single();
        
        setCreating(false);
        if (!error && data) {
          await refreshWorkout();
        } else {
          setFormError(error?.message || 'Failed to start workout');
        }
      }
    };

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Start a New Workout"
        subtitle="Begin tracking your workout session"
        icon={Dumbbell}
        iconBgColor="bg-blue-500/10"
        iconColor="text-blue-500"
        maxWidth="max-w-2xl"
      >
        <div className="space-y-6">
          {formError && <div className="text-red-500">{formError}</div>}
          <form onSubmit={handleStartWorkout} className="space-y-4">
            <div>
              <label className="font-semibold">Workout Title</label>
              <FormInput
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                required
                placeholder="e.g. Push Day, Full Body, etc."
              />
            </div>
            <div>
              <label className="font-semibold">Notes (optional)</label>
              <FormTextarea
                value={notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                placeholder="Add any notes or goals for this workout (optional)"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" variant="primary" loading={creating} disabled={creating} aria-label="Start workout session" onClick={() => {}}>
                Start Workout
              </Button>
              <Button type="button" variant="secondary" onClick={onClose} aria-label="Cancel workout session">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </BaseModal>
    );
  }

  // Show the logging UI if a workout is active
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Workout In Progress"
      subtitle={(workoutData as any)?.title || 'Untitled Workout'}
      icon={Dumbbell}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        <div className="bg-panel border border-border rounded-lg p-4">
          <p className="mb-2"><strong>Title:</strong> {(workoutData as any)?.title || 'Untitled Workout'}</p>
          {(workoutData as any)?.notes && <p className="mb-2"><strong>Notes:</strong> {(workoutData as any).notes}</p>}
          <p className="mb-2"><strong>Started:</strong> {(workoutData as any)?.start_time ? new Date((workoutData as any).start_time).toLocaleString() : 'Unknown'}</p>
        </div>

        {/* End Workout Button */}
        <div className="flex justify-end">
          <Button variant="danger" onClick={handleEndWorkout} aria-label="End workout session">
            End Workout
          </Button>
        </div>

        {/* Add Exercise Form */}
        <form onSubmit={handleAddExercise} className="flex gap-2">
          <FormInput
            label="Add Exercise"
            value={addExerciseName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddExerciseName(e.target.value)}
            required
            placeholder="e.g. Bench Press, Squat, etc."
            title="Enter the name of the exercise"
            className="flex-1"
          />
          <Button type="submit" variant="primary" loading={addExerciseLoading} aria-label="Add exercise to workout" onClick={() => {}}>
            Add
          </Button>
        </form>
        {exerciseError && <div className="text-red-500">{exerciseError}</div>}

        {/* List of Exercises */}
        <div>
          {exLoading ? (
            <div>Loading exercises...</div>
          ) : exercises.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No exercises yet.</div>
          ) : (
            <div className="space-y-4">
              {exercises.map((ex) => (
                <div key={ex.id} className="border border-border rounded-lg p-4 bg-panel">
                  <div className="font-semibold mb-3">{ex.name}</div>
                  {/* Sets List */}
                  <div className="ml-2 mb-3">
                    {setsByExercise[ex.id]?.length ? (
                      <div className="space-y-1">
                        {(setsByExercise[ex.id] || []).map((set, i) => (
                          <div key={set.id} className="text-sm">
                            Set {i + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">No sets logged yet.</div>
                    )}
                  </div>
                  {/* Add Set Form */}
                  <form onSubmit={handleAddSet(ex.id)} className="flex gap-2 items-end">
                    <FormInput
                      label="Reps"
                      type="number"
                      min={1}
                      value={addSetForm[ex.id]?.reps || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddSetForm(prev => ({ ...prev, [ex.id]: { ...(prev[ex.id] || { reps: '', weight: '', loading: false, error: '' }), reps: e.target.value } }))}
                      required
                      placeholder="Reps"
                      title="Number of repetitions for this set"
                    />
                    <FormInput
                      label="Weight (lbs)"
                      type="number"
                      value={addSetForm[ex.id]?.weight || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddSetForm(prev => ({ ...prev, [ex.id]: { ...(prev[ex.id] || { reps: '', weight: '', loading: false, error: '' }), weight: e.target.value } }))}
                      placeholder="Weight (lbs)"
                      title="Weight used for this set (optional)"
                    />
                    <Button type="submit" variant="primary" loading={addSetForm[ex.id]?.loading} aria-label="Log set for exercise" onClick={() => {}}>
                      Log Set
                    </Button>
                  </form>
                  {addSetForm[ex.id]?.error && <div className="text-red-500 mt-2 text-sm">{addSetForm[ex.id]?.error}</div>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}
