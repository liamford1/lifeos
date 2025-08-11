"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  const mountedRef = useRef(true);

  // Memoized auth state change handler to prevent unnecessary re-renders
  const handleAuthStateChange = useCallback((_event, newSession) => {
    if (!mountedRef.current) return;
    
    // Only update state if the values actually changed
    setSession(prevSession => {
      if (prevSession?.access_token === newSession?.access_token) {
        return prevSession;
      }
      return newSession;
    });
    
    setUser(prevUser => {
      const newUser = newSession?.user || null;
      if (prevUser?.id === newUser?.id) {
        return prevUser;
      }
      return newUser;
    });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    const getSessionAndUser = async () => {
      if (!mountedRef.current) return;
      
      setLoading(true);
      try {
        const [sessionResult, userResult] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser()
        ]);
        
        if (!mountedRef.current) return;
        
        const { data: { session: newSession } } = sessionResult;
        const { data: { user: newUser } } = userResult;
        
        setSession(newSession);
        setUser(newUser);
      } catch (error) {
        console.error('Error fetching auth state:', error);
      } finally {
        if (mountedRef.current) {
          setLoading(false);
        }
      }
    };
    
    getSessionAndUser();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(handleAuthStateChange);

    return () => {
      mountedRef.current = false;
      listener?.subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  // Memoized refresh function to prevent unnecessary re-renders
  const fetchCurrentUser = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    try {
      const [sessionResult, userResult] = await Promise.all([
        supabase.auth.getSession(),
        supabase.auth.getUser()
      ]);
      
      if (!mountedRef.current) return;
      
      const { data: { session: newSession } } = sessionResult;
      const { data: { user: newUser } } = userResult;
      
      setSession(newSession);
      setUser(newUser);
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  // Memoized context value to prevent unnecessary re-renders
  const value = useMemo(
    () => ({ 
      session, 
      user, 
      loading, 
      refresh,
      // Add computed values to avoid recalculating in consumers
      isAuthenticated: !!user,
      userId: user?.id,
    }),
    [session, user, loading, refresh]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
} 