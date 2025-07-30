import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';

export function useWorkouts() {
  const { handleError, handleSuccess } = useApiError();

  // Fetch all workouts for a user
  const fetchWorkouts = async (userId, options = {}) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('fitness_workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to fetch workouts.',
        ...options 
      });
      return null;
    }
    return data;
  };

  // Create a new workout
  const createWorkout = async (workoutData, options = {}) => {
    const { data, error } = await supabase
      .from('fitness_workouts')
      .insert([workoutData])
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to create workout.',
        ...options 
      });
      return null;
    }
    handleSuccess('Workout created successfully!', options);
    return data;
  };

  // Update an existing workout
  const updateWorkout = async (id, updatedData, options = {}) => {
    const { data, error } = await supabase
      .from('fitness_workouts')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to update workout.',
        ...options 
      });
      return null;
    }
    handleSuccess('Workout updated successfully!', options);
    return data;
  };

  // Delete a workout
  const deleteWorkout = async (id, options = {}) => {
    const { error } = await supabase
      .from('fitness_workouts')
      .delete()
      .eq('id', id);
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to delete workout.',
        ...options 
      });
      return null;
    }
    handleSuccess('Workout deleted successfully!', options);
    return true;
  };

  return { fetchWorkouts, createWorkout, updateWorkout, deleteWorkout };
} 