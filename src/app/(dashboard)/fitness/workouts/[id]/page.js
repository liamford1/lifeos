'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';

export default function WorkoutDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: w } = await supabase.from('fitness_workouts').select('*').eq('id', id).single();
      const { data: e } = await supabase.from('fitness_exercises').select('*').eq('workout_id', id);
      setWorkout(w);
      setExercises(e || []);
    };

    fetchData();
  }, [id]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      {!workout ? (
        <p>Loading workout...</p>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-1">{workout.title}</h1>
          <p className="text-sm text-gray-600 mb-3">{workout.date}</p>
          {workout.notes && <p className="mb-4 italic text-gray-700">{workout.notes}</p>}

          <h2 className="text-xl font-semibold mb-2">💪 Exercises</h2>
          {exercises.length === 0 ? (
            <p>No exercises logged.</p>
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
