import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabase as clientSupabase } from "@/lib/supabaseClient";
import type { PantryItemInsert } from "@/types/supabase";

export async function insertPantryItem(item: PantryItemInsert): Promise<void> {
  try {
    // Try server-side first
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("pantry_items").insert(item);
    if (error) {
      console.error('Server-side Supabase error:', error);
      throw error;
    }
  } catch (_serverError) {
    // Fallback to client-side
    const { error } = await clientSupabase.from("pantry_items").insert(item);
    if (error) {
      console.error('Client-side Supabase error:', error);
      throw error;
    }
  }
} 