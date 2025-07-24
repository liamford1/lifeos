import { supabase } from '@/lib/supabaseClient';

/**
 * Inserts an array of sets into the fitness_sets table using the client Supabase instance.
 * @param {Array<{reps: number, weight: number, notes?: string, exercise_id: string}>} formattedSets
 */
export async function insertSetsClient(formattedSets) {
  const { error } = await supabase.from('fitness_sets').insert(formattedSets);
  if (error) throw error;
} 