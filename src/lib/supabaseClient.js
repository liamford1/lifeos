import { createClient } from '@supabase/supabase-js/dist/module';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ✅ Expose in browser context for Playwright
if (typeof window !== 'undefined' && !window.supabase) {
  window.supabase = supabase;
}
