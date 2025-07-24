'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const CookingSessionContext = createContext();

export function CookingSessionProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [mealId, setMealId] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [instructions, setInstructions] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [startedAt, setStartedAt] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch active session from Supabase
  const fetchActiveSession = useCallback(async () => {
    if (!user) {
      setMealId(null);
      setCurrentStep(0);
      setInstructions([]);
      setSessionId(null);
      setStartedAt(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('cooking_sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('in_progress', true)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data) {
      setMealId(data.meal_id);
      setSessionId(data.id);
      setStartedAt(data.started_at);
      setCurrentStep(typeof data.current_step === 'number' ? data.current_step : 1);
      // Optionally fetch instructions from the meal
      const mealRes = await supabase
        .from('meals')
        .select('instructions')
        .eq('id', data.meal_id)
        .single();
      if (mealRes.data && mealRes.data.instructions) {
        setInstructions(Array.isArray(mealRes.data.instructions)
          ? mealRes.data.instructions
          : (typeof mealRes.data.instructions === 'string' && mealRes.data.instructions.trim()
            ? mealRes.data.instructions.split('\n').map(s => s.trim()).filter(Boolean)
            : []));
      } else {
        setInstructions([]);
      }
    } else {
      setMealId(null);
      setSessionId(null);
      setStartedAt(null);
      setInstructions([]);
      setCurrentStep(1);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!userLoading) {
      fetchActiveSession();
    }
  }, [user, userLoading, fetchActiveSession]);

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

  // Update currentStep in DB when it changes and session is active
  useEffect(() => {
    if (!sessionId || typeof currentStep !== 'number') {
      console.log('[CookingSession] Skipping DB update:', { sessionId, currentStep });
      return;
    }
    console.log('[CookingSession] Updating current_step in DB:', { sessionId, currentStep });
    supabase
      .from('cooking_sessions')
      .update({ current_step: currentStep })
      .eq('id', sessionId)
      .then(({ data, error }) => {
        if (error) {
          console.error('[CookingSession] Failed to update current_step:', error);
        } else {
          console.log('[CookingSession] Successfully updated current_step to:', currentStep);
        }
      });
  }, [currentStep, sessionId]);

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
    if (!user || !sessionId || !mealId) return;
    // End the cooking session in the DB
    await supabase
      .from('cooking_sessions')
      .update({ in_progress: false, ended_at: new Date().toISOString(), current_step: 1 })
      .eq('id', sessionId);
    // Upsert into cooked_meals
    const { data: existing, error: fetchError } = await supabase
      .from('cooked_meals')
      .select('cook_count')
      .eq('user_id', user.id)
      .eq('meal_id', mealId)
      .single();
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
    fetchActiveSession();
  }, [user, sessionId, mealId, fetchActiveSession]);

  const cancelCooking = useCallback(async () => {
    if (!user || !sessionId) return;
    await supabase
      .from('cooking_sessions')
      .update({ in_progress: false, ended_at: new Date().toISOString(), current_step: 1 })
      .eq('id', sessionId);
    setMealId(null);
    setSessionId(null);
    setStartedAt(null);
    setInstructions([]);
    setCurrentStep(1);
    fetchActiveSession();
  }, [user, sessionId, fetchActiveSession]);

  const isCooking = !!mealId && instructions.length > 0;

  const value = useMemo(
    () => ({
      isCooking,
      mealId,
      currentStep,
      instructions,
      startCooking,
      nextStep,
      previousStep,
      endCooking,
      cancelCooking,
      loading,
    }),
    [isCooking, mealId, currentStep, instructions, startCooking, nextStep, previousStep, endCooking, cancelCooking, loading]
  );

  return (
    <CookingSessionContext.Provider value={value}>
      {children}
    </CookingSessionContext.Provider>
  );
}

export function useCookingSession() {
  const ctx = useContext(CookingSessionContext);
  if (!ctx) {
    throw new Error('useCookingSession must be used within a CookingSessionProvider');
  }
  return ctx;
} 