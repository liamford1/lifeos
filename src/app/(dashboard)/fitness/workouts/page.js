"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent, deleteWorkoutCascade } from '@/lib/utils/deleteUtils';
import BackButton from '@/components/shared/BackButton';
import Button from '@/components/shared/Button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import dynamic from "next/dynamic";
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), { ssr: false });
import { format } from 'date-fns';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import { useWorkouts } from '@/lib/hooks/useWorkouts';

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

export default function WorkoutsDashboard() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [workouts, setWorkouts] = useState([]);
  const [workoutsLoading, setWorkoutsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { fetchWorkouts, deleteWorkout } = useWorkouts();
  
  // Memoize fetchWorkouts to avoid unnecessary effect reruns
  const memoizedFetchWorkouts = useCallback(fetchWorkouts, []);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    let isMounted = true;
    
    async function loadWorkouts() {
      if (!userId) {
        if (isMounted) {
          setWorkoutsLoading(false);
          setHasInitialized(true);
        }
        return;
      }
      
      if (isMounted) {
        setWorkoutsLoading(true);
      }
      
      try {
        const data = await memoizedFetchWorkouts(userId);
        if (isMounted) {
          setWorkouts(data || []);
          setWorkoutsLoading(false);
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('Error loading workouts:', error);
        if (isMounted) {
          setWorkoutsLoading(false);
          setHasInitialized(true);
        }
      }
    }
    
    loadWorkouts();
    
    return () => { 
      isMounted = false; 
    };
  }, [userId, memoizedFetchWorkouts]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this workout?');
    if (!confirm) return;
    const success = await deleteWorkout(id);
    if (success) {
      setWorkouts((prev) => prev.filter((w) => w.id !== id));
    }
  };

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
          <p className="text-muted-foreground text-sm" data-testid="workouts-empty">
            No entries yet. Add one above ⬆️
          </p>
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
  }, [hasInitialized, workoutsLoading, user, workouts, router]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <Dumbbell className="w-5 h-5 text-base mr-2 inline-block" />
        Workouts
      </h1>
      <p className="text-base">Track your weightlifting and strength training sessions.</p>

      <h2 className="text-xl font-semibold mb-2">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Workout History
      </h2>

      {/* Stable container with consistent height */}
      <div className="space-y-3 min-h-[300px] relative" data-testid="workout-list">
        {content}
      </div>
    </div>
  );
}
