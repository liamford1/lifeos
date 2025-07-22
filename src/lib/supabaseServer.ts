import { createClient } from "@supabase/supabase-js";
// import type { Database } from "@/types/supabase";

// Read env vars (available at build & runtime on the server)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Returns a singleton Supabase client configured **only for server usage**.
 * Uses the Service Role key so helpers can insert / delete without RLS headaches.
 * Never import this in the browser!
 */
let supabaseServer: ReturnType<typeof createClient> | undefined;

export function createSupabaseServerClient() {
  if (!supabaseServer) {
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    supabaseServer = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return supabaseServer;
} 