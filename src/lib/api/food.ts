import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();

export async function insertPantryItem(item: {
  user_id: string;
  name: string;
  quantity: number;
  unit: string;
}) {
  const { error } = await supabase.from("food_items").insert(item);
  if (error) throw error;
} 