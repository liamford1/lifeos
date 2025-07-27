"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';

const SportsSessionContext = createContext({
  activeSportsId: null,
  setActiveSportsId: () => {},
  sportsData: null,
  refreshSports: () => {},
  loading: true,
});

export function SportsSessionProvider({ children }) {
  const { user, loading: userLoading } = useUser();
  const [activeSportsId, setActiveSportsIdRaw] = useState(null);
  const [sportsData, setSportsData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInProgressSports = useCallback(async () => {
    if (!user) {
      setSportsData(null);
      setActiveSportsIdRaw(null);
      setLoading(false);
      return;
    }
    setLoading(true);
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
      setLoading(false);
    }
  }, [user]);

  const setActiveSportsId = useCallback((id) => {
    setActiveSportsIdRaw(id);
  }, []);

  const clearSession = useCallback(() => {
    setActiveSportsIdRaw(null);
    setSportsData(null);
  }, []);

  useEffect(() => {
    if (!userLoading) {
      fetchInProgressSports();
    }
  }, [user, userLoading, fetchInProgressSports]);

  const value = useMemo(
    () => ({
      activeSportsId,
      setActiveSportsId,
      sportsData,
      refreshSports: fetchInProgressSports,
      clearSession,
      loading,
    }),
    [activeSportsId, setActiveSportsId, sportsData, fetchInProgressSports, clearSession, loading]
  );

  // React Profiler root marker
  return (
    <SportsSessionContext.Provider value={value}>
      {/* react-profiler-start:SportsSessionContext */}
      {children}
      {/* react-profiler-end */}
    </SportsSessionContext.Provider>
  );
}

export function useSportsSession() {
  return useContext(SportsSessionContext);
} 