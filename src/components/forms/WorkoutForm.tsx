'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useInsertEntity, useDeleteEntity } from '@/lib/hooks/useSupabaseCrud';
import { useUser } from '@/context/UserContext';
import BackButton from '@/components/shared/BackButton';
import Button from '@/components/shared/Button';
import FormLabel from '@/components/shared/FormLabel';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import FormSection from '@/components/shared/FormSection';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import { useToast } from '@/components/client/Toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MdOutlineStickyNote2 } from 'react-icons/md';
import { createCalendarEventForEntity } from '@/lib/calendarSync';

import SetEditor from '../SetEditor';
import { insertSetsClient } from '@/lib/api/workoutClient';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { supabase } from '@/lib/supabaseClient';

interface WorkoutFormProps {
  initialWorkout?: {
    id: string;
    title: string;
    date: string;
    notes?: string;
  } | null;
  initialExercises?: Array<{
    id?: string;
    name: string;
    notes?: string;
  }>;
}

interface Exercise {
  id?: string;
  name: string;
  notes?: string;
}

interface Set {
  id?: string;
  reps: number;
  weight: number | null;
}

interface ExerciseWithSets extends Exercise {
  sets: Set[];
}

interface SetsByExercise {
  [exerciseId: string]: Set[];
}

export default function WorkoutForm({ initialWorkout = null, initialExercises = [] }: WorkoutFormProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user, loading: userLoading } = useUser();
  const { insert: insertExercises, loading: exercisesLoading } = useInsertEntity('fitness_exercises');
  const { loading: deleteLoading } = useDeleteEntity('fitness_exercises');


  const [title, setTitle] = useState(initialWorkout?.title || '');
  const [date, setDate] = useState(initialWorkout?.date || '');
  const [notes, setNotes] = useState(initialWorkout?.notes || '');
  const [exerciseForm, setExerciseForm] = useState({ name: '', notes: '' });
  const [exercises, setExercises] = useState<Exercise[]>(initialExercises);
  const [setsByExercise, setSetsByExercise] = useState<SetsByExercise>({});
  const [editedSetsByExercise, setEditedSetsByExercise] = useState<SetsByExercise>({});
  const [newExercisesWithSets, setNewExercisesWithSets] = useState<ExerciseWithSets[]>([]);
  const [pendingSets, setPendingSets] = useState<Set[]>([]);
  const [formError, setFormError] = useState('');
  const [selectedExerciseIndex, setSelectedExerciseIndex] = useState<number | null>(null);
  const originalSetIds = useRef<string[]>([]);
  // Track original exercise IDs when loading the form
  const originalExerciseIds = useRef<string[]>([]);

  useEffect(() => {
    if (!exercises || exercises.length === 0) return;
    const fetchSets = async () => {
      const newSetsByExercise: SetsByExercise = {};
      let allSetIds: string[] = [];
      for (const ex of exercises) {
        if (!ex.id) continue;
        const { data } = await supabase
          .from('fitness_sets')
          .select('*')
          .eq('exercise_id', ex.id)
          .order('created_at', { ascending: true });
        newSetsByExercise[ex.id] = data || [];
        if (data) {
          allSetIds = allSetIds.concat(data.map(set => set.id));
        }
      }
      setSetsByExercise(newSetsByExercise);
      originalSetIds.current = allSetIds;
    };
    fetchSets();
  }, [exercises]);

  useEffect(() => {
    if (Object.keys(setsByExercise).length > 0) {
      setEditedSetsByExercise(setsByExercise);
    }
  }, [setsByExercise]);

  // When loading exercises from DB, set originalExerciseIds
  useEffect(() => {
    if (exercises && exercises.length > 0) {
      originalExerciseIds.current = exercises.map(ex => ex.id).filter(Boolean) as string[];
    }
  }, [exercises]);

  // Handle Delete key for exercise deletion
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedExerciseIndex !== null) {
        // Remove from exercises or newExercisesWithSets depending on index
        if (selectedExerciseIndex < exercises.length) {
          setExercises((prev) => prev.filter((_, i) => i !== selectedExerciseIndex));
        } else {
          const newIndex = selectedExerciseIndex - exercises.length;
          setNewExercisesWithSets((prev) => prev.filter((_, i) => i !== newIndex));
        }
        setSelectedExerciseIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedExerciseIndex, exercises.length]);

  const handleExerciseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setExerciseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePendingSetsChange = (sets: Set[]) => {
    setPendingSets(sets);
  };

  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!exerciseForm.name) {
      showError('Please enter an exercise name.');
      return;
    }
    setNewExercisesWithSets((prev) => [...prev, { name: exerciseForm.name, notes: exerciseForm.notes, sets: pendingSets }]);
    setExerciseForm({ name: '', notes: '' });
    setPendingSets([]);
  };





  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!user) {
      showError('You must be logged in.');
      return;
    }
    if (!title.trim() || !date.trim()) {
      setFormError('Workout title and date are required.');
      return;
    }
    const workoutId = initialWorkout?.id;

    if (!workoutId) {
      showError('No workout ID found.');
      return;
    }

    // 1. Fetch all exercise IDs for this workout
    const { data: allExercises, error: fetchExError } = await supabase
      .from('fitness_exercises')
      .select('id')
      .eq('workout_id', workoutId);
    if (fetchExError) {
      showError('Failed to fetch exercises for overwrite.');
      return;
    }
    const allExerciseIds = (allExercises || []).map(ex => ex.id);

    // 2. Delete all sets for these exercises
    if (allExerciseIds.length > 0) {
      const { error: deleteSetsError } = await supabase
        .from('fitness_sets')
        .delete()
        .in('exercise_id', allExerciseIds);
      if (deleteSetsError) {
        showError('Failed to delete old sets.');
        return;
      }
    }

    // 3. Delete all exercises for this workout
    const { error: deleteExercisesError } = await supabase
      .from('fitness_exercises')
      .delete()
      .eq('workout_id', workoutId);
    if (deleteExercisesError) {
      showError('Failed to delete old exercises.');
      return;
    }

    // 4. Insert all new exercises from editor state (exercises + newExercisesWithSets)
    // Merge both arrays for full new state
    const allEditorExercises = [
      ...exercises.map(ex => ({ name: ex.name, notes: ex.notes })),
      ...newExercisesWithSets.map(ex => ({ name: ex.name, notes: ex.notes }))
    ];
    let insertedExercises: any[] = [];
    if (allEditorExercises.length > 0) {
      const formatted = allEditorExercises.map((ex) => ({
        workout_id: workoutId,
        name: ex.name,
        notes: ex.notes,
      }));
      const { data: inserted, error: exError } = await insertExercises(formatted);
      if (exError) {
        showError('Failed to insert new exercises.');
        return;
      }
      insertedExercises = inserted || [];
    }

    // 5. Insert all sets for all exercises (from editedSetsByExercise and newExercisesWithSets)
    // Map sets from editor state to the correct inserted exercise IDs
    // First, handle sets for exercises (editedSetsByExercise)
    const allSetsToInsert: Array<{exercise_id: string, reps: number, weight: number}> = [];
    // For old exercises (from exercises array)
    for (let i = 0; i < exercises.length; i++) {
      const sets = editedSetsByExercise[exercises[i]?.id || ''] || [];
      const insertedEx = insertedExercises[i];
      if (insertedEx && sets.length > 0) {
        allSetsToInsert.push(...sets
          .filter(set => set.weight !== null)
          .map(set => ({
            exercise_id: insertedEx.id,
            reps: set.reps,
            weight: set.weight as number,
          })));
      }
    }
    // For new exercises (from newExercisesWithSets)
    for (let i = 0; i < newExercisesWithSets.length; i++) {
      const sets = newExercisesWithSets[i]?.sets || [];
      const insertedEx = insertedExercises[exercises.length + i];
      if (insertedEx && sets.length > 0) {
        allSetsToInsert.push(...sets
          .filter(set => set.weight !== null)
          .map(set => ({
            exercise_id: insertedEx.id,
            reps: set.reps,
            weight: set.weight as number,
          })));
      }
    }
    if (allSetsToInsert.length > 0) {
      try {
        await insertSetsClient(allSetsToInsert);
      } catch (_err) {
        showError('Failed to insert sets.');
        return;
      }
    }

    // 6. Update the workout row itself
    const { error: updateError } = await supabase
      .from('fitness_workouts')
      .update({
        user_id: user.id,
        title,
        date,
        notes,
      })
      .eq('id', workoutId);
    if (updateError) {
      showError('Failed to update workout.');
      return;
    }

    // 7. Update calendar event
    const calendarError = await createCalendarEventForEntity(
      CALENDAR_SOURCES.WORKOUT,
      {
        id: workoutId,
        user_id: user.id,
        title,
        date,
        notes,
      }
    );
    if (calendarError) {
      showError('Calendar event update failed:', calendarError.message || calendarError);
    } else {
      showSuccess('Workout updated successfully!');
    }
    router.push('/fitness');
    return;
  };

  const isLoading = userLoading || exercisesLoading || deleteLoading;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">✏️ Edit Workout</h1>
      <p className="text-base">Edit your workout session, exercises, and details.</p>
      {formError && <div className="text-red-500 mb-2">{formError}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel htmlFor="workout-title">Workout Title</FormLabel>
          <FormInput 
            type="text" 
            placeholder="Workout Title" 
            value={title} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)} 
            required 
            data-testid="workout-title"
          />
        </div>
        <div>
          <FormLabel htmlFor="workout-date">Date</FormLabel>
          <FormInput 
            type="date" 
            value={date} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)} 
            required 
            data-testid="workout-date"
          />
        </div>
        <div>
          <FormLabel htmlFor="workout-notes">Notes (optional)</FormLabel>
          <FormTextarea 
            placeholder="Notes (optional)" 
            value={notes} 
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)} 
            rows={3} 
          />
        </div>
        <FormSection title="💪 Exercises">
          <div className="space-y-4">
            <FormLabel htmlFor="exercise-name">Exercise Name</FormLabel>
            <FormInput 
              id="exercise-name"
              name="name" 
              value={exerciseForm.name} 
              onChange={handleExerciseChange} 
              placeholder="Exercise Name" 
            />
            <FormTextarea 
              name="notes" 
              value={exerciseForm.notes} 
              onChange={handleExerciseChange} 
              placeholder="Notes (optional)" 
              rows={2} 
            />
            <SetEditor
              initialSets={pendingSets}
              onSetsChange={handlePendingSetsChange}
            />
            <Button 
              type="button" 
              onClick={handleAddExercise} 
              variant="secondary"
              className="w-full"
              aria-label="Add exercise to workout"
            >
              ➕ Add Exercise
            </Button>
          </div>
        </FormSection>
        {(exercises.length > 0 || newExercisesWithSets.length > 0) && (
          <div className="mt-4">
            <h3 className="font-semibold text-md mb-2">
              <MdOutlineStickyNote2 className="inline w-5 h-5 text-base align-text-bottom mr-2" />
              Exercises Preview
            </h3>
            <ul className="space-y-2">
              {exercises.map((ex, i) => (
                <li key={ex.id || `existing-${i}`} className="border p-2 rounded flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{ex.name}</strong>
                      {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
                    </div>
                    <SharedDeleteButton
                      onClick={() => setExercises(prev => prev.filter((_, idx) => idx !== i))}
                      label="Delete"
                      size="sm"
                      className="ml-2"
                    />
                  </div>
                  <div className="ml-2 space-y-2">
                    {(editedSetsByExercise[ex.id || ''] ?? []).length > 0 ? (
                      (editedSetsByExercise[ex.id || ''] ?? []).map((set, idx) => (
                        <div key={set.id || idx} className="flex items-center gap-2 mb-1">
                          <span className="text-sm mr-2">Set {idx + 1}:</span>
                          <FormInput
                            type="number"
                            min={0}
                            value={set.reps}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newSets = [...(editedSetsByExercise[ex.id || ''] ?? [])];
                              if (newSets[idx]) {
                                newSets[idx] = { ...newSets[idx], reps: Number(e.target.value), weight: newSets[idx].weight };
                              }
                              setEditedSetsByExercise(prev => ({ ...prev, [ex.id || '']: newSets }));
                            }}
                            placeholder="Reps"
                            className="w-20"
                          />
                          <FormInput
                            type="number"
                            min={0}
                            value={set.weight ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newSets = [...(editedSetsByExercise[ex.id || ''] ?? [])];
                              if (newSets[idx]) {
                                newSets[idx] = { ...newSets[idx], weight: e.target.value === '' ? null : Number(e.target.value) };
                              }
                              setEditedSetsByExercise(prev => ({ ...prev, [ex.id || '']: newSets }));
                            }}
                            placeholder="Weight (lbs)"
                            className="w-28"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Delete set"
                            onClick={() => {
                              const newSets = (editedSetsByExercise[ex.id || ''] ?? []).filter((_, sidx) => sidx !== idx);
                              setEditedSetsByExercise(prev => ({ ...prev, [ex.id || '']: newSets }));
                            }}
                          >
                            🗑️
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No sets logged yet.</div>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-1"
                      aria-label="Add set to exercise"
                      onClick={() => {
                        const newSets = [...(editedSetsByExercise[ex.id || ''] || []), { reps: 0, weight: null }];
                        setEditedSetsByExercise(prev => ({ ...prev, [ex.id || '']: newSets }));
                      }}
                    >
                      ➕ Add Set
                    </Button>
                  </div>
                </li>
              ))}
              {newExercisesWithSets.map((ex, i) => (
                <li key={`new-${i}`} className="border p-2 rounded flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{ex.name}</strong>
                      {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
                    </div>
                    <SharedDeleteButton
                      onClick={() => setNewExercisesWithSets(prev => prev.filter((_, idx) => idx !== i))}
                      label="Delete"
                      size="sm"
                      className="ml-2"
                    />
                  </div>
                  <div className="ml-2 space-y-2">
                    {ex.sets && ex.sets.length > 0 ? (
                      ex.sets.map((set, idx) => (
                        <div key={set.id || idx} className="flex items-center gap-2 mb-1">
                          <span className="text-sm mr-2">Set {idx + 1}:</span>
                          <FormInput
                            type="number"
                            min={0}
                            value={set.reps}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newSets = [...ex.sets];
                              if (newSets[idx]) {
                                newSets[idx] = { ...newSets[idx], reps: Number(e.target.value), weight: newSets[idx].weight };
                              }
                              setNewExercisesWithSets(prev => prev.map((ex2, j) => j === i ? { ...ex2, sets: newSets } : ex2));
                            }}
                            placeholder="Reps"
                            className="w-20"
                          />
                          <FormInput
                            type="number"
                            min={0}
                            value={set.weight ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newSets = [...ex.sets];
                              if (newSets[idx]) {
                                newSets[idx] = { ...newSets[idx], weight: e.target.value === '' ? null : Number(e.target.value) };
                              }
                              setNewExercisesWithSets(prev => prev.map((ex2, j) => j === i ? { ...ex2, sets: newSets } : ex2));
                            }}
                            placeholder="Weight (lbs)"
                            className="w-28"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label="Delete set"
                            onClick={() => {
                              const newSets = ex.sets.filter((_, sidx) => sidx !== idx);
                              setNewExercisesWithSets(prev => prev.map((ex2, j) => j === i ? { ...ex2, sets: newSets } : ex2));
                            }}
                          >
                            🗑️
                          </Button>
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No sets logged yet.</div>
                    )}
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="mt-1"
                      aria-label="Add set to new exercise"
                      onClick={() => {
                        const newSets = [...(ex.sets || []), { reps: 0, weight: null }];
                        setNewExercisesWithSets(prev => prev.map((ex2, j) => j === i ? { ...ex2, sets: newSets } : ex2));
                      }}
                    >
                      ➕ Add Set
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Button 
          type="submit" 
          variant="none"
          className="bg-card text-base border border-default px-4 py-2 rounded hover:bg-[#4a4a4a] transition-colors duration-200 focus:outline-none focus:ring-0 font-medium w-full mt-6"
          disabled={isLoading}
          data-testid="workout-submit"
          aria-label="Submit workout form"
          onClick={() => {}}
        >
          {isLoading ? <LoadingSpinner size={20} /> : '\u2705 Update Workout'}
        </Button>
      </form>
    </div>
  );
}
