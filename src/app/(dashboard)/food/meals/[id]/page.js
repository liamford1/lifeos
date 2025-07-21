'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Link from 'next/link';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';
import { MdOutlineCalendarToday, MdOutlineStickyNote2 } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';

export default function MealDetailPage() {
  const { id } = useParams();
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [meal, setMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [mealLoading, setMealLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function fetchMeal() {
      if (!user) {
        router.push('/auth');
        return;
      }

      try {
        const { data: mealData, error: mealError } = await supabase
          .from('meals')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (mealError) {
          if (mealError.code === 'PGRST116') {
            showError('Meal not found for this user - possible ownership issue');
            setError('Meal not found or you do not have permission to view it.');
          } else {
            showError('Error loading meal data.');
            setError('Error loading meal data.');
          }
          setMealLoading(false);
          return;
        }

        if (!mealData) {
          showError('No meal data returned.');
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
          showError('Error fetching ingredients.');
        } else {
          setIngredients(ingredientsData || []);
        }

        setMealLoading(false);
      } catch (error) {
        showError('An unexpected error occurred while loading the meal.');
        setMealLoading(false);
      }
    }

    fetchMeal();
  }, [id, router, showError, user]);

  async function handleDeleteMeal() {
    try {
      const confirm = window.confirm('Delete this meal? This will also remove any linked calendar events.');
      if (!confirm) return;

      setDeleting(true);
      if (!user) {
        showError('You must be logged in.');
        setDeleting(false);
        return;
      }
      const userId = user.id;

      if (!meal) {
        showError('No meal data available.');
        setDeleting(false);
        return;
      }

      // First, delete the meal ingredients
      const { error: ingredientsError } = await supabase
        .from('meal_ingredients')
        .delete()
        .eq('meal_id', meal.id);

      if (ingredientsError) {
        showError('Could not delete meal ingredients.');
        setDeleting(false);
        return;
      }

      // Then, delete the meal and its calendar events
      const { error: mealError } = await supabase
        .from('meals')
        .delete()
        .eq('id', meal.id);
      if (mealError) {
        showError('Could not delete meal.');
      } else {
        showSuccess('Meal deleted successfully!');
        // Redirect back to meals list
        window.location.href = '/food/meals';
      }
    } catch (error) {
      showError('An unexpected error occurred while deleting the meal.');
    } finally {
      setDeleting(false);
    }
  }

  if (mealLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (error) return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
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
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <div className="text-center py-8">
        <h1 className="text-xl font-bold mb-4">Meal Not Found</h1>
        <p>The meal you&rsquo;re looking for doesn&rsquo;t exist or you don&rsquo;t have permission to view it.</p>
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
    <div className="w-full max-w-6xl mx-auto bg-zinc-900 p-8 rounded-2xl shadow-lg space-y-6 mt-6 text-base">
      <BackButton />
      <h1 className="text-2xl font-bold">{meal.name}</h1>
      {meal.description && <p className="text-sm text-zinc-400">{meal.description}</p>}
      <div className="flex flex-wrap gap-4 items-center text-xs text-zinc-500 mt-1">
        <span>Prep: {meal.prep_time || 0} min</span>
        <span>Cook: {meal.cook_time || 0} min</span>
        <span>Servings: {meal.servings || 1}</span>
      </div>
      <div className="flex gap-4 mt-4">
        <Link href={`/food/meals/${id}/cook`}>
          <Button variant="primary">Cook Meal</Button>
        </Link>
        <Button
          onClick={() => router.push(`/food/meals/edit/${meal.id}`)}
          variant="secondary"
        >
          Edit
        </Button>
      </div>
      <div className="border-t border-zinc-700 mt-4 pt-4">
        <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
        <ul className="list-disc list-inside space-y-2 text-base">
          {ingredients.map((item, i) => (
            <li key={i}>
              {item.quantity} {item.unit} {item.food_item_name}
            </li>
          ))}
        </ul>
      </div>
      <div className="border-t border-zinc-700 mt-4 pt-4">
        <h3 className="text-lg font-semibold mb-2 flex items-center">
          <MdOutlineStickyNote2 className="inline w-5 h-5 text-base align-text-bottom mr-2" />
          Instructions
        </h3>
        <ol className="list-decimal list-inside space-y-2 text-base">
          {Array.isArray(meal.instructions)
            ? meal.instructions.map((step, index) => (
                <li key={index}>{step}</li>
              ))
            : (typeof meal.instructions === 'string' && meal.instructions.trim()
                ? meal.instructions.split('\n').map((step, index) => (
                    <li key={index}>{step}</li>
                  ))
                : <li className="text-zinc-500 italic">No instructions provided.</li>
              )}
        </ol>
      </div>
      <div className="flex justify-between mt-6 gap-4">
        <Button
          onClick={() => router.push('/')}
          variant="primary"
        >
          <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
          Back to Calendar
        </Button>
        <SharedDeleteButton
          onClick={handleDeleteMeal}
          size="sm"
          aria-label="Delete meal"
          disabled={deleting}
          label="Delete"
        />
      </div>
    </div>
  );
}
