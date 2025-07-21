'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const LOCAL_STORAGE_KEY = 'cookingSession';

const CookingSessionContext = createContext();

export function CookingSessionProvider({ children }) {
  const [mealId, setMealId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [instructions, setInstructions] = useState([]);
  const [startedAt, setStartedAt] = useState(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(LOCAL_STORAGE_KEY) : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setMealId(parsed.mealId || null);
        setCurrentStep(typeof parsed.currentStep === 'number' ? parsed.currentStep : 0);
        setInstructions(Array.isArray(parsed.instructions) ? parsed.instructions : []);
        setStartedAt(parsed.startedAt || null);
      } catch (e) {
        // If corrupted, clear
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  // Persist to localStorage on state change
  useEffect(() => {
    if (mealId && instructions.length > 0 && startedAt) {
      const session = {
        mealId,
        currentStep,
        instructions,
        startedAt,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [mealId, currentStep, instructions, startedAt]);

  const startCooking = useCallback((newMealId, newInstructions) => {
    setMealId(newMealId);
    setInstructions(Array.isArray(newInstructions) ? newInstructions : []);
    setCurrentStep(0);
    setStartedAt(new Date().toISOString());
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (instructions && prev < instructions.length - 1) {
        return prev + 1;
      }
      return prev;
    });
  }, [instructions]);

  const previousStep = useCallback(() => {
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const endCooking = useCallback(async () => {
    // Update CookedMeals in Supabase before clearing session
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (userId && mealId) {
        // Check if record exists
        const { data: existing, error: fetchError } = await supabase
          .from('cooked_meals')
          .select('cook_count')
          .eq('user_id', userId)
          .eq('meal_id', mealId)
          .single();
        if (!fetchError && existing) {
          await supabase
            .from('cooked_meals')
            .update({
              cook_count: (existing.cook_count || 0) + 1,
              last_cooked_at: new Date().toISOString(),
            })
            .eq('user_id', userId)
            .eq('meal_id', mealId);
        }
      }
    } catch (err) {
      // Log error silently
      if (process.env.NODE_ENV !== "production") {
        console.error('Error updating cooked_meals in endCooking:', err);
      }
    }
    setMealId(null);
    setCurrentStep(0);
    setInstructions([]);
    setStartedAt(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, [mealId]);

  const cancelCooking = useCallback(() => {
    setMealId(null);
    setCurrentStep(0);
    setInstructions([]);
    setStartedAt(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  }, []);

  const value = {
    mealId,
    currentStep,
    instructions,
    startedAt,
    startCooking,
    nextStep,
    previousStep,
    endCooking,
    cancelCooking,
    isCooking: !!mealId && instructions.length > 0,
  };

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