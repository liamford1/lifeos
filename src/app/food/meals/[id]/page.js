'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import AppBar from '@/components/AppBar';
import BackButton from '@/components/BackButton';

export default function MealDetailPage() {
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeal() {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId || !id) return;

      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

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

  if (loading) return <div className="p-6 text-white">Loading...</div>;
  if (!meal) return <div className="p-6 text-white">Meal not found.</div>;

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AppBar />

      <main className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 p-6 overflow-auto">
          <nav className="flex flex-col gap-4">
            <a href="/food" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🍽️ Food / Diet</a>
            <a href="/fitness" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🏋️ Fitness</a>
            <a href="/finances" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">💸 Finances</a>
            <a href="/scratchpad" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🧠 Scratchpad</a>
          </nav>
        </aside>

        {/* Content */}
        <section className="flex-grow p-8 overflow-auto">
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

          <div className="mt-8">
            <button
              onClick={handleCookMeal}
              className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
            >
              🍽️ Cook This Meal
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
