'use client';

import { useParams, useRouter } from 'next/navigation';
import { useFetchEntity } from '@/lib/useSupabaseCrud';
import BackButton from '@/components/BackButton';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useEffect, useState } from 'react';
import { useToast } from '@/components/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { supabase } from '@/lib/supabaseClient';

export default function WorkoutDetailPage() {
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showError } = useToast();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user]);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data: workoutData, error: workoutErr } = await supabase
          .from('fitness_workouts')
          .select('*')
          .eq('id', params.id)
          .single();
        if (workoutErr) throw workoutErr;
        setWorkout(workoutData);

        const { data: exerciseData, error: exerciseErr } = await supabase
          .from('fitness_exercises')
          .select('*')
          .eq('workout_id', params.id);
        if (exerciseErr) throw exerciseErr;
        setExercises(exerciseData);

        // Fetch sets for each exercise
        const setsByEx = {};
        for (const ex of exerciseData) {
          const { data: setsData, error: setsErr } = await supabase
            .from('fitness_sets')
            .select('*')
            .eq('exercise_id', ex.id)
            .order('created_at', { ascending: true });
          if (setsErr) throw setsErr;
          setsByEx[ex.id] = setsData || [];
        }
        setSetsByExercise(setsByEx);
      } catch (err) {
        setError(err.message || 'Failed to load workout details.');
        showError(err.message || 'Failed to load workout details.');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user]);

  if (loading || userLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (error) return <div className="p-4"><p className="text-red-500 text-sm">{error}</p></div>;
  if (!workout) return <div className="p-4"><p className="text-muted-foreground text-sm">Workout not found.</p></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">{workout.title}</h1>
      <p className="text-base">View your workout details and exercises.</p>
      <p className="text-sm text-base mb-3">{workout.date}</p>
      {workout.notes && <p className="mb-4 italic text-base">{workout.notes}</p>}

      <h2 className="text-xl font-semibold mb-2">💪 Exercises</h2>
      {exercises.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-2">
          {exercises.map((ex) => (
            <li key={ex.id} className="border p-2 rounded">
              <strong>{ex.name}</strong>
              <div className="ml-2">
                {setsByExercise[ex.id]?.length ? (
                  setsByExercise[ex.id].map((set, i) => (
                    <div key={set.id}>
                      Set {i + 1}: {set.reps} reps{set.weight != null ? ` @ ${set.weight} lbs` : ''}
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">No sets logged yet.</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
          Back to Calendar
        </button>
      </div>
    </div>
  );
}
