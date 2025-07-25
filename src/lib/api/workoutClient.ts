import { supabase } from '@/lib/supabaseClient';

/**
 * Type for a set to be inserted into fitness_sets
 */
export type FitnessSetInsert = {
  reps: number;
  weight: number;
  notes?: string;
  exercise_id: string;
};

/**
 * Inserts an array of sets into the fitness_sets table using the client Supabase instance.
 * @param {Array<{reps: number, weight: number, notes?: string, exercise_id: string}>} formattedSets
 */
export async function insertSetsClient(formattedSets: FitnessSetInsert[]) {
  const { error } = await supabase.from('fitness_sets').insert(formattedSets);
  if (error) throw error;
} 