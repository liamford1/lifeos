'use client'

import React from 'react'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseProvider({ children }) {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.supabase = supabase;
  }

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  )
}
