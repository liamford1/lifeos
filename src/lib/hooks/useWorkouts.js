import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';

export function useWorkouts() {
  const { showSuccess, showError } = useToast();

  // Fetch all workouts for a user
  const fetchWorkouts = async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('fitness_workouts')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) {
      showError(error.message || 'Failed to fetch workouts.');
      return null;
    }
    return data;
  };

  // Create a new workout
  const createWorkout = async (workoutData) => {
    const { data, error } = await supabase
      .from('fitness_workouts')
      .insert([workoutData])
      .select()
      .single();
    if (error) {
      showError(error.message || 'Failed to create workout.');
      return null;
    }
    showSuccess('Workout created successfully!');
    return data;
  };

  // Update an existing workout
  const updateWorkout = async (id, updatedData) => {
    const { data, error } = await supabase
      .from('fitness_workouts')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      showError(error.message || 'Failed to update workout.');
      return null;
    }
    showSuccess('Workout updated successfully!');
    return data;
  };

  // Delete a workout
  const deleteWorkout = async (id) => {
    const { error } = await supabase
      .from('fitness_workouts')
      .delete()
      .eq('id', id);
    if (error) {
      showError(error.message || 'Failed to delete workout.');
      return null;
    }
    showSuccess('Workout deleted successfully!');
    return true;
  };

  return { fetchWorkouts, createWorkout, updateWorkout, deleteWorkout };
} 