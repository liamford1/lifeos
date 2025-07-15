'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import FormSection from '@/components/FormSection';
import { CALENDAR_SOURCES, updateCalendarEvent } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';

export default function WorkoutForm({ initialWorkout = null, initialExercises = [], isEdit = false }) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

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
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    if (!user_id) {
      showError('You must be logged in.');
      return;
    }

    let workoutId = initialWorkout?.id;
    if (isEdit) {
      const { error: updateError } = await supabase
        .from('fitness_workouts')
        .update({ title, date, notes })
        .eq('id', workoutId);

      if (updateError) {
        console.error(updateError);
        showError('Failed to update workout.');
        return;
      }

      // Update calendar event for the edited workout
      const startTime = new Date(date);
      const calendarError = await updateCalendarEvent(
        CALENDAR_SOURCES.WORKOUT,
        workoutId,
        `Workout: ${title}`,
        startTime.toISOString(),
        null
      );

      if (calendarError) {
        console.error('Calendar event update failed:', calendarError);
      }

      // Delete old exercises
      await supabase.from('fitness_exercises').delete().eq('workout_id', workoutId);
    } else {
      const { data: workout, error } = await supabase
        .from('fitness_workouts')
        .insert([{ user_id, title, date, notes }])
        .select()
        .single();

      if (error) {
        console.error(error);
        showError('Failed to create workout.');
        return;
      }
      workoutId = workout.id;

      // Create calendar event for the new workout
      const startTime = new Date(date);
      const { error: calendarError } = await supabase.from('calendar_events').insert({
        user_id: user_id,
        title: `Workout: ${title}`,
        source: CALENDAR_SOURCES.WORKOUT,
        source_id: workoutId,
        start_time: startTime.toISOString(),
        end_time: null,
      });

      if (calendarError) {
        console.error('Calendar event creation failed:', calendarError);
      }
    }

    if (exercises.length > 0) {
      const formatted = exercises.map((ex) => ({
        workout_id: workoutId,
        name: ex.name,
        sets: parseInt(ex.sets),
        reps: parseInt(ex.reps),
        weight: parseFloat(ex.weight),
        notes: ex.notes,
      }));

      const { error: exError } = await supabase.from('fitness_exercises').insert(formatted);
      if (exError) {
        console.error(exError);
        showError('Workout saved but failed to add exercises.');
      }
    }

    showSuccess(isEdit ? 'Workout updated successfully!' : 'Workout created successfully!');
    router.push('/fitness/workouts');
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">{isEdit ? '✏️ Edit Workout' : '➕ Add Workout'}</h1>

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
            <h3 className="font-semibold text-md mb-2">📝 Exercises Preview</h3>
            <ul className="space-y-2">
              {exercises.map((ex, i) => (
                <li key={i} className="border p-2 rounded flex justify-between items-start">
                  <div>
                    <strong>{ex.name}</strong> — {ex.sets}×{ex.reps} @ {ex.weight || 0} lbs
                    {ex.notes && <p className="text-sm text-gray-600">{ex.notes}</p>}
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
          variant="primary"
          className="w-full mt-6"
        >
          ✅ {isEdit ? 'Update Workout' : 'Save Workout'}
        </Button>
      </form>
    </div>
  );
}
