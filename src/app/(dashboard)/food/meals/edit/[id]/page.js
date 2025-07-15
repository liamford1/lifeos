'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import MealForm from '@/components/MealForm';
import { CALENDAR_SOURCES, updateCalendarEvent } from '@/lib/calendarUtils';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function EditMealPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchMeal() {
      try {
        if (!loading && !user) {
          router.push('/auth');
          return;
        }

        if (!user || !id) {
          setError('User not authenticated or meal ID missing');
          setMealLoading(false);
          return;
        }

        // Fetch meal data
        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (mealError) {
          console.error('Error fetching meal:', mealError);
          setError('Failed to load meal');
          setMealLoading(false);
          return;
        }

        if (!mealData) {
          setError('Meal not found');
          setMealLoading(false);
          return;
        }

        // Fetch ingredients
        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('meal_ingredients')
          .select('*')
          .eq('meal_id', id);

        if (ingredientsError) {
          console.error('Error fetching ingredients:', ingredientsError);
        }

        setMeal(mealData);
        setIngredients(ingredientsData || []);
        setMealLoading(false);
      } catch (err) {
        console.error('Error in fetchMeal:', err);
        setError('An unexpected error occurred');
        setMealLoading(false);
      }
    }

    fetchMeal();
  }, [id, loading, user]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (mealLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <BackButton />
        <LoadingSpinner />
      </div>
    );
  }
  if (!user) return null;

  async function handleUpdateMeal(mealData) {
    setSaving(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId || !id) {
        setError('User not authenticated or meal ID missing');
        setSaving(false);
        return;
      }

      console.log("🧪 Final ingredient state being saved:", mealData.ingredients);
      console.log("🧪 Raw ingredients count:", mealData.ingredients.length);
      console.log("🧪 Meal ID from URL params:", id);
      console.log("🧪 User ID:", userId);

      // Verify the meal belongs to the current user
      const { data: mealCheck, error: mealCheckError } = await supabase
        .from('meals')
        .select('id, user_id')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (mealCheckError || !mealCheck) {
        console.error('❌ Meal ownership verification failed:', mealCheckError);
        setError('Meal not found or access denied');
        setSaving(false);
        return;
      }

      console.log('✅ Meal ownership verified:', mealCheck);

      // 1. Update the meal
      const { error: mealError } = await supabase
        .from('meals')
        .update({ 
          name: mealData.name, 
          description: mealData.description,
          prep_time: mealData.prep_time,
          cook_time: mealData.cook_time,
          servings: mealData.servings,
          instructions: mealData.instructions
        })
        .eq('id', id);

      if (mealError) {
        console.error('❌ Error updating meal:', mealError);
        setError('Failed to update meal');
        setSaving(false);
        return;
      }

      // 2. Delete old ingredients
      console.log('🗑️ Deleting old ingredients for meal_id:', id);
      const { error: deleteError } = await supabase
        .from('meal_ingredients')
        .delete()
        .eq('meal_id', id);

      if (deleteError) {
        console.error('❌ Error deleting old ingredients:', deleteError);
        setError('Failed to update ingredients');
        setSaving(false);
        return;
      }
      console.log('✅ Old ingredients deleted successfully');

      // 3. Insert new ingredients
      const cleanedIngredients = mealData.ingredients
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

      console.log("🧪 Cleaned ingredients to insert:", cleanedIngredients);
      console.log("🧪 Cleaned ingredients count:", cleanedIngredients.length);

      if (cleanedIngredients.length > 0) {
        const { data: insertResult, error: insertError } = await supabase
          .from('meal_ingredients')
          .insert(cleanedIngredients)
          .select('id');

        if (insertError) {
          console.error('❌ Error inserting new ingredients:', insertError);
          setError('Failed to save ingredients');
          setSaving(false);
          return;
        }

        console.log('✅ New ingredients inserted successfully');
        console.log('📝 Inserted ingredient IDs:', insertResult?.map(r => r.id) || []);
        console.log('📝 Expected insert count:', cleanedIngredients.length);
        console.log('📝 Actual insert count:', insertResult?.length || 0);

        // Verify insertion was successful
        if (!insertResult || insertResult.length !== cleanedIngredients.length) {
          console.error('❌ WARNING: Insert count mismatch!');
          console.error('❌ Expected:', cleanedIngredients.length, 'Actual:', insertResult?.length || 0);
          setError('Failed to insert all ingredients correctly');
          setSaving(false);
          return;
        }
      } else {
        console.log('ℹ️ No ingredients to insert (all were empty)');
      }

      // Final verification - check total ingredients for this meal
      const { data: finalIngredients, error: finalError } = await supabase
        .from('meal_ingredients')
        .select('*')
        .eq('meal_id', id);

      if (finalError) {
        console.error('❌ Error in final verification:', finalError);
      } else {
        console.log('✅ Final verification: Meal now has', finalIngredients?.length || 0, 'ingredients');
        console.log('✅ Final ingredients:', finalIngredients);
      }

      console.log('✅ Meal and ingredients updated successfully');

      // Update calendar event for the edited meal
      const startTime = new Date();
      const calendarError = await updateCalendarEvent(
        CALENDAR_SOURCES.MEAL,
        id,
        `Meal: ${mealData.name}`,
        startTime.toISOString(),
        null
      );

      if (calendarError) {
        console.error('Calendar event update failed:', calendarError);
      }

      // Redirect to the meal view page
      router.push(`/food/meals/${id}`);
    } catch (err) {
      console.error('Error in handleUpdateMeal:', err);
      setError('An unexpected error occurred');
      setSaving(false);
    }
  }

  function handleCancel() {
    router.push(`/food/meals/${id}`);
  }

  if (mealLoading) {
    return (
      <div className="p-4">
        <BackButton />
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !meal) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <BackButton />
        <div className="text-red-400 text-center py-8">{error}</div>
      </div>
    );
  }

  // Prepare initial values for the form
  const initialValues = {
    name: meal?.name || '',
    description: meal?.description || '',
    prep_time: meal?.prep_time,
    cook_time: meal?.cook_time,
    servings: meal?.servings,
    instructions: meal?.instructions || [],
    ingredients: ingredients.map(ing => ({
      name: ing.food_item_name || '',
      quantity: ing.quantity?.toString() || '',
      unit: ing.unit || '',
    })),
  };

  console.log('📋 Initial values prepared for MealForm:', initialValues);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">Edit Meal</h1>
      <p className="text-gray-400">Update your meal recipe details.</p>

      <MealForm
        initialValues={initialValues}
        onSubmit={handleUpdateMeal}
        onCancel={handleCancel}
        isEditing={true}
        loading={saving}
        error={error}
      />
    </div>
  );
} 