'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';

export default function MealDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeal() {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId || !id) return;

      // Log mealId and userId before querying Supabase
      console.log('mealId (from URL param):', id);
      console.log('userId (from Supabase session):', userId);

      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      // Log the Supabase query result
      console.log('mealData:', mealData);
      console.log('mealError:', mealError);

      if (mealError) {
        console.error(mealError);
        setLoading(false);
        return;
      }

      setMeal(mealData);

      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .select('*')
        .eq('meal_id', id);

      if (ingredientsError) {
        console.error(ingredientsError);
      } else {
        setIngredients(ingredientsData);
      }

      setLoading(false);
    }

    fetchMeal();
  }, [id]);

  async function handleCookMeal() {
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
  
    if (!userId || !meal || ingredients.length === 0) {
      alert('Missing user, meal, or ingredients.');
      return;
    }
  
    let success = true;
  
    for (const ing of ingredients) {
      const { data: pantryItems, error: pantryError } = await supabase
        .from('food_items')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', ing.name);
  
      if (pantryError || !pantryItems || pantryItems.length === 0) {
        console.warn(`No pantry match for: ${ing.name}`);
        continue;
      }
  
      const pantryItem = pantryItems[0];
  
      if (parseFloat(pantryItem.quantity) < parseFloat(ing.quantity)) {
        console.warn(`Not enough of ${ing.name} to cook`);
        continue;
      }
  
      const newQty = parseFloat(pantryItem.quantity) - parseFloat(ing.quantity);
  
      if (newQty <= 0) {
        const { error: deleteError } = await supabase
          .from('food_items')
          .delete()
          .eq('id', pantryItem.id);
        if (deleteError) {
          console.error(deleteError);
          success = false;
        }
      } else {
        const { error: updateError } = await supabase
          .from('food_items')
          .update({ quantity: newQty })
          .eq('id', pantryItem.id);
        if (updateError) {
          console.error(updateError);
          success = false;
        }
      }
    }
  
    const { error: logError } = await supabase.from('cooked_meals').insert([
      {
        user_id: userId,
        meal_id: meal.id,
      },
    ]);
  
    await supabase
      .from('meals')
      .update({ last_cooked_at: new Date().toISOString() })
      .eq('id', meal.id);
  
    if (logError) {
      console.error(logError);
      alert('Meal cooked, but logging failed.');
    } else if (success) {
      alert('Meal cooked successfully and logged.');
    } else {
      alert('Meal cooked, but some pantry items could not be updated.');
    }
  }

  async function handleDeleteMeal() {
    const confirm = window.confirm('Delete this meal? This will also remove any linked calendar events.');
    if (!confirm) return;

    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;

    if (!userId || !meal) {
      alert('Missing user or meal.');
      return;
    }

    let mealError = null;
    let calendarError = null;

    // First, delete the meal
    const { error: mealDeleteError } = await supabase
      .from('meals')
      .delete()
      .eq('id', meal.id);
    mealError = mealDeleteError;

    // Then, delete any linked calendar events
    const { error: calendarDeleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('source', 'meal')
      .eq('source_id', meal.id);
    calendarError = calendarDeleteError;

    if (mealError || calendarError) {
      console.error('❌ Failed to delete:', mealError || calendarError);
      alert('Could not fully delete meal.');
    } else {
      alert('Meal deleted successfully.');
      // Redirect back to meals list
      window.location.href = '/food/meals';
    }
  }

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!meal) return <div className="p-6 text-white">Meal not found.</div>;

  return (
    <>
      <BackButton />
      <h1 className="text-3xl font-bold mb-2">{meal.name}</h1>
      {meal.description && <p className="text-gray-300 mb-4">{meal.description}</p>}

      <p className="text-sm text-gray-400 mb-6">
        Prep: {meal.prep_time || 0} min • Cook: {meal.cook_time || 0} min • Servings: {meal.servings || 1}
      </p>

      <h2 className="text-xl font-semibold mb-2">🧺 Ingredients</h2>
      <ul className="list-disc list-inside mb-6 text-gray-200">
        {ingredients.map((item, i) => (
          <li key={i}>
            {item.quantity} {item.unit} {item.name}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-semibold mb-2">📝 Instructions</h2>
      <ol className="list-decimal list-inside space-y-2 text-gray-200">
        {meal.instructions?.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>

      <div className="mt-8 flex gap-4 mb-4">
        <button
          onClick={() => router.push('/')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          📅 Back to Calendar
        </button>
      </div>

      <div className="flex gap-4">
        <button
          onClick={handleCookMeal}
          className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
        >
          🍽️ Cook This Meal
        </button>
        <button
          onClick={handleDeleteMeal}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          🗑️ Delete Meal
        </button>
      </div>
    </>
  );
}
