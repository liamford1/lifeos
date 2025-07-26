"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const CardioSessionContext = createContext({
  activeCardioId: null,
  setActiveCardioId: () => {},
  cardioData: null,
  refreshCardio: () => {},
  loading: true,
});

export function CardioSessionProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [activeCardioId, setActiveCardioIdRaw] = useState(null);
  const [cardioData, setCardioData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInProgressCardio = useCallback(async () => {
    if (!user) {
      setCardioData(null);
      setActiveCardioIdRaw(null);
      setLoading(false);
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  }, [user]);

  const setActiveCardioId = useCallback((id) => {
    setActiveCardioIdRaw(id);
  }, []);

  const clearSession = useCallback(() => {
    setActiveCardioIdRaw(null);
    setCardioData(null);
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchInProgressCardio();
    }
  }, [user, userLoading, fetchInProgressCardio]);

  const value = useMemo(
    () => ({
      activeCardioId,
      setActiveCardioId,
      cardioData,
      refreshCardio: fetchInProgressCardio,
      clearSession,
      loading,
    }),
    [activeCardioId, setActiveCardioId, cardioData, fetchInProgressCardio, clearSession, loading]
  );

  // React Profiler root marker
  return (
    <CardioSessionContext.Provider value={value}>
      {/* react-profiler-start:CardioSessionContext */}
      {children}
      {/* react-profiler-end */}
    </CardioSessionContext.Provider>
  );
}

export function useCardioSession() {
  return useContext(CardioSessionContext);
} 