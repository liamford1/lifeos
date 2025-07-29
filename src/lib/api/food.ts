import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { supabase as clientSupabase } from "@/lib/supabaseClient";

export async function insertPantryItem(item: {
  user_id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category?: string | null;
  expires_at?: string | null;
  added_from?: string;
  added_at?: string;
}) {
  
  try {
    // Try server-side first
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("food_items").insert(item);
    if (error) {
      console.error('Server-side Supabase error:', error);
      throw error;
    }
  } catch (serverError) {
    // Fallback to client-side
    const { error } = await clientSupabase.from("food_items").insert(item);
    if (error) {
      console.error('Client-side Supabase error:', error);
      throw error;
    }
  }
} 