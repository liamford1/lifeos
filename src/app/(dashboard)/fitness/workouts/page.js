"use client";

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
import dynamic from "next/dynamic";
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), { ssr: false });
import { format } from 'date-fns';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useWorkouts } from '@/lib/hooks/useWorkouts';

export default function WorkoutsDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { fetchWorkouts, createWorkout, deleteWorkout } = useWorkouts();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadWorkouts() {
      if (!user) return;
      setWorkoutsLoading(true);
      const data = await fetchWorkouts(user.id);
      if (data) setWorkouts(data);
      setWorkoutsLoading(false);
    }
    if (user) loadWorkouts();
  }, [user, fetchWorkouts]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this workout?');
    if (!confirm) return;
    const success = await deleteWorkout(id);
    if (success) {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    }
  };

  const handleStartWorkout = async () => {
    if (!user) return router.push('/auth');
    setCreating(true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const formattedTitle = `Workout - ${format(now, 'MMMM d, yyyy')}`;
    const data = await createWorkout({
      user_id: user.id,
      title: formattedTitle,
      notes: '',
      in_progress: true,
      start_time: now.toISOString(),
      date: today,
    });
    setCreating(false);
    if (data) {
      router.push('/fitness/workouts/live');
    }
  };

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
          data-testid="add-workout-button"
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
