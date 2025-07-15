'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function WorkoutDetailPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [workoutLoading, setWorkoutLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  useEffect(() => {
    const fetchData = async () => {
      setWorkoutLoading(true);
      const { data: w } = await supabase.from('fitness_workouts').select('*').eq('id', id).single();
      const { data: e } = await supabase.from('fitness_exercises').select('*').eq('workout_id', id);
      setWorkout(w);
      setExercises(e || []);
      setWorkoutLoading(false);
    };

    fetchData();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      {workoutLoading ? (
        <LoadingSpinner />
      ) : !workout ? (
        <p className="text-muted-foreground text-sm">Workout not found.</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-1">{workout.title}</h1>
          <p className="text-sm text-gray-600 mb-3">{workout.date}</p>
          {workout.notes && <p className="mb-4 italic text-gray-700">{workout.notes}</p>}

          <h2 className="text-xl font-semibold mb-2">💪 Exercises</h2>
          {exercises.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
          ) : (
            <ul className="space-y-2">
              {exercises.map((ex) => (
                <li key={ex.id} className="border p-2 rounded">
                  <strong>{ex.name}</strong> — {ex.sets}×{ex.reps} @ {ex.weight} lbs
                  {ex.notes && <p className="text-sm text-gray-600">{ex.notes}</p>}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6">
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              📅 Back to Calendar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
