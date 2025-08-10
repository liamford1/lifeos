"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useUser } from "@/context/UserContext";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import Button from "@/components/shared/Button";
import BaseModal from "@/components/shared/BaseModal";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/client/Toast";
import { MdOutlineCalendarToday } from "react-icons/md";
import dynamic from "next/dynamic";
const Dumbbell = dynamic(() => import("lucide-react/dist/esm/icons/dumbbell"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});

export default function WorkoutDetailsModal({ isOpen, onClose, workoutId }) {
  const { user } = useUser();
  const { showError } = useToast();
  const [workout, setWorkout] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [setsByExercise, setSetsByExercise] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWorkoutDetails = useCallback(async () => {
    if (!workoutId || !user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch workout details
      const { data: workoutData, error: workoutErr } = await supabase
        .from('fitness_workouts')
        .select('*')
        .eq('id', workoutId)
        .single();
      
      if (workoutErr) throw workoutErr;
      setWorkout(workoutData);

      // Fetch exercises
      const { data: exerciseData, error: exerciseErr } = await supabase
        .from('fitness_exercises')
        .select('*')
        .eq('workout_id', workoutId);
      
      if (exerciseErr) throw exerciseErr;
      setExercises(exerciseData || []);

      // Fetch sets for each exercise
      const setsByEx = {};
      for (const ex of exerciseData || []) {
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
      if (typeof showError === 'function') {
        showError(err.message || 'Failed to load workout details.');
      }
    } finally {
      setLoading(false);
    }
  }, [workoutId, user, showError]);

  useEffect(() => {
    if (isOpen && workoutId) {
      fetchWorkoutDetails();
    }
  }, [isOpen, workoutId, fetchWorkoutDetails]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setWorkout(null);
      setExercises([]);
      setSetsByExercise({});
      setLoading(true);
      setError(null);
    }
  }, [isOpen]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-8">
          <p className="text-red-500 text-sm">{error}</p>
        </div>
      );
    }

    if (!workout) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400 text-sm">Workout not found.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Workout Header */}
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold text-white mb-1">{workout.title}</h2>
            <p className="text-sm text-gray-400">{workout.date}</p>
          </div>
          {workout.notes && (
            <div className="bg-gray-700/20 rounded-lg p-3">
              <p className="text-sm text-gray-300 italic">{workout.notes}</p>
            </div>
          )}
        </div>

        {/* Exercises Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span role="img" aria-label="muscle">💪</span>
            Exercises
          </h3>
          
          {exercises.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-gray-700/20 rounded-lg flex items-center justify-center mx-auto">
                <Dumbbell className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">No exercises logged yet</p>
                <p className="text-xs text-gray-500 mt-1">Add exercises to track your workout</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div key={ex.id} className="bg-card border border-border rounded-lg p-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-1">{ex.name}</h4>
                      {ex.notes && (
                        <p className="text-sm text-gray-400">{ex.notes}</p>
                      )}
                    </div>
                    
                    <div className="ml-2">
                      {setsByExercise[ex.id]?.length ? (
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-300">Sets:</h5>
                          <ul className="space-y-1">
                            {setsByExercise[ex.id].map((set, i) => (
                              <li key={set.id} className="text-sm text-gray-300 flex items-center gap-2">
                                <span className="w-6 h-6 bg-gray-700/50 rounded-full flex items-center justify-center text-xs font-medium">
                                  {i + 1}
                                </span>
                                <span>
                                  {set.reps} reps
                                  {set.weight != null && ` @ ${set.weight} lbs`}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No sets logged yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }, [loading, error, workout, exercises, setsByExercise]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Workout Details"
      subtitle="View your workout exercises and sets"
      icon={Dumbbell}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      maxWidth="max-w-4xl"
      data-testid="workout-details-modal"
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {content}
      </div>
    </BaseModal>
  );
}
