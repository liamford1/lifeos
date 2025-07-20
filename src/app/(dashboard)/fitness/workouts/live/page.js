'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/Button';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/Toast';

export default function LiveWorkoutPage() {
  const { user, loading: userLoading } = useUser();
  const { activeWorkoutId, workoutData, refreshWorkout, loading: workoutLoading } = useWorkoutSession();
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Exercise state
  const [exercises, setExercises] = useState([]);
  const [exLoading, setExLoading] = useState(false);
  const [addExerciseName, setAddExerciseName] = useState('');
  const [addExerciseLoading, setAddExerciseLoading] = useState(false);
  const [exerciseError, setExerciseError] = useState('');

  // Sets state (per exercise)
  const [setsByExercise, setSetsByExercise] = useState({}); // { [exerciseId]: [sets] }
  const [addSetForm, setAddSetForm] = useState({}); // { [exerciseId]: { reps, weight, loading, error } }

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    if (workoutData) {
      setEditTitle(workoutData.title || '');
      setEditNotes(workoutData.notes || '');
    }
  }, [workoutData]);

  const router = useRouter();
  const { showSuccess, showError } = useToast();

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
      const newSetsByExercise = {};
      for (const ex of exercises) {
        const { data, error } = await supabase
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
  const handleAddExercise = async (e) => {
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
  const handleAddSet = (exerciseId) => async (e) => {
    e.preventDefault();
    setAddSetForm((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], loading: true, error: '' } }));
    const reps = Number(addSetForm[exerciseId]?.reps);
    const weight = Number(addSetForm[exerciseId]?.weight);
    if (!reps || reps < 1) {
      setAddSetForm((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], loading: false, error: 'Reps required' } }));
      return;
    }
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
      setAddSetForm((prev) => ({ ...prev, [exerciseId]: { ...prev[exerciseId], loading: false, error: error.message || 'Failed to add set' } }));
      return;
    }
    setSetsByExercise((prev) => ({
      ...prev,
      [exerciseId]: [...(prev[exerciseId] || []), data],
    }));
    setAddSetForm((prev) => ({ ...prev, [exerciseId]: { reps: '', weight: '', loading: false, error: '' } }));
  };

  const handleEndWorkout = async () => {
    if (!activeWorkoutId) return;
    const { error } = await supabase
      .from('fitness_workouts')
      .update({ in_progress: false, end_time: new Date().toISOString() })
      .eq('id', activeWorkoutId);
    if (error) {
      showError('Failed to end workout.');
      return;
    }
    // Clear activeWorkoutId in context
    if (typeof refreshWorkout === 'function') await refreshWorkout();
    // Optionally show a toast
    showSuccess('Workout ended!');
    // Redirect
    router.push('/fitness/workouts');
  };

  // Show the form if there is no active workout (workoutData is falsy)
  if (!workoutData) {
    const handleStartWorkout = async (e) => {
      e.preventDefault();
      setFormError('');
      if (!title.trim()) {
        setFormError('Workout title is required.');
        return;
      }
      setCreating(true);
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('fitness_workouts')
        .insert({
          user_id: user.id,
          title: title.trim(),
          notes: notes.trim(),
          in_progress: true,
          start_time: now.toISOString(),
          date: today,
        })
        .select()
        .single();
      setCreating(false);
      if (!error && data) {
        await refreshWorkout();
      } else {
        setFormError(error?.message || 'Failed to start workout');
      }
    };
    return (
      <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Start a New Workout</h1>
        {formError && <div className="text-red-500 mb-2">{formError}</div>}
        <form onSubmit={handleStartWorkout} className="space-y-4">
          <div>
            <label className="font-semibold">Workout Title</label>
            <FormInput
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              placeholder="e.g. Push Day, Full Body, etc."
            />
          </div>
          <div>
            <label className="font-semibold">Notes (optional)</label>
            <FormTextarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes or goals for this workout (optional)"
            />
          </div>
          <Button type="submit" variant="primary" loading={creating} disabled={creating}>
            Start Workout
          </Button>
        </form>
      </div>
    );
  }

  // Show the logging UI if a workout is active
  return (
    <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Workout In Progress</h1>
      <p className="mb-2"><strong>Title:</strong> {workoutData.title || 'Untitled Workout'}</p>
      {workoutData.notes && <p className="mb-2"><strong>Notes:</strong> {workoutData.notes}</p>}
      <p className="mb-2"><strong>Started:</strong> {workoutData.start_time ? new Date(workoutData.start_time).toLocaleString() : 'Unknown'}</p>
      {/* End Workout Button */}
      <Button variant="danger" className="mb-4" onClick={handleEndWorkout}>
        End Workout
      </Button>
      {/* Add Exercise Form */}
      <form onSubmit={handleAddExercise} className="mb-4 flex gap-2">
        <FormInput
          label="Add Exercise"
          value={addExerciseName}
          onChange={e => setAddExerciseName(e.target.value)}
          required
          placeholder="e.g. Bench Press, Squat, etc."
          title="Enter the name of the exercise"
        />
        <Button type="submit" variant="primary" loading={addExerciseLoading}>
          Add
        </Button>
      </form>
      {exerciseError && <div className="text-red-500 mb-2">{exerciseError}</div>}
      {/* List of Exercises */}
      <div>
        {exLoading ? (
          <div>Loading exercises...</div>
        ) : exercises.length === 0 ? (
          <div>No exercises yet.</div>
        ) : (
          exercises.map((ex, idx) => (
            <div key={ex.id} className="mb-6 p-2 border rounded">
              <div className="font-semibold mb-1">{ex.name}</div>
              {/* Sets List */}
              <div className="ml-2 mb-2">
                {setsByExercise[ex.id]?.length ? (
                  setsByExercise[ex.id].map((set, i) => (
                    <div key={set.id}>
                      Set {i + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}
                    </div>
                  ))
                ) : (
                  <div>No sets logged yet.</div>
                )}
              </div>
              {/* Add Set Form */}
              <form onSubmit={handleAddSet(ex.id)} className="flex gap-2 items-end">
                <FormInput
                  label="Reps"
                  type="number"
                  min={1}
                  value={addSetForm[ex.id]?.reps || ''}
                  onChange={e => setAddSetForm(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], reps: e.target.value } }))}
                  required
                  placeholder="Reps"
                  title="Number of repetitions for this set"
                />
                <FormInput
                  label="Weight (lbs)"
                  type="number"
                  value={addSetForm[ex.id]?.weight || ''}
                  onChange={e => setAddSetForm(prev => ({ ...prev, [ex.id]: { ...prev[ex.id], weight: e.target.value } }))}
                  placeholder="Weight (lbs)"
                  title="Weight used for this set (optional)"
                />
                <Button type="submit" variant="primary" loading={addSetForm[ex.id]?.loading}>
                  Log Set
                </Button>
              </form>
              {addSetForm[ex.id]?.error && <div className="text-red-500 mt-1">{addSetForm[ex.id].error}</div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 