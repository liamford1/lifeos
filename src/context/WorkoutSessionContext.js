"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const WorkoutSessionContext = createContext({
  activeWorkoutId: null,
  setActiveWorkoutId: () => {},
  workoutData: null,
  refreshWorkout: () => {},
  loading: true,
});

export function WorkoutSessionProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [activeWorkoutId, setActiveWorkoutIdRaw] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInProgressWorkout = useCallback(async () => {
    if (!user) {
      setWorkoutData(null);
      setActiveWorkoutIdRaw(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('fitness_workouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('in_progress', true)
      .order('start_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      setActiveWorkoutIdRaw(data.id);
      setWorkoutData(data);
    } else {
      setActiveWorkoutIdRaw(null);
      setWorkoutData(null);
    }
    setLoading(false);
  }, [user]);

  const setActiveWorkoutId = useCallback((id) => {
    setActiveWorkoutIdRaw(id);
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchInProgressWorkout();
    }
  }, [user, userLoading, fetchInProgressWorkout]);

  const value = useMemo(
    () => ({
      activeWorkoutId,
      setActiveWorkoutId,
      workoutData,
      refreshWorkout: fetchInProgressWorkout,
      loading,
    }),
    [activeWorkoutId, setActiveWorkoutId, workoutData, fetchInProgressWorkout, loading]
  );

  // React Profiler root marker
  return (
    <WorkoutSessionContext.Provider value={value}>
      {/* react-profiler-start:WorkoutSessionContext */}
      {children}
      {/* react-profiler-end */}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  return useContext(WorkoutSessionContext);
} 