"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import BaseModal from '@/components/shared/BaseModal';
import { useWorkouts } from '@/lib/hooks/useWorkouts';
import dynamic from "next/dynamic";
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), { ssr: false, loading: () => <span className="inline-block w-4 h-4" /> });

// Skeleton component for workout items
function WorkoutSkeleton() {
  return (
    <div className="border p-3 rounded shadow-sm animate-pulse">
      <div className="h-6 bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="flex gap-4 mt-2">
        <div className="h-6 bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  );
}

export default function WorkoutsModal({ isOpen, onClose }) {
  const { user } = useUser();
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fetchedRef = useRef({ userId: null, done: false });
  const { fetchWorkouts, deleteWorkout } = useWorkouts();
  
  // Memoize fetchWorkouts to avoid unnecessary effect reruns
  const memoizedFetchWorkouts = useCallback(fetchWorkouts, [fetchWorkouts]);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  const loadWorkouts = useCallback(async () => {
    if (!userId) {
      setWorkoutsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    setWorkoutsLoading(true);
    
    try {
      const data = await memoizedFetchWorkouts(userId);
      setWorkouts(data || []);
      setWorkoutsLoading(false);
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading workouts:', error);
      setWorkoutsLoading(false);
      setHasInitialized(true);
    }
  }, [userId, memoizedFetchWorkouts]);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (fetchedRef.current.done && fetchedRef.current.userId === user.id) return;
    fetchedRef.current = { userId: user.id, done: true };
    loadWorkouts();
  }, [isOpen, user, loadWorkouts]);

  const handleDelete = useCallback(async (id) => {
    const confirm = window.confirm('Delete this workout?');
    if (!confirm) return;
    const success = await deleteWorkout(id);
    if (success) {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    }
  }, [deleteWorkout]);

  const handleStartWorkout = useCallback(() => {
    router.push('/fitness/workouts/live');
  }, [router]);

  // Determine what to render - memoized to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Don't render anything until we've initialized
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <WorkoutSkeleton key={`skeleton-${index}`} />
      ));
    }
    
    if (workoutsLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <WorkoutSkeleton key={`skeleton-${index}`} />
      ));
    }
    
    if (!user) {
      return <div data-testid="workouts-no-user" />;
    }
    
    if (workouts.length === 0) {
      return (
        <div className="border p-8 rounded shadow-sm text-center">
          <p className="text-muted-foreground text-sm mb-4" data-testid="workouts-empty">
            No entries yet. Click &quot;Start Workout&quot; to begin tracking your first session.
          </p>
          <Button 
            variant="primary" 
            className="flex items-center gap-2 mx-auto"
            onClick={handleStartWorkout}
          >
            <Dumbbell className="w-4 h-4" />
            Start Workout
          </Button>
        </div>
      );
    }
    
    return workouts.map((w) => (
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
          <EditButton
            onClick={() => router.push(`/fitness/workouts/${w.id}/edit`)}
          />
          <SharedDeleteButton
            onClick={() => handleDelete(w.id)}
            size="sm"
            aria-label="Delete workout"
            label="Delete"
          />
        </div>
      </li>
    ));
  }, [hasInitialized, workoutsLoading, user, workouts, router, handleDelete, handleStartWorkout]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Workouts"
      subtitle="Track your weightlifting and strength training sessions"
      icon={Dumbbell}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-4xl"
      data-testid="workouts-modal"
    >
      {/* Start Workout Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartWorkout}
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
        >
          <Dumbbell className="w-4 h-4" />
          Start New Workout
        </Button>
      </div>

      {/* Workout History */}
      <div className="space-y-3 min-h-[300px] relative" data-testid="workout-list">
        {content}
      </div>
    </BaseModal>
  );
} 