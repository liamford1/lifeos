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

  // Fetch sets for each exercise in edit mode on page load
  useEffect(() => {
    if (!isEdit || !exercises || exercises.length === 0) return;
    const fetchSets = async () => {
      const newSetsByExercise = {};
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
  }, [isEdit, exercises]);

  const handleExerciseChange = (e) => {
    const { name, value } = e.target;
    setExerciseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!exerciseForm.name) {
      showError('Please enter an exercise name.');
      return;
    }
    setExercises((prev) => [...prev, { name: exerciseForm.name, notes: exerciseForm.notes }]);
    setExerciseForm({ name: '', notes: '' });
  };

  const handleDeleteExercise = (index) => {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showError('You must be logged in.');
      return;
    }
    let workoutId = initialWorkout?.id;
    // Edit mode: update workout, delete old exercises, then insert new exercises
    if (isEdit) {
      // Update workout
      const { data: updated, error: updateError } = await insertWorkout({
        id: workoutId,
        user_id: user.id,
        title,
        date,
        notes,
      });
      if (updateError) return; // Toast handled by hook
      // Delete old exercises
      const { error: delError } = await deleteByFilters({ workout_id: workoutId });
      if (delError) return; // Toast handled by hook
      // Insert new exercises
      if (exercises.length > 0) {
        const formatted = exercises.map((ex) => ({
          workout_id: workoutId,
          name: ex.name,
          notes: ex.notes,
        }));
        const { error: exError } = await insertExercises(formatted);
        if (exError) return; // Toast handled by hook
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
        {exercises.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold text-md mb-2">
              <MdOutlineStickyNote2 className="inline w-5 h-5 text-base align-text-bottom mr-2" />
              Exercises Preview
            </h3>
            <ul className="space-y-2">
              {exercises.map((ex, i) => (
                <li key={i} className="border p-2 rounded flex justify-between items-start">
                  <div>
                    <strong>{ex.name}</strong>
                    {isEdit ? (
                      <div className="ml-2">
                        {setsByExercise[ex.id]?.length ? (
                          setsByExercise[ex.id].map((set, idx) => (
                            <div key={set.id}>
                              Set {idx + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm">No sets logged yet.</div>
                        )}
                      </div>
                    ) : null}
                    {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
                  </div>
                  <DeleteButton
                    onClick={() => handleDeleteExercise(i)}
                    loading={deleteLoading}
                    ariaLabel={`Delete exercise ${ex.name || i+1}`}
                  />
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
        >
          {isLoading ? <LoadingSpinner size={20} /> : `✅ ${isEdit ? 'Update Workout' : 'Save Workout'}`}
        </Button>
      </form>
    </div>
  );
}
