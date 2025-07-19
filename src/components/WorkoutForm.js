'use client';

import { useState } from 'react';
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
  const [exerciseForm, setExerciseForm] = useState({ name: '', sets: '', reps: '', weight: '', notes: '' });
  const [exercises, setExercises] = useState(initialExercises);

  const handleExerciseChange = (e) => {
    const { name, value } = e.target;
    setExerciseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExercise = (e) => {
    e.preventDefault();
    if (!exerciseForm.name || !exerciseForm.sets || !exerciseForm.reps) {
      showError('Please complete required exercise fields.');
      return;
    }
    setExercises((prev) => [...prev, exerciseForm]);
    setExerciseForm({ name: '', sets: '', reps: '', weight: '', notes: '' });
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
          sets: parseInt(ex.sets),
          reps: parseInt(ex.reps),
          weight: parseFloat(ex.weight),
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
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        weight: parseFloat(ex.weight),
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
    setExerciseForm({ name: '', sets: '', reps: '', weight: '', notes: '' });
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
            <div className="grid grid-cols-3 gap-4">
              <FormInput 
                name="sets" 
                type="number" 
                value={exerciseForm.sets} 
                onChange={handleExerciseChange} 
                placeholder="Sets" 
              />
              <FormInput 
                name="reps" 
                type="number" 
                value={exerciseForm.reps} 
                onChange={handleExerciseChange} 
                placeholder="Reps" 
              />
              <FormInput 
                name="weight" 
                type="number" 
                step="0.1" 
                value={exerciseForm.weight} 
                onChange={handleExerciseChange} 
                placeholder="Weight (lbs)" 
              />
            </div>
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
                    <strong>{ex.name}</strong> — {ex.sets}×{ex.reps} @ {ex.weight || 0} lbs
                    {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
                  </div>
                  <Button 
                    onClick={() => handleDeleteExercise(i)} 
                    variant="link"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
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
