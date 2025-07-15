'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { Dumbbell } from 'lucide-react';

export default function WorkoutsDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  const fetchWorkouts = async () => {
    setWorkoutsLoading(true);
    const { data, error } = await supabase
      .from('fitness_workouts')
      .select('*')
      .order('date', { ascending: false });

    if (!error) setWorkouts(data);
    else console.error(error);
    setWorkoutsLoading(false);
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this workout?');
    if (!confirm) return;

    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      showError('You must be logged in.');
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
      showError('Failed to delete workout.');
    } else {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      showSuccess('Workout deleted successfully!');
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <Dumbbell className="w-5 h-5 text-base mr-2 inline-block" />
        Workouts
      </h1>
      <p className="text-base">Track your weightlifting and strength training sessions.</p>

      <Link href="/fitness/workouts/add" className="text-blue-600 underline mb-6 inline-block">
        ➕ Add New Workout
      </Link>

      <h2 className="text-xl font-semibold mb-2">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Workout History
      </h2>

      {workoutsLoading ? (
        <LoadingSpinner />
      ) : workouts.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-3">
          {workouts.map((w) => (
            <li key={w.id} className="border p-3 rounded shadow-sm">
              <div
                onClick={() => router.push(`/fitness/workouts/${w.id}`)}
                className="cursor-pointer hover:underline"
              >
                <div className="font-semibold text-lg">{w.title}</div>
                <div className="text-sm text-base">{w.date}</div>
                {w.notes && <div className="text-sm text-base mt-1">{w.notes}</div>}
              </div>

              <div className="flex gap-4 mt-2 text-sm">
                <Button
                  onClick={() => router.push(`/fitness/workouts/${w.id}/edit`)}
                  variant="link"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700"
                >
                  ✏️ Edit
                </Button>
                <Button
                  onClick={() => handleDelete(w.id)}
                  variant="link"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️ Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
