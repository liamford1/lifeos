'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import MealForm from '@/components/MealForm';

export default function AddMealPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSaveMeal(mealData) {
    setLoading(true);
    setError('');

    try {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId) {
        setError('User not logged in.');
        setLoading(false);
        return;
      }

      console.log("🧪 Final ingredient state being saved:", mealData.ingredients);
      console.log("🧪 Raw ingredients count:", mealData.ingredients.length);

      const { data: savedMeal, error: mealError } = await supabase
        .from('meals')
        .insert([
          {
            user_id: userId,
            name: mealData.name,
            description: mealData.description,
            prep_time: mealData.prep_time,
            cook_time: mealData.cook_time,
            servings: mealData.servings,
            instructions: mealData.instructions,
          },
        ])
        .select()
        .single();

      if (mealError || !savedMeal) {
        console.error(mealError);
        setError('Failed to save meal.');
        setLoading(false);
        return;
      }

      const mealId = savedMeal.id;

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
          setLoading(false);
          return;
        }
      } else {
        console.log("🧪 No ingredients to insert (all were empty)");
      }

      alert('Meal and ingredients saved!');
      router.push('/food/meals');
    } catch (err) {
      console.error('Error saving meal:', err);
      setError('An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <div className="h-full">
      <BackButton />
      <h1 className="text-2xl font-bold mb-6 text-white">➕ Add a New Meal</h1>

      <MealForm
        onSubmit={handleSaveMeal}
        loading={loading}
        error={error}
      />
    </div>
  );
}
