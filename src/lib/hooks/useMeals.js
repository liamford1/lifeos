import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Custom hook for meal CRUD operations
export function useMeals() {
  const { handleError, handleSuccess } = useApiError();
  const queryClient = useQueryClient();

  // Fetch all meals for a user with React Query
  const fetchMeals = async (userId, options = {}) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to fetch meals.',
        ...options 
      });
      return null;
    }
    return data;
  };

  // Create a new meal
  const createMeal = async (mealData, options = {}) => {
    const { data, error } = await supabase
      .from('meals')
      .insert([mealData])
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to create meal.',
        ...options 
      });
      return null;
    }
    handleSuccess('Meal created successfully!', options);
    return data;
  };

  // Update an existing meal
  const updateMeal = async (id, updatedData, options = {}) => {
    const { data, error } = await supabase
      .from('meals')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to update meal.',
        ...options 
      });
      return null;
    }
    handleSuccess('Meal updated successfully!', options);
    return data;
  };

  // Delete a meal
  const deleteMeal = async (id, options = {}) => {
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id);
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to delete meal.',
        ...options 
      });
      return null;
    }
    handleSuccess('Meal deleted successfully!', options);
    return true;
  };

  return { fetchMeals, createMeal, updateMeal, deleteMeal };
}

// React Query hook for meals
export function useMealsQuery(userId) {
  const { handleError } = useApiError();
  
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
  const { handleError, handleSuccess } = useApiError();

  return useMutation({
    mutationFn: async ({ mealData, options = {} }) => {
      // Extract ingredients from mealData
      const { ingredients, ...mealDataWithoutIngredients } = mealData;
      
      // Insert the meal first
      const { data: meal, error: mealError } = await supabase
        .from('meals')
        .insert([mealDataWithoutIngredients])
        .select()
        .single();
      
      if (mealError) {
        throw mealError;
      }

      // Insert ingredients if provided
      if (ingredients && ingredients.length > 0) {
        const ingredientsData = ingredients.map(ingredient => ({
          meal_id: meal.id,
          food_item_name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit || null,
          name: ingredient.name
        }));

        const { error: ingredientsError } = await supabase
          .from('meal_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) {
          // If ingredients fail, we should still return the meal but log the error
          console.error('Failed to insert ingredients:', ingredientsError);
          // Don't throw here - the meal was created successfully
        }
      }

      return { data: meal, options };
    },
    onSuccess: ({ data, options }) => {
      queryClient.invalidateQueries(['meals']);
      handleSuccess('Meal created successfully!', options);
    },
    onError: (error, { options }) => {
      handleError(error, { 
        customMessage: 'Failed to create meal.',
        ...options 
      });
    },
  });
}

// React Query mutation for updating meals
export function useUpdateMealMutation() {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiError();

  return useMutation({
    mutationFn: async ({ id, updatedData, ingredients, options = {} }) => {
      // Update the meal first
      const { data, error } = await supabase
        .from('meals')
        .update(updatedData)
        .eq('id', id)
        .select()
        .single();
      if (error) {
        throw error;
      }

      // Update ingredients if provided
      if (ingredients && ingredients.length >= 0) {
        // First, delete existing ingredients
        const { error: deleteError } = await supabase
          .from('meal_ingredients')
          .delete()
          .eq('meal_id', id);

        if (deleteError) {
          console.error('Failed to delete existing ingredients:', deleteError);
          // Don't throw here - the meal was updated successfully
        }

        // Then insert new ingredients if any
        if (ingredients.length > 0) {
          const ingredientsData = ingredients.map(ingredient => ({
            meal_id: id,
            food_item_name: ingredient.name,
            quantity: ingredient.quantity,
            unit: ingredient.unit || null,
            name: ingredient.name
          }));

          const { error: ingredientsError } = await supabase
            .from('meal_ingredients')
            .insert(ingredientsData);

          if (ingredientsError) {
            console.error('Failed to insert ingredients:', ingredientsError);
            // Don't throw here - the meal was updated successfully
          }
        }
      }

      return { data, options };
    },
    onSuccess: ({ data, options }) => {
      queryClient.invalidateQueries(['meals']);
      queryClient.invalidateQueries(['meal', data.id]);
      queryClient.invalidateQueries(['meal-ingredients', data.id]);
      handleSuccess('Meal updated successfully!', options);
    },
    onError: (error, { options }) => {
      handleError(error, { 
        customMessage: 'Failed to update meal.',
        ...options 
      });
    },
  });
}

// React Query mutation for deleting meals
export function useDeleteMealMutation() {
  const queryClient = useQueryClient();
  const { handleError, handleSuccess } = useApiError();

  return useMutation({
    mutationFn: async ({ id, options = {} }) => {
      const { error } = await supabase
        .from('meals')
        .delete()
        .eq('id', id);
      if (error) {
        throw error;
      }
      return { options };
    },
    onSuccess: ({ options }) => {
      queryClient.invalidateQueries(['meals']);
      handleSuccess('Meal deleted successfully!', options);
    },
    onError: (error, { options }) => {
      handleError(error, { 
        customMessage: 'Failed to delete meal.',
        ...options 
      });
    },
  });
}

// React Query hook for a single meal
export function useMealQuery(mealId, userId) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['meal', mealId],
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

// React Query hook for meal ingredients
export function useMealIngredientsQuery(mealId) {
  const { handleError } = useApiError();
  
  return useQuery({
    queryKey: ['meal-ingredients', mealId],
    queryFn: async () => {
      if (!mealId) return [];
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select('*')
        .eq('meal_id', mealId)
        .order('created_at', { ascending: true });
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