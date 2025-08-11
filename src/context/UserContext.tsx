"use client";

import { createContext, useContext, useEffect, useState, useMemo, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refresh: () => void;
  isAuthenticated: boolean;
  userId: string | undefined;
}

const UserContext = createContext<UserContextType>({
  session: null,
  user: null,
  loading: true,
  refresh: () => {},
  isAuthenticated: false,
  userId: undefined,
});

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  // Memoized auth state change handler to prevent unnecessary re-renders
  const handleAuthStateChange = useCallback((_event: string, newSession: Session | null) => {
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

export function useUser(): UserContextType {
  return useContext(UserContext);
}
