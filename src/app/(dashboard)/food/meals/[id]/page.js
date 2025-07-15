'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Link from 'next/link';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';

export default function MealDetailPage() {
  const { id } = useParams();
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  useEffect(() => {
    async function fetchMeal() {
      if (!user) return;

      try {
        console.log('=== fetchMeal started ===');
        console.log('User ID:', user.id);
        console.log('Meal ID:', id);

        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

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
        showError('You must be logged in.');
        return;
      }

      if (!meal) {
        showError('No meal data available.');
        return;
      }

      // First, delete the meal ingredients
      const { error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .delete()
        .eq('meal_id', meal.id);

      if (ingredientsError) {
        console.error('Error deleting meal ingredients:', ingredientsError);
        showError('Could not delete meal ingredients.');
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
        showError('Could not fully delete meal.');
      } else {
        showSuccess('Meal deleted successfully!');
        // Redirect back to meals list
        window.location.href = '/food/meals';
      }
    } catch (error) {
      console.error('Unexpected error in handleDeleteMeal:', error);
      showError('An unexpected error occurred while deleting the meal.');
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
        <Button 
          onClick={() => router.push('/food/meals')}
          variant="primary"
          className="mt-4"
        >
          Back to Meals
        </Button>
      </div>
    </div>
  );
  if (!meal) return (
    <div className="p-6 text-white">
      <BackButton />
      <div className="text-center py-8">
        <h1 className="text-xl font-bold mb-4">Meal Not Found</h1>
        <p>The meal you're looking for doesn't exist or you don't have permission to view it.</p>
        <Button 
          onClick={() => router.push('/food/meals')}
          variant="primary"
          className="mt-4"
        >
          Back to Meals
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <BackButton />
      <h1 className="text-3xl font-bold mb-2">{meal.name}</h1>
      {meal.description && <p className="text-gray-300 mb-4">{meal.description}</p>}

      {/* Place the Cook Meal button here, right below description/instructions */}
      <Link href={`/food/meals/${id}/cook`}>
        <Button variant="primary" className="mb-4">
          Cook Meal
        </Button>
      </Link>

      <Button
        onClick={() => router.push(`/food/meals/edit/${meal.id}`)}
        variant="secondary"
        className="mt-4"
      >
        Edit
      </Button>

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
        <Button
          onClick={() => router.push('/')}
          variant="primary"
        >
          📅 Back to Calendar
        </Button>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={handleDeleteMeal}
          variant="danger"
        >
          🗑️ Delete Meal
        </Button>
      </div>
    </>
  );
}
