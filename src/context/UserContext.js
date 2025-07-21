"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

const UserContext = createContext({
  session: null,
  user: null,
  loading: true,
});

export function UserProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const getSessionAndUser = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const { data: { user } } = await supabase.auth.getUser();
      if (mounted) {
        setSession(session);
        setUser(user);
        setLoading(false);
      }
    };
    getSessionAndUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user || null);
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // stable refresh fn
  const fetchCurrentUser = useCallback(async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data: { user } } = await supabase.auth.getUser();
    setSession(session);
    setUser(user);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // memoised value
  const value = useMemo(
    () => ({ session, user, loading, refresh }),
    [session, user, loading, refresh]
  );

  // React Profiler root marker
  return (
    <UserContext.Provider value={value}>
      {/* react-profiler-start:UserContext */}
      {children}
      {/* react-profiler-end */}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 