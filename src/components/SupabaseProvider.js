'use client'

import React from 'react'
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseProvider({ children }) {
  const [supabaseClient] = useState(() => createPagesBrowserClient())

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    window.supabase = supabase;
  }

  return (
    <SessionContextProvider supabaseClient={supabaseClient}>
      {children}
    </SessionContextProvider>
  )
}
