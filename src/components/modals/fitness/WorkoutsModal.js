"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import SharedDeleteButton from "@/components/SharedDeleteButton";
import EditButton from "@/components/EditButton";
import BaseModal from "@/components/shared/BaseModal";
import WorkoutDetailsModal from "./WorkoutDetailsModal";
import { useWorkouts } from "@/lib/hooks/useWorkouts";
import dynamic from "next/dynamic";
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});

// Skeleton component for workout items
function WorkoutSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
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
  const [selectedWorkoutId, setSelectedWorkoutId] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
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
      console.error("Error loading workouts:", error);
      setWorkoutsLoading(false);
      setHasInitialized(true);
    }
  }, [userId, memoizedFetchWorkouts]);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (fetchedRef.current.done && fetchedRef.current.userId === user.id)
      return;
    fetchedRef.current = { userId: user.id, done: true };
    loadWorkouts();
  }, [isOpen, user, loadWorkouts]);

  const handleDelete = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this workout?");
      if (!confirm) return;
      const success = await deleteWorkout(id);
      if (success) {
        setWorkouts((prev) => prev.filter((w) => w.id !== id));
      }
    },
    [deleteWorkout],
  );

  const handleWorkoutClick = useCallback((workoutId) => {
    setSelectedWorkoutId(workoutId);
    setShowDetailsModal(true);
  }, []);

  const handleCloseDetailsModal = useCallback(() => {
    setShowDetailsModal(false);
    setSelectedWorkoutId(null);
  }, []);

  // Determine what to render - memoized to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Don't render anything until we've initialized
    if (!hasInitialized) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <WorkoutSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      );
    }

    if (workoutsLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <WorkoutSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      );
    }

    if (!user) {
      return <div data-testid="workouts-no-user" />;
    }

    if (workouts.length === 0) {
      return (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-700/20 rounded-xl flex items-center justify-center mx-auto">
            <Dumbbell className="w-8 h-8 text-gray-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">No workouts yet</h3>
            <p className="text-sm text-gray-400 max-w-sm mx-auto">
              Start your first workout to begin tracking your strength training progress
            </p>
          </div>
        </div>
      );
    }

    return (
      <ul className="space-y-3">
        {workouts.map((w) => (
          <li key={w.id} className="group">
            <div 
              onClick={() => handleWorkoutClick(w.id)}
              className="relative bg-card hover:bg-gray-700/50 transition-all duration-200 p-4 rounded-lg border border-border cursor-pointer group-hover:border-gray-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white truncate mb-1">
                    {w.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {w.date}
                  </p>
                  {w.notes && (
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">
                      {w.notes}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <EditButton
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`/fitness/workouts/${w.id}/edit`, '_blank');
                    }}
                    size="sm"
                    iconOnly={true}
                    className="w-8 h-8"
                  />
                  <SharedDeleteButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(w.id);
                    }}
                    size="sm"
                    iconOnly={true}
                    className="w-8 h-8"
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    );
  }, [
    hasInitialized,
    workoutsLoading,
    user,
    workouts,
    router,
    handleDelete,
    handleWorkoutClick,
  ]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Workouts"
      subtitle="Track your weightlifting and strength training sessions"
      icon={Dumbbell}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      maxWidth="max-w-4xl"
      data-testid="workouts-modal"
    >
      <div className="space-y-6">
        {/* Workout History */}
        <div
          className="min-h-[300px] relative"
          data-testid="workout-list"
        >
          {content}
        </div>
      </div>
      
      {/* Workout Details Modal */}
      <WorkoutDetailsModal
        isOpen={showDetailsModal}
        onClose={handleCloseDetailsModal}
        workoutId={selectedWorkoutId}
      />
    </BaseModal>
  );
}
