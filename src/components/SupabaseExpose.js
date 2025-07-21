'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function SupabaseExpose() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !window.supabase) {
      window.supabase = supabase;
    }
  }, []);

  return null;
} 