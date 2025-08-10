"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const StretchingSessionContext = createContext({
  activeStretchingId: null,
  setActiveStretchingId: () => {},
  stretchingData: null,
  refreshStretching: () => {},
  loading: true,
});

export function StretchingSessionProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [activeStretchingId, setActiveStretchingIdRaw] = useState(null);
  const [stretchingData, setStretchingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInProgressStretching = useCallback(async () => {
    if (!user) {
      setStretchingData(null);
      setActiveStretchingIdRaw(null);
      setLoading(false);
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  }, [user]);

  const setActiveStretchingId = useCallback((id) => {
    setActiveStretchingIdRaw(id);
  }, []);

  const clearSession = useCallback(() => {
    setActiveStretchingIdRaw(null);
    setStretchingData(null);
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchInProgressStretching();
    }
  }, [user, userLoading, fetchInProgressStretching]);

  const value = useMemo(
    () => ({
      activeStretchingId,
      setActiveStretchingId,
      stretchingData,
      refreshStretching: fetchInProgressStretching,
      clearSession,
      loading,
    }),
    [activeStretchingId, setActiveStretchingId, stretchingData, fetchInProgressStretching, clearSession, loading]
  );

  // React Profiler root marker
  return (
    <StretchingSessionContext.Provider value={value}>
      {/* react-profiler-start:StretchingSessionContext */}
      {children}
      {/* react-profiler-end */}
    </StretchingSessionContext.Provider>
  );
}

export function useStretchingSession() {
  return useContext(StretchingSessionContext);
}
