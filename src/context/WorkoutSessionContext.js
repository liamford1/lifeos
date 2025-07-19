"use client";

import { createContext, useContext, useEffect, useState } from 'react';
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
  const [activeWorkoutId, setActiveWorkoutId] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInProgressWorkout = async () => {
    if (!user) {
      setWorkoutData(null);
      setActiveWorkoutId(null);
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
      setActiveWorkoutId(data.id);
      setWorkoutData(data);
    } else {
      setActiveWorkoutId(null);
      setWorkoutData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading) {
      fetchInProgressWorkout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading]);

  return (
    <WorkoutSessionContext.Provider value={{
      activeWorkoutId,
      setActiveWorkoutId,
      workoutData,
      refreshWorkout: fetchInProgressWorkout,
      loading,
    }}>
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  return useContext(WorkoutSessionContext);
} 