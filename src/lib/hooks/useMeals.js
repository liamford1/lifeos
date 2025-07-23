import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Custom hook for meal CRUD operations
export function useMeals() {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // Fetch all meals for a user with React Query
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

// React Query hook for meals
export function useMealsQuery(userId) {
  return useQuery({
    queryKey: ['meals', userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) {
        throw new Error(error.message || 'Failed to fetch meals.');
      }
      return data || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });
}

// React Query mutation for creating meals
export function useCreateMealMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: async (mealData) => {
      // Extract ingredients from mealData
      const { ingredients, ...mealDataWithoutIngredients } = mealData;
      
      // Create the meal first
      const { data: createdMeal, error: mealError } = await supabase
        .from('meals')
        .insert([mealDataWithoutIngredients])
        .select()
        .single();
      
      if (mealError) {
        throw new Error(mealError.message || 'Failed to create meal.');
      }

      // If ingredients are provided, insert them as well
      if (ingredients && Array.isArray(ingredients)) {
        const cleanedIngredients = ingredients
          .filter(i =>
            typeof i.name === 'string' && i.name.trim() !== '' &&
            i.quantity !== '' &&
            typeof i.unit === 'string' && i.unit.trim() !== ''
          )
          .map(i => ({
            meal_id: createdMeal.id,
            food_item_name: (i.name || '').trim(),
            quantity: Number(i.quantity),
            unit: (i.unit || '').trim()
          }));

        if (cleanedIngredients.length > 0) {
          const { error: ingredientsError } = await supabase
            .from('meal_ingredients')
            .insert(cleanedIngredients);

          if (ingredientsError) {
            throw new Error(ingredientsError.message || 'Failed to create ingredients.');
          }
        }
      }

      return createdMeal;
    },
    onSuccess: (data, variables) => {
      showSuccess('Meal created successfully!');
      // Invalidate and refetch meals for the user
      queryClient.invalidateQueries({
        queryKey: ['meals', variables.user_id],
      });
    },
    onError: (error) => {
      showError(error.message || 'Failed to create meal.');
    },
  });
}

// React Query mutation for updating meals
export function useUpdateMealMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: async ({ id, updatedData, ingredients }) => {
      // Start a transaction to update both meal and ingredients
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      
      if (mealError) {
        throw new Error(mealError.message || 'Failed to update meal.');
      }

      // If ingredients are provided, update them as well
      if (ingredients && Array.isArray(ingredients)) {
        // Delete old ingredients
        const { error: deleteError } = await supabase
          .from('meal_ingredients')
          .delete()
          .eq('meal_id', id);

        if (deleteError) {
          throw new Error(deleteError.message || 'Failed to delete old ingredients.');
        }

        // Insert new ingredients
        const cleanedIngredients = ingredients
          .filter(i =>
            i.name?.trim() !== '' &&
            i.quantity !== '' &&
            i.unit?.trim() !== ''
          )
          .map(i => ({
            meal_id: id,
            food_item_name: i.name.trim(),
            quantity: Number(i.quantity),
            unit: i.unit.trim()
          }));

        if (cleanedIngredients.length > 0) {
          const { error: insertError } = await supabase
            .from('meal_ingredients')
            .insert(cleanedIngredients);

          if (insertError) {
            throw new Error(insertError.message || 'Failed to insert new ingredients.');
          }
        }
      }

      return mealData;
    },
    onSuccess: (data, variables) => {
      showSuccess('Meal updated successfully!');
      // Invalidate and refetch meals and meal ingredients for the user
      queryClient.invalidateQueries({
        queryKey: ['meals', data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['meal', variables.id, data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ['meal-ingredients', variables.id],
      });
    },
    onError: (error) => {
      showError(error.message || 'Failed to update meal.');
    },
  });
}

// React Query mutation for deleting meals
export function useDeleteMealMutation() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);
      if (error) {
        throw new Error(error.message || 'Failed to delete meal.');
      }
      return id;
    },
    onSuccess: (deletedId) => {
      showSuccess('Meal deleted successfully!');
      // Optimistically update the cache by removing the deleted meal
      queryClient.setQueriesData(
        { queryKey: ['meals'] },
        (oldData) => {
          if (Array.isArray(oldData)) {
            return oldData.filter(meal => meal.id !== deletedId);
          }
          return oldData;
        }
      );
    },
    onError: (error) => {
      showError(error.message || 'Failed to delete meal.');
    },
  });
}

// React Query hook for fetching a single meal
export function useMealQuery(mealId, userId) {
  return useQuery({
    queryKey: ['meal', mealId, userId],
    queryFn: async () => {
      if (!mealId || !userId) return null;
      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('id', mealId)
        .eq('user_id', userId)
        .single();
      if (error) {
        throw new Error(error.message || 'Failed to fetch meal.');
      }
      return data;
    },
    enabled: !!mealId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// React Query hook for fetching meal ingredients
export function useMealIngredientsQuery(mealId) {
  return useQuery({
    queryKey: ['meal-ingredients', mealId],
    queryFn: async () => {
      if (!mealId) return [];
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select('*')
        .eq('meal_id', mealId);
      if (error) {
        throw new Error(error.message || 'Failed to fetch meal ingredients.');
      }
      return data || [];
    },
    enabled: !!mealId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 