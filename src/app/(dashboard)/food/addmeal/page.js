'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import MealForm from '@/components/MealForm';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';

export default function AddMealPage(props) {
  const { user, loading } = useUser();
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  async function handleSaveMeal(mealData) {
    setIsSaving(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId) {
        setError('User not logged in.');
        setIsSaving(false);
        return;
      }

      console.log("🧪 Final ingredient state being saved:", mealData.ingredients);
      console.log("🧪 Raw ingredients count:", mealData.ingredients.length);

      // Call the new API route to create the meal
      const response = await fetch('/api/meal/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: mealData.name,
          description: mealData.description,
          prep_time: mealData.prep_time,
          cook_time: mealData.cook_time,
          servings: mealData.servings,
          instructions: mealData.instructions,
          notes: mealData.notes,
          calories: mealData.calories,
          date: mealData.date,
        }),
      });

      const result = await response.json();
      if (!response.ok && result.error) {
        console.error(result.error);
        setError('Failed to save meal.');
        setIsSaving(false);
        return;
      }

      // Use mealId from the new API response
      const mealId = result.mealId;
      if (!mealId) {
        // Log or silently return if needed
        console.warn('No mealId returned from API. Skipping ingredient/calendar insert.');
        setIsSaving(false);
        return;
      }

      // Insert the current state of ingredients
      const cleanedIngredients = mealData.ingredients
        .filter(i =>
          i.name?.trim() !== '' &&
          i.quantity !== '' &&
          i.unit?.trim() !== ''
        )
        .map(i => ({
          meal_id: mealId,
          food_item_name: i.name.trim(),
          quantity: Number(i.quantity),
          unit: i.unit.trim()
        }));

      console.log("🧪 Cleaned ingredients to insert:", cleanedIngredients);
      console.log("🧪 Cleaned ingredients count:", cleanedIngredients.length);

      if (cleanedIngredients.length > 0) {
        const { error: insertError } = await supabase
          .from('meal_ingredients')
          .insert(cleanedIngredients);

        if (insertError) {
          console.error('Error inserting ingredients:', insertError);
          console.error('Attempted to insert:', cleanedIngredients);
          setError('Meal saved, but failed to save ingredients.');
          setIsSaving(false);
          return;
        }
      } else {
        console.log("🧪 No ingredients to insert (all were empty)");
      }

      // Create calendar event for the meal
      const startTime = new Date();
      const { error: calendarError } = await supabase.from('calendar_events').insert({
        user_id: userId,
        title: `Meal: ${mealData.name}`,
        source: CALENDAR_SOURCES.MEAL,
        source_id: mealId,
        start_time: startTime.toISOString(),
        end_time: null,
      });

      if (calendarError) {
        console.error('Calendar event creation failed:', calendarError);
      }

      alert('Meal and ingredients saved!');
      router.push('/food/meals');
    } catch (err) {
      console.error('Error saving meal:', err);
      setError('An unexpected error occurred.');
      setIsSaving(false);
    }
  }

  return (
    <div className="h-full">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6 text-white">➕ Add a New Meal</h1>

      <MealForm
        onSubmit={handleSaveMeal}
        loading={isSaving}
        error={error}
      />
    </div>
  );
}
