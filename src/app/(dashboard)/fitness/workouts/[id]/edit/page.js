'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import WorkoutForm from '@/components/WorkoutForm';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/calendarUtils';

export default function EditWorkoutPage() {
  const params = useParams();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

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
  }, [params.id, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  if (!workout) return <div className="p-4"><p className="text-muted-foreground text-sm">Workout not found.</p></div>;

  return <WorkoutForm initialWorkout={workout} initialExercises={exercises} isEdit />;
}
