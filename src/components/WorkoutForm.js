'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInsertEntity, useDeleteEntity } from '@/lib/useSupabaseCrud';
import { useUser } from '@/context/UserContext';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import FormSection from '@/components/FormSection';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MdOutlineStickyNote2 } from 'react-icons/md';
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import DeleteButton from '@/components/DeleteButton';
import { supabase } from '@/lib/supabaseClient';
import SetEditor from './SetEditor';

export default function WorkoutForm({ initialWorkout = null, initialExercises = [], isEdit = false }) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user, loading: userLoading } = useUser();
  const { insert: insertWorkout, loading: workoutLoading } = useInsertEntity('fitness_workouts');
  const { insert: insertExercises, loading: exercisesLoading } = useInsertEntity('fitness_exercises');
  const { insert: insertCalendar, loading: calendarLoading } = useInsertEntity('calendar_events');
  const { deleteByFilters, loading: deleteLoading } = useDeleteEntity('fitness_exercises');

  const [title, setTitle] = useState(initialWorkout?.title || '');
  const [date, setDate] = useState(initialWorkout?.date || '');
  const [notes, setNotes] = useState(initialWorkout?.notes || '');
  const [exerciseForm, setExerciseForm] = useState({ name: '', notes: '' });
  const [exercises, setExercises] = useState(initialExercises);
  const [setsByExercise, setSetsByExercise] = useState({});
  // Track edited sets in edit mode
  const [editedSetsByExercise, setEditedSetsByExercise] = useState({});
  // For new exercises being added in edit mode, track their sets
  const [newExercisesWithSets, setNewExercisesWithSets] = useState([]); // [{name, notes, sets: []}]
  const [pendingSets, setPendingSets] = useState([]); // Sets being entered for the current new exercise
  const [formError, setFormError] = useState('');

  // Fetch sets for each exercise in edit mode on page load
  useEffect(() => {
    if (!isEdit || !exercises || exercises.length === 0) return;
    const fetchSets = async () => {
      const newSetsByExercise = {};
      for (const ex of exercises) {
        if (!ex.id) continue; // Only fetch sets for exercises with a defined id
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
  }, [isEdit, exercises]);

  // When setsByExercise changes (after fetch), initialize editedSetsByExercise
  useEffect(() => {
    if (isEdit && Object.keys(setsByExercise).length > 0) {
      setEditedSetsByExercise(setsByExercise);
    }
  }, [isEdit, setsByExercise]);

  const handleExerciseChange = (e) => {
    const { name, value } = e.target;
    setExerciseForm((prev) => ({ ...prev, [name]: value }));
  };

  // For new exercises, handle set changes for the pending (not yet added) exercise
  const handlePendingSetsChange = (sets) => {
    setPendingSets(sets);
  };

  // Remove push to setExercises for new exercises in edit mode
  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!exerciseForm.name) {
      showError('Please enter an exercise name.');
      return;
    }
    // Only push to newExercisesWithSets, not exercises, for new exercises
    setNewExercisesWithSets((prev) => [...prev, { name: exerciseForm.name, notes: exerciseForm.notes, sets: pendingSets }]);
    setExerciseForm({ name: '', notes: '' });
    setPendingSets([]); // Clear the temporary set input state
  };

  const handleDeleteExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper for SetEditor
  const handleSetsChange = (exerciseId, sets) => {
    setEditedSetsByExercise((prev) => ({ ...prev, [exerciseId]: sets }));
  };

  const handleSubmit = async (e) => {
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
    // Validate sets for new exercises only
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      if (!ex.id) { // Only validate new exercises
        const sets = newExercisesWithSets[i]?.sets || [];
        if (sets.length === 0) {
          setFormError(`Please add at least one set for new exercise "${ex.name}".`);
          return;
        }
        for (let j = 0; j < sets.length; j++) {
          const set = sets[j];
          if (!set.reps || isNaN(set.reps) || set.reps < 1) {
            setFormError(`Set ${j + 1} for new exercise "${ex.name}" is missing reps or reps is invalid.`);
            return;
          }
          // weight is optional, but if present, must be a number
          if (set.weight !== null && set.weight !== undefined && set.weight !== '' && isNaN(set.weight)) {
            setFormError(`Set ${j + 1} for new exercise "${ex.name}" has invalid weight.`);
            return;
          }
        }
      }
    }
    let workoutId = initialWorkout?.id;
    if (isEdit) {
      // Update workout (use supabase update, not insert)
      const { error: updateError } = await supabase
        .from('fitness_workouts')
        .update({
          user_id: user.id,
          title,
          date,
          notes,
        })
        .eq('id', workoutId);
      if (updateError) return;

      // 1. Find deleted exercises (in initialExercises but not in exercises)
      const initialIds = initialExercises.map(ex => ex.id).filter(Boolean);
      const currentIds = exercises.map(ex => ex.id).filter(Boolean);
      const deletedIds = initialIds.filter(id => !currentIds.includes(id));
      // 2. Delete sets and exercises for deletedIds
      if (deletedIds.length > 0) {
        await supabase.from('fitness_sets').delete().in('exercise_id', deletedIds);
        await supabase.from('fitness_exercises').delete().in('id', deletedIds);
      }

      // 3. Insert new exercises (with sets) if any
      let insertedExercises = [];
      if (newExercisesWithSets.length > 0) {
        const formatted = newExercisesWithSets.map((ex) => ({
          workout_id: workoutId,
          name: ex.name,
          notes: ex.notes,
        }));
        const { data: inserted, error: exError } = await insertExercises(formatted);
        if (exError) return;
        insertedExercises = inserted || [];
        // 4. Insert sets for new exercises, matching by array index
        for (let i = 0; i < insertedExercises.length; i++) {
          const ex = insertedExercises[i];
          const sets = newExercisesWithSets[i]?.sets || [];
          // Debug log: print exercise id and sets
          console.log('Inserting sets for exercise:', ex.id, ex.name, sets);
          if (sets.length > 0) {
            const formattedSets = sets.map((set) => ({
              exercise_id: ex.id, // Use the id returned from Supabase
              reps: set.reps,
              weight: set.weight,
            }));
            if (formattedSets.length > 0) {
              await supabase.from('fitness_sets').insert(formattedSets);
            }
          }
        }
      }
      // Update calendar event
      const startTime = new Date(date);
      const calendarError = await updateCalendarEventFromSource(
        CALENDAR_SOURCES.WORKOUT,
        workoutId,
        {
          title: `Workout: ${title}`,
          start_time: startTime.toISOString(),
          description: notes || null,
        }
      );
      if (calendarError) {
        console.error('Calendar event update failed:', calendarError);
      }
      showSuccess('Workout updated successfully!');
      router.push('/fitness/workouts');
      return;
    }
    // Create mode: insert workout, then exercises, then calendar event
    const { data: workoutData, error: workoutError } = await insertWorkout({
      user_id: user.id,
      title,
      date,
      notes,
    });
    if (workoutError || !workoutData || !workoutData[0]?.id) return; // Toast handled by hook
    workoutId = workoutData[0].id;
    // Insert exercises
    if (exercises.length > 0) {
      const formatted = exercises.map((ex) => ({
        workout_id: workoutId,
        name: ex.name,
        notes: ex.notes,
      }));
      const { error: exError } = await insertExercises(formatted);
      if (exError) return; // Toast handled by hook
    }
    // Insert calendar event
    const calendarError = await createCalendarEventForEntity(CALENDAR_SOURCES.WORKOUT, {
      id: workoutId,
      user_id: user.id,
      title,
      date,
      notes,
    });
    if (calendarError) return; // Toast handled by hook
    showSuccess('Workout created successfully!');
    setTitle('');
    setDate('');
    setNotes('');
    setExercises([]);
    setExerciseForm({ name: '', notes: '' });
    router.push('/fitness/workouts');
  };

  const isLoading = userLoading || workoutLoading || exercisesLoading || calendarLoading || deleteLoading;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">{isEdit ? '✏️ Edit Workout' : '➕ Add Workout'}</h1>
      <p className="text-base">Create a new workout session with exercises and details.</p>
      {formError && <div className="text-red-500 mb-2">{formError}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Workout Title</FormLabel>
          <FormInput 
            type="text" 
            placeholder="Workout Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            required 
          />
        </div>
        <div>
          <FormLabel>Date</FormLabel>
          <FormInput 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)} 
            required 
          />
        </div>
        <div>
          <FormLabel>Notes (optional)</FormLabel>
          <FormTextarea 
            placeholder="Notes (optional)" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
            rows={3} 
          />
        </div>
        <FormSection title="💪 Exercises">
          <div className="space-y-4">
            <FormInput 
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
            {/* Only show set entry for new exercise in edit mode */}
            {isEdit && (
              <SetEditor
                initialSets={pendingSets}
                onSetsChange={handlePendingSetsChange}
                exerciseId={null}
              />
            )}
            <Button 
              type="button" 
              onClick={handleAddExercise} 
              variant="secondary"
              className="w-full"
            >
              ➕ Add Exercise
            </Button>
          </div>
        </FormSection>
        {exercises.length > 0 || newExercisesWithSets.length > 0 ? (
          <div className="mt-4">
            <h3 className="font-semibold text-md mb-2">
              <MdOutlineStickyNote2 className="inline w-5 h-5 text-base align-text-bottom mr-2" />
              Exercises Preview
            </h3>
            <ul className="space-y-2">
              {/* Existing exercises (read-only) */}
              {exercises.map((ex, i) => (
                <li key={ex.id || `existing-${i}`} className="border p-2 rounded flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{ex.name}</strong>
                      {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
                    </div>
                  </div>
                  {/* Existing exercises: read-only preview of sets */}
                  {isEdit && i < initialExercises.length && (
                    <div className="ml-2">
                      {editedSetsByExercise[ex.id]?.length ? (
                        editedSetsByExercise[ex.id].map((set, idx) => (
                          <div key={set.id || idx}>
                            Set {idx + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground text-sm">No sets logged yet.</div>
                      )}
                    </div>
                  )}
                </li>
              ))}
              {/* New exercises (just added, not yet saved to DB) */}
              {newExercisesWithSets.map((ex, i) => (
                <li key={`new-${i}`} className="border p-2 rounded flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong>{ex.name}</strong>
                      {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
                    </div>
                  </div>
                  <div className="ml-2">
                    {ex.sets && ex.sets.length > 0 ? (
                      ex.sets.map((set, idx) => (
                        <div key={set.id || idx}>
                          Set {idx + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}
                        </div>
                      ))
                    ) : (
                      <div className="text-muted-foreground text-sm">No sets logged yet.</div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <Button 
          type="submit" 
          variant="none"
          className="bg-card text-base border border-default px-4 py-2 rounded hover:bg-[#4a4a4a] transition-colors duration-200 focus:outline-none focus:ring-0 font-medium w-full mt-6"
          disabled={isLoading}
        >
          {isLoading ? <LoadingSpinner size={20} /> : `✅ ${isEdit ? 'Update Workout' : 'Save Workout'}`}
        </Button>
      </form>
    </div>
  );
}
