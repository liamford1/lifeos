'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import WorkoutForm from '@/components/WorkoutForm';

export default function EditWorkoutPage() {
  const params = useParams();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkout = async () => {
      const { data: workoutData } = await supabase
        .from('fitness_workouts')
        .select('*')
        .eq('id', params.id)
        .single();

      const { data: exerciseData } = await supabase
        .from('fitness_exercises')
        .select('*')
        .eq('workout_id', params.id);

      setWorkout(workoutData);
      setExercises(exerciseData);
      setLoading(false);
    };

    fetchWorkout();
  }, [params.id]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!workout) return <div className="p-4">Workout not found.</div>;

  return <WorkoutForm initialWorkout={workout} initialExercises={exercises} isEdit />;
}
