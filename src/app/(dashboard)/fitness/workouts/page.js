'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import { useRouter } from 'next/navigation';

export default function WorkoutsDashboard() {
  const [workouts, setWorkouts] = useState([]);
  const router = useRouter();

  const fetchWorkouts = async () => {
    const { data, error } = await supabase
      .from('fitness_workouts')
      .select('*')
      .order('date', { ascending: false });

    if (!error) setWorkouts(data);
    else console.error(error);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this workout?');
    if (!confirm) return;

    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      alert('You must be logged in.');
      return;
    }

    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_workouts',
      id: id,
      user_id: user_id,
      source: 'workout',
    });

    if (error) {
      console.error(error);
      alert('Failed to delete workout.');
    } else {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <main className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">🏋️ Workouts</h1>

      <Link href="/fitness/workouts/add" className="text-blue-600 underline mb-6 inline-block">
        ➕ Add New Workout
      </Link>

      <h2 className="text-xl font-semibold mb-2">📅 Workout History</h2>

      {workouts.length === 0 ? (
        <p>No workouts yet.</p>
      ) : (
        <ul className="space-y-3">
          {workouts.map((w) => (
            <li key={w.id} className="border p-3 rounded shadow-sm">
              <div
                onClick={() => router.push(`/fitness/workouts/${w.id}`)}
                className="cursor-pointer hover:underline"
              >
                <div className="font-semibold text-lg">{w.title}</div>
                <div className="text-sm text-gray-600">{w.date}</div>
                {w.notes && <div className="text-sm text-gray-700 mt-1">{w.notes}</div>}
              </div>

              <div className="flex gap-4 mt-2 text-sm">
                <button
                  onClick={() => router.push(`/fitness/workouts/${w.id}/edit`)}
                  className="text-blue-500 hover:underline"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="text-red-500 hover:underline"
                >
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
