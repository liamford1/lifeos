import { createClient } from '@supabase/supabase-js/dist/module';
import type { Database } from '@/types/supabase';

export const supabase = createClient<Database>(
  process.env['NEXT_PUBLIC_SUPABASE_URL']!,
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!
);

// ✅ Expose in browser context for testing
if (typeof window !== 'undefined' && !(window as any).supabase) {
  (window as any).supabase = supabase;
}
