'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent, deleteWorkoutCascade } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { Dumbbell } from 'lucide-react';
import { format } from 'date-fns';
import SharedDeleteButton from '@/components/SharedDeleteButton';

export default function WorkoutsDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  const fetchWorkouts = async () => {
    setWorkoutsLoading(true);
    const { data, error } = await supabase
      .from('fitness_workouts')
      .select('*')
      .order('date', { ascending: false });

    if (!error) setWorkouts(data);
    else showError('Failed to fetch workouts.');
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

    // Use cascade delete for workouts
    const error = await deleteWorkoutCascade({ workoutId: id, user_id });

    if (error) {
      showError('Failed to delete workout.');
    } else {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
      showSuccess('Workout deleted successfully!');
    }
  };

  const handleStartWorkout = async () => {
    if (!user) return router.push('/auth');
    setCreating(true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const formattedTitle = `Workout - ${format(now, 'MMMM d, yyyy')}`;
    const { data, error } = await supabase
      .from('fitness_workouts')
      .insert({
        user_id: user.id,
        title: formattedTitle,
        notes: '',
        in_progress: true,
        start_time: now.toISOString(),
        date: today,
      })
      .select()
      .single();
    setCreating(false);
    if (!error && data) {
      router.push('/fitness/workouts/live');
    } else {
      showError(error?.message || 'Failed to start workout');
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

      <div className="flex gap-4 mb-4">
        <Button
          variant="primary"
          onClick={handleStartWorkout}
          loading={creating}
          disabled={creating}
        >
          Start Workout
        </Button>
      </div>

      <h2 className="text-xl font-semibold mb-2">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Workout History
      </h2>

      {/* Conditional rendering here */}
      {loading ? (
        <LoadingSpinner />
      ) : !user ? (
        null
      ) : workoutsLoading ? (
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
                <SharedDeleteButton
                  onClick={() => handleDelete(w.id)}
                  size="sm"
                  aria-label="Delete workout"
                  label="Delete"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
