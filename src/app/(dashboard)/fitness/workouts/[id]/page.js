'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFetchEntity } from '@/lib/useSupabaseCrud';
import BackButton from '@/components/BackButton';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect } from 'react';
import { useToast } from '@/components/Toast';

export default function WorkoutDetailPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const { data: workoutArr, loading: workoutLoading, error: workoutError } = useFetchEntity('fitness_workouts', { id });
  const { data: exercises, loading: exercisesLoading, error: exercisesError } = useFetchEntity('fitness_exercises', { workout_id: id });
  const { showError } = useToast();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  useEffect(() => {
    if (workoutError) showError(workoutError.message || 'Failed to load workout.');
    if (exercisesError) showError(exercisesError.message || 'Failed to load exercises.');
  }, [workoutError, exercisesError, showError]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const workout = Array.isArray(workoutArr) ? workoutArr[0] : workoutArr;
  const isLoading = workoutLoading || exercisesLoading;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      {isLoading ? (
        <LoadingSpinner />
      ) : workoutError ? (
        <p className="text-red-500 text-sm">Failed to load workout.</p>
      ) : !workout ? (
        <p className="text-muted-foreground text-sm">Workout not found.</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold">{workout.title}</h1>
          <p className="text-base">View your workout details and exercises.</p>
          <p className="text-sm text-base mb-3">{workout.date}</p>
          {workout.notes && <p className="mb-4 italic text-base">{workout.notes}</p>}

          <h2 className="text-xl font-semibold mb-2">💪 Exercises</h2>
          {exercisesLoading ? (
            <LoadingSpinner />
          ) : exercisesError ? (
            <p className="text-red-500 text-sm">Failed to load exercises.</p>
          ) : !exercises || exercises.length === 0 ? (
            <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
          ) : (
            <ul className="space-y-2">
              {exercises.map((ex) => (
                <li key={ex.id} className="border p-2 rounded">
                  <strong>{ex.name}</strong> — {ex.sets}×{ex.reps} @ {ex.weight} lbs
                  {ex.notes && <p className="text-sm text-base">{ex.notes}</p>}
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
