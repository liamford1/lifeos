"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  
  // Workout session state
  const [activeWorkoutId, setActiveWorkoutIdRaw] = useState(null);
  const [workoutData, setWorkoutData] = useState(null);
  const [workoutLoading, setWorkoutLoading] = useState(true);

  // Cardio session state
  const [activeCardioId, setActiveCardioIdRaw] = useState(null);
  const [cardioData, setCardioData] = useState(null);
  const [cardioLoading, setCardioLoading] = useState(true);

  // Sports session state
  const [activeSportsId, setActiveSportsIdRaw] = useState(null);
  const [sportsData, setSportsData] = useState(null);
  const [sportsLoading, setSportsLoading] = useState(true);

  // Stretching session state
  const [activeStretchingId, setActiveStretchingIdRaw] = useState(null);
  const [stretchingData, setStretchingData] = useState(null);
  const [stretchingLoading, setStretchingLoading] = useState(true);

  // Cooking session state
  const [mealId, setMealId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [instructions, setInstructions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [cookingLoading, setCookingLoading] = useState(true);

  // Memoized fetch functions to prevent unnecessary re-renders
  const fetchInProgressWorkout = useCallback(async () => {
    if (!user) {
      setWorkoutData(null);
      setActiveWorkoutIdRaw(null);
      setWorkoutLoading(false);
      return;
    }
    setWorkoutLoading(true);
    try {
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
    } catch (err) {
      console.error('Error fetching in-progress workout:', err);
      setActiveWorkoutIdRaw(null);
      setWorkoutData(null);
    } finally {
      setWorkoutLoading(false);
    }
  }, [user]);

  const fetchInProgressCardio = useCallback(async () => {
    if (!user) {
      setCardioData(null);
      setActiveCardioIdRaw(null);
      setCardioLoading(false);
      return;
    }
    setCardioLoading(true);
    try {
      const { data, error } = await supabase
        .from('fitness_cardio')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_progress', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        setActiveCardioIdRaw(data.id);
        setCardioData(data);
      } else {
        setActiveCardioIdRaw(null);
        setCardioData(null);
      }
    } catch (err) {
      console.error('Error fetching in-progress cardio:', err);
      setActiveCardioIdRaw(null);
      setCardioData(null);
    } finally {
      setCardioLoading(false);
    }
  }, [user]);

  const fetchInProgressSports = useCallback(async () => {
    if (!user) {
      setSportsData(null);
      setActiveSportsIdRaw(null);
      setSportsLoading(false);
      return;
    }
    setSportsLoading(true);
    try {
      const { data, error } = await supabase
        .from('fitness_sports')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_progress', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        setActiveSportsIdRaw(data.id);
        setSportsData(data);
      } else {
        setActiveSportsIdRaw(null);
        setSportsData(null);
      }
    } catch (err) {
      console.error('Error fetching in-progress sports:', err);
      setActiveSportsIdRaw(null);
      setSportsData(null);
    } finally {
      setSportsLoading(false);
    }
  }, [user]);

  const fetchInProgressStretching = useCallback(async () => {
    if (!user) {
      setStretchingData(null);
      setActiveStretchingIdRaw(null);
      setStretchingLoading(false);
      return;
    }
    setStretchingLoading(true);
    try {
      const { data, error } = await supabase
        .from('fitness_stretching')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_progress', true)
        .order('start_time', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (!error && data) {
        setActiveStretchingIdRaw(data.id);
        setStretchingData(data);
      } else {
        setActiveStretchingIdRaw(null);
        setStretchingData(null);
      }
    } catch (err) {
      console.error('Error fetching in-progress stretching:', err);
      setActiveStretchingIdRaw(null);
      setStretchingData(null);
    } finally {
      setStretchingLoading(false);
    }
  }, [user]);

  const fetchActiveCookingSession = useCallback(async () => {
    if (!user) {
      setMealId(null);
      setCurrentStep(0);
      setInstructions([]);
      setSessionId(null);
      setStartedAt(null);
      setCookingLoading(false);
      return;
    }
    setCookingLoading(true);
    const { data, error } = await supabase
      .from('cooking_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('in_progress', true)
      .order('started_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error fetching active cooking session:', error);
    }

    if (data && data.length > 0) {
      const [session] = data;
      setMealId(session.meal_id);
      setSessionId(session.id);
      setStartedAt(session.started_at);
      setCurrentStep(session.current_step || 1);
      setInstructions(session.instructions || []);
    } else {
      setMealId(null);
      setCurrentStep(0);
      setInstructions([]);
      setSessionId(null);
      setStartedAt(null);
    }
    setCookingLoading(false);
  }, [user]);

  // Fetch all sessions when user changes
  useEffect(() => {
    if (!userLoading) {
      fetchInProgressWorkout();
      fetchInProgressCardio();
      fetchInProgressSports();
      fetchInProgressStretching();
      fetchActiveCookingSession();
    }
  }, [user, userLoading, fetchInProgressWorkout, fetchInProgressCardio, fetchInProgressSports, fetchInProgressStretching, fetchActiveCookingSession]);

  // Memoized setter functions
  const setActiveWorkoutId = useCallback((id) => {
    setActiveWorkoutIdRaw(id);
  }, []);

  const setActiveCardioId = useCallback((id) => {
    setActiveCardioIdRaw(id);
  }, []);

  const setActiveSportsId = useCallback((id) => {
    setActiveSportsIdRaw(id);
  }, []);

  const setActiveStretchingId = useCallback((id) => {
    setActiveStretchingIdRaw(id);
  }, []);

  // Memoized clear functions
  const clearWorkoutSession = useCallback(() => {
    setActiveWorkoutIdRaw(null);
    setWorkoutData(null);
  }, []);

  const clearCardioSession = useCallback(() => {
    setActiveCardioIdRaw(null);
    setCardioData(null);
  }, []);

  const clearSportsSession = useCallback(() => {
    setActiveSportsIdRaw(null);
    setSportsData(null);
  }, []);

  const clearStretchingSession = useCallback(() => {
    setActiveStretchingIdRaw(null);
    setStretchingData(null);
  }, []);

  // Cooking session functions
  const startCooking = useCallback(async (newMealId, newInstructions) => {
    if (!user) return;
    // End any previous session
    await supabase
      .from('cooking_sessions')
      .update({ in_progress: false, ended_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('in_progress', true);
    // Start new session
    const { data, error } = await supabase
      .from('cooking_sessions')
      .insert({
        user_id: user.id,
        meal_id: newMealId,
        in_progress: true,
        started_at: new Date().toISOString(),
        current_step: 1,
      })
      .select()
      .single();
    if (!error && data) {
      setMealId(newMealId);
      setSessionId(data.id);
      setStartedAt(data.started_at);
      setInstructions(Array.isArray(newInstructions) ? newInstructions : []);
      setCurrentStep(1);
    }
  }, [user]);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (instructions && prev < instructions.length) {
        return prev + 1;
      }
      return prev;
    });
  }, [instructions]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 1 ? prev - 1 : 1));
  }, []);

  const endCooking = useCallback(async () => {
    if (!user || !sessionId || !mealId) {
      return;
    }
    // End the cooking session in the DB
    await supabase
      .from('cooking_sessions')
      .update({ in_progress: false, ended_at: new Date().toISOString(), current_step: 1 })
      .eq('id', sessionId);
    // Upsert into cooked_meals
    const { data: existing, error: fetchError } = await supabase
      .from('cooked_meals')
      .select('cook_count, user_id, meal_id')
      .eq('user_id', user.id)
      .eq('meal_id', mealId)
      .maybeSingle();
    if (!fetchError && existing) {
      // Increment cook_count
      await supabase
        .from('cooked_meals')
        .update({
          cook_count: (existing.cook_count || 0) + 1,
          last_cooked_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('meal_id', mealId);
    } else {
      // Insert new row
      await supabase
        .from('cooked_meals')
        .insert({
          user_id: user.id,
          meal_id: mealId,
          cook_count: 1,
          last_cooked_at: new Date().toISOString(),
        });
    }
    setMealId(null);
    setSessionId(null);
    setStartedAt(null);
    setInstructions([]);
    setCurrentStep(1);
    fetchActiveCookingSession();
  }, [user, sessionId, mealId, fetchActiveCookingSession]);

  const cancelCooking = useCallback(async () => {
    if (!user || !sessionId) {
      return;
    }
    await supabase
      .from('cooking_sessions')
      .update({ in_progress: false, ended_at: new Date().toISOString(), current_step: 1 })
      .eq('id', sessionId);
    setMealId(null);
    setSessionId(null);
    setStartedAt(null);
    setInstructions([]);
    setCurrentStep(1);
    fetchActiveCookingSession();
  }, [user, sessionId, fetchActiveCookingSession]);

  // Update currentStep in DB when it changes and session is active
  useEffect(() => {
    if (!sessionId || typeof currentStep !== 'number') {
      return;
    }
    supabase
      .from('cooking_sessions')
      .update({ current_step: currentStep })
      .eq('id', sessionId)
      .then(({ data, error }) => {
        if (error) {
          console.error('[CookingSession] Failed to update current_step:', error);
        }
      });
  }, [currentStep, sessionId]);

  // Memoized computed values
  const isCooking = useMemo(() => !!mealId && instructions.length > 0, [mealId, instructions]);
  const isLoading = useMemo(() => 
    workoutLoading || cardioLoading || sportsLoading || stretchingLoading || cookingLoading, 
    [workoutLoading, cardioLoading, sportsLoading, stretchingLoading, cookingLoading]
  );

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    // Workout session
    activeWorkoutId,
    setActiveWorkoutId,
    workoutData,
    refreshWorkout: fetchInProgressWorkout,
    clearWorkoutSession,
    workoutLoading,

    // Cardio session
    activeCardioId,
    setActiveCardioId,
    cardioData,
    refreshCardio: fetchInProgressCardio,
    clearCardioSession,
    cardioLoading,

    // Sports session
    activeSportsId,
    setActiveSportsId,
    sportsData,
    refreshSports: fetchInProgressSports,
    clearSportsSession,
    sportsLoading,

    // Stretching session
    activeStretchingId,
    setActiveStretchingId,
    stretchingData,
    refreshStretching: fetchInProgressStretching,
    clearStretchingSession,
    stretchingLoading,

    // Cooking session
    isCooking,
    mealId,
    currentStep,
    instructions,
    startCooking,
    nextStep,
    previousStep,
    endCooking,
    cancelCooking,
    cookingLoading,

    // Combined loading state
    loading: isLoading,
  }), [
    // Workout dependencies
    activeWorkoutId, setActiveWorkoutId, workoutData, fetchInProgressWorkout, clearWorkoutSession, workoutLoading,
    // Cardio dependencies
    activeCardioId, setActiveCardioId, cardioData, fetchInProgressCardio, clearCardioSession, cardioLoading,
    // Sports dependencies
    activeSportsId, setActiveSportsId, sportsData, fetchInProgressSports, clearSportsSession, sportsLoading,
    // Stretching dependencies
    activeStretchingId, setActiveStretchingId, stretchingData, fetchInProgressStretching, clearStretchingSession, stretchingLoading,
    // Cooking dependencies
    isCooking, mealId, currentStep, instructions, startCooking, nextStep, previousStep, endCooking, cancelCooking, cookingLoading,
    // Combined loading
    isLoading,
  ]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

// Individual hooks for backward compatibility
export function useWorkoutSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useWorkoutSession must be used within a SessionProvider');
  }
  return {
    activeWorkoutId: ctx.activeWorkoutId,
    setActiveWorkoutId: ctx.setActiveWorkoutId,
    workoutData: ctx.workoutData,
    refreshWorkout: ctx.refreshWorkout,
    clearSession: ctx.clearWorkoutSession,
    loading: ctx.workoutLoading,
  };
}

export function useCardioSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useCardioSession must be used within a SessionProvider');
  }
  return {
    activeCardioId: ctx.activeCardioId,
    setActiveCardioId: ctx.setActiveCardioId,
    cardioData: ctx.cardioData,
    refreshCardio: ctx.refreshCardio,
    clearSession: ctx.clearCardioSession,
    loading: ctx.cardioLoading,
  };
}

export function useSportsSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSportsSession must be used within a SessionProvider');
  }
  return {
    activeSportsId: ctx.activeSportsId,
    setActiveSportsId: ctx.setActiveSportsId,
    sportsData: ctx.sportsData,
    refreshSports: ctx.refreshSports,
    clearSession: ctx.clearSportsSession,
    loading: ctx.sportsLoading,
  };
}

export function useStretchingSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useStretchingSession must be used within a SessionProvider');
  }
  return {
    activeStretchingId: ctx.activeStretchingId,
    setActiveStretchingId: ctx.setActiveStretchingId,
    stretchingData: ctx.stretchingData,
    refreshStretching: ctx.refreshStretching,
    clearSession: ctx.clearStretchingSession,
    loading: ctx.stretchingLoading,
  };
}

export function useCookingSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useCookingSession must be used within a SessionProvider');
  }
  return {
    isCooking: ctx.isCooking,
    mealId: ctx.mealId,
    currentStep: ctx.currentStep,
    instructions: ctx.instructions,
    startCooking: ctx.startCooking,
    nextStep: ctx.nextStep,
    previousStep: ctx.previousStep,
    endCooking: ctx.endCooking,
    cancelCooking: ctx.cancelCooking,
    loading: ctx.cookingLoading,
  };
}

// Combined session hook for components that need multiple sessions
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
