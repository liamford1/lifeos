import { createSupabaseServerClient } from "@/lib/supabaseServer";
const supabase = createSupabaseServerClient();

export async function listEvents(userId: string) {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data;
}

export async function insertEvent(event: any) {
  const { error } = await supabase.from("calendar_events").insert([event]);
  if (error) throw error;
}

export async function deleteEvent(id: string) {
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", id);
  if (error) throw error;
} 