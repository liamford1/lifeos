import { createSupabaseServerClient } from "@/lib/supabaseServer";

const supabase = createSupabaseServerClient();

// Type for inserting a set
export type SetInput = {
  reps: number;
  weight: number;
  notes?: string;
  exercise_id: string;
};

export async function deleteSetsAndExercises(setIds: string[], exerciseIds: string[]) {
  // delete sets, then exercises
  const { error: setErr } = await supabase.from("fitness_sets").delete().in("exercise_id", setIds);
  if (setErr) throw setErr;
  const { error: exErr } = await supabase.from("fitness_exercises").delete().in("id", exerciseIds);
  if (exErr) throw exErr;
}

export async function insertSets(formattedSets: SetInput[]) {
  const { error } = await supabase.from("fitness_sets").insert(formattedSets);
  if (error) throw error;
} 