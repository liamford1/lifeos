'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function MealDetailPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { id } = useParams();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!mealLoading && !user) {
      router.push('/auth');
    }
  }, [mealLoading, user]);

  useEffect(() => {
    async function fetchMeal() {
      try {
        console.log('=== Starting fetchMeal ===');
        console.log('Raw id from useParams:', id);
        
        const user = await supabase.auth.getUser();
        const userId = user?.data?.user?.id;

        if (!userId) {
          console.error('No user found');
          setError('You must be logged in to view this meal.');
          setMealLoading(false);
          return;
        }

        if (!id) {
          console.error('No meal ID provided');
          setError('No meal ID provided.');
          setMealLoading(false);
          return;
        }

        // Log mealId and userId before querying Supabase
        console.log('mealId (from URL param):', id);
        console.log('mealId type:', typeof id);
        console.log('userId (from Supabase session):', userId);
        console.log('userId type:', typeof userId);

        // First, let's check if the meal exists at all (without user filter)
        const { data: mealCheck, error: mealCheckError } = await supabase
          .from('meals')
          .select('id, user_id, name')
          .eq('id', id);

        console.log('Meal check result:', mealCheck);
        console.log('Meal check error:', mealCheckError);

        if (mealCheckError) {
          console.error('Error checking meal existence:', mealCheckError);
          setError('Error checking meal existence.');
          setMealLoading(false);
          return;
        }

        if (!mealCheck || mealCheck.length === 0) {
          console.error('Meal not found in database');
          setError('Meal not found in database.');
          setMealLoading(false);
          return;
        }

        console.log('Found meal:', mealCheck[0]);

        // Check if the meal belongs to the current user
        if (mealCheck[0].user_id !== userId) {
          console.error('Meal does not belong to current user');
          console.error('Meal user_id:', mealCheck[0].user_id);
          console.error('Current user_id:', userId);
          setError('You do not have permission to view this meal.');
          setMealLoading(false);
          return;
        }

        // Now try the actual query with user filter
        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .eq('id', id)
          .eq('user_id', userId)
          .single();

        // Log the Supabase query result
        console.log('mealData:', mealData);
        console.log('mealError:', mealError);
        console.log('mealError type:', typeof mealError);
        console.log('mealError keys:', mealError ? Object.keys(mealError) : 'null');

        if (mealError) {
          console.error('Error fetching meal:', mealError);
          console.error('Error details:', {
            code: mealError.code,
            message: mealError.message,
            details: mealError.details,
            hint: mealError.hint
          });
          
          // Check if it's a "not found" error
          if (mealError.code === 'PGRST116') {
            console.error('Meal not found for this user - possible ownership issue');
            setError('Meal not found or you do not have permission to view it.');
          } else {
            setError('Error loading meal data.');
          }
          
          setMealLoading(false);
          return;
        }

        if (!mealData) {
          console.error('No meal data returned');
          setError('No meal data returned.');
          setMealLoading(false);
          return;
        }

        setMeal(mealData);

        const { data: ingredientsData, error: ingredientsError } = await supabase
          .from('meal_ingredients')
          .select('*')
          .eq('meal_id', id);

        if (ingredientsError) {
          console.error('Error fetching ingredients:', ingredientsError);
        } else {
          setIngredients(ingredientsData || []);
        }

        setMealLoading(false);
        console.log('=== fetchMeal completed successfully ===');
      } catch (error) {
        console.error('Unexpected error in fetchMeal:', error);
        console.error('Error stack:', error.stack);
        setError('An unexpected error occurred while loading the meal.');
        setMealLoading(false);
      }
    }

    fetchMeal();
  }, [id]);

  async function handleDeleteMeal() {
    try {
      const confirm = window.confirm('Delete this meal? This will also remove any linked calendar events.');
      if (!confirm) return;

      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId) {
        alert('You must be logged in.');
        return;
      }

      if (!meal) {
        alert('No meal data available.');
        return;
      }

      // First, delete the meal ingredients
      const { error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .delete()
        .eq('meal_id', meal.id);

      if (ingredientsError) {
        console.error('Error deleting meal ingredients:', ingredientsError);
        alert('Could not delete meal ingredients.');
        return;
      }

      // Then, delete the meal and its calendar events
      const error = await deleteEntityWithCalendarEvent({
        table: 'meals',
        id: meal.id,
        user_id: userId,
        source: CALENDAR_SOURCES.MEAL,
      });

      if (error) {
        console.error('❌ Failed to delete meal:', error);
        alert('Could not fully delete meal.');
      } else {
        alert('Meal deleted successfully.');
        // Redirect back to meals list
        window.location.href = '/food/meals';
      }
    } catch (error) {
      console.error('Unexpected error in handleDeleteMeal:', error);
      alert('An unexpected error occurred while deleting the meal.');
    }
  }

  if (mealLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (error) return (
    <div className="p-6 text-white">
      <BackButton />
      <div className="text-red-400 text-center py-8">
        <h1 className="text-xl font-bold mb-4">Error Loading Meal</h1>
        <p>{error}</p>
        <button 
          onClick={() => router.push('/food/meals')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Meals
        </button>
      </div>
    </div>
  );
  if (!meal) return (
    <div className="p-6 text-white">
      <BackButton />
      <div className="text-center py-8">
        <h1 className="text-xl font-bold mb-4">Meal Not Found</h1>
        <p>The meal you're looking for doesn't exist or you don't have permission to view it.</p>
        <button 
          onClick={() => router.push('/food/meals')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Back to Meals
        </button>
      </div>
    </div>
  );

  return (
    <>
      <BackButton />
      <h1 className="text-3xl font-bold mb-2">{meal.name}</h1>
      {meal.description && <p className="text-gray-300 mb-4">{meal.description}</p>}

      {/* Place the Cook Meal button here, right below description/instructions */}
      <Link
        href={`/food/meals/${id}/cook`}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4 inline-block"
      >
        Cook Meal
      </Link>

      <button
        onClick={() => router.push(`/food/meals/edit/${meal.id}`)}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Edit
      </button>

      <p className="text-sm text-gray-400 mb-6">
        Prep: {meal.prep_time || 0} min • Cook: {meal.cook_time || 0} min • Servings: {meal.servings || 1}
      </p>

      <h2 className="text-xl font-semibold mb-2">🧺 Ingredients</h2>
      <ul className="list-disc list-inside mb-6 text-gray-200">
        {ingredients.map((item, i) => (
          <li key={i}>
            {item.quantity} {item.unit} {item.food_item_name}
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
          onClick={handleDeleteMeal}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          🗑️ Delete Meal
        </button>
      </div>
    </>
  );
}
