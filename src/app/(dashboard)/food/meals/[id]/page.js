'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import Link from 'next/link';
import { useToast } from '@/components/Toast';
import { MdOutlineCalendarToday, MdOutlineStickyNote2 } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealQuery, useMealIngredientsQuery, useDeleteMealMutation } from '@/lib/hooks/useMeals';

export default function MealDetailPage() {
  const { id } = useParams();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Use React Query for data fetching
  const { 
    data: meal, 
    isLoading: mealLoading, 
    error: mealError 
  } = useMealQuery(id, user?.id);
  
  const { 
    data: ingredients = [], 
    isLoading: ingredientsLoading, 
    error: ingredientsError 
  } = useMealIngredientsQuery(id);
  
  const deleteMealMutation = useDeleteMealMutation();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  async function handleDeleteMeal() {
    try {
      const confirm = window.confirm('Delete this meal? This will also remove any linked calendar events.');
      if (!confirm) return;

      if (!user) {
        showError('You must be logged in.');
        return;
      }

      if (!meal) {
        showError('No meal data available.');
        return;
      }

      // Delete the meal (this will cascade delete ingredients)
      deleteMealMutation.mutate(meal.id, {
        onSuccess: () => {
          showSuccess('Meal deleted successfully!');
          // Redirect back to meals list
          router.push('/food/meals');
        },
        onError: (error) => {
          showError(error.message || 'Failed to delete meal.');
        }
      });
    } catch (error) {
      showError('An unexpected error occurred while deleting the meal.');
    }
  }

  // Show loading spinner only when user is loading or when we don't have user data yet
  if (userLoading || (!user && !userLoading)) {
    return <LoadingSpinner />;
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  // Show loading state while fetching meal data
  if (mealLoading) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <BackButton />
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show error state
  if (mealError) {
    return (
      <div className="max-w-6xl mx-auto p-4 space-y-4">
        <BackButton />
        <div className="text-red-400 text-center py-8">
          <h1 className="text-xl font-bold mb-4">Error Loading Meal</h1>
          <p>{mealError.message}</p>
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
  }

  // Show not found state
  if (!meal) {
    return (
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
  }

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
        {ingredientsLoading ? (
          <div className="flex justify-center py-4">
            <LoadingSpinner />
          </div>
        ) : ingredientsError ? (
          <p className="text-red-400">Error loading ingredients: {ingredientsError.message}</p>
        ) : (
          <ul className="list-disc list-inside space-y-2 text-base">
            {ingredients.map((item, i) => (
              <li key={i}>
                {item.quantity} {item.unit} {item.food_item_name}
              </li>
            ))}
          </ul>
        )}
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
          disabled={deleteMealMutation.isPending}
          label="Delete"
        />
      </div>
    </div>
  );
}
