import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';

// Custom hook for meal CRUD operations
export function useMeals() {
  const { showSuccess, showError } = useToast();

  // Fetch all meals for a user
  const fetchMeals = async (userId) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      showError(error.message || 'Failed to fetch meals.');
      return null;
    }
    return data;
  };

  // Create a new meal
  const createMeal = async (mealData) => {
    const { data, error } = await supabase
      .from('meals')
      .insert([mealData])
      .select()
      .single();
    if (error) {
      showError(error.message || 'Failed to create meal.');
      return null;
    }
    showSuccess('Meal created successfully!');
    return data;
  };

  // Update an existing meal
  const updateMeal = async (id, updatedData) => {
    const { data, error } = await supabase
      .from('meals')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      showError(error.message || 'Failed to update meal.');
      return null;
    }
    showSuccess('Meal updated successfully!');
    return data;
  };

  // Delete a meal
  const deleteMeal = async (id) => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);
    if (error) {
      showError(error.message || 'Failed to delete meal.');
      return null;
    }
    showSuccess('Meal deleted successfully!');
    return true;
  };

  return { fetchMeals, createMeal, updateMeal, deleteMeal };
} 