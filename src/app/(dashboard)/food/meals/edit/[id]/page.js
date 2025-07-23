'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import MealForm from '@/components/MealForm';
import { CALENDAR_SOURCES, updateCalendarEvent, updateCalendarEventFromSource } from '@/lib/calendarUtils';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealQuery, useMealIngredientsQuery, useUpdateMealMutation, useDeleteMealMutation } from '@/lib/hooks/useMeals';
import { useToast } from '@/components/Toast';

export default function EditMealPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { id } = useParams();
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
  
  const updateMealMutation = useUpdateMealMutation();
  const deleteMealMutation = useDeleteMealMutation();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  async function handleUpdateMeal(mealData) {
    if (!user || !id) {
      showError('User not authenticated or meal ID missing');
      return;
    }

    try {
      // Update the meal using React Query mutation
      updateMealMutation.mutate(
        {
          id,
          updatedData: {
            name: mealData.name,
            description: mealData.description,
            prep_time: mealData.prep_time,
            cook_time: mealData.cook_time,
            servings: mealData.servings,
            instructions: mealData.instructions
          },
          ingredients: mealData.ingredients
        },
        {
          onSuccess: async (updatedMeal) => {
            // Update calendar event for the edited meal
            const startTime = new Date();
            const calendarError = await updateCalendarEventFromSource(
              CALENDAR_SOURCES.MEAL,
              id,
              {
                title: `Meal: ${mealData.name}`,
                start_time: startTime.toISOString(),
                description: mealData.description || null,
              }
            );
            if (calendarError) {
              console.error('Calendar event update failed:', calendarError);
            }

            showSuccess('Meal updated successfully!');
            // Redirect to the meal view page
            router.push(`/food/meals/${id}`);
          },
          onError: (error) => {
            showError(error.message || 'Failed to update meal');
          }
        }
      );
    } catch (err) {
      console.error('Error in handleUpdateMeal:', err);
      showError('An unexpected error occurred');
    }
  }

  async function handleDelete() {
    if (!user || !id) {
      showError('User not authenticated or meal ID missing');
      return;
    }

    try {
      // Delete the meal using React Query mutation
      deleteMealMutation.mutate(id, {
        onSuccess: async (deletedId) => {
          // Update calendar event for the deleted meal
          const calendarError = await updateCalendarEventFromSource(
            CALENDAR_SOURCES.MEAL,
            deletedId,
            null // Set to null to indicate deletion
          );
          if (calendarError) {
            console.error('Calendar event update failed:', calendarError);
          }

          showSuccess('Meal deleted successfully!');
          // Redirect to the meals list page
          router.push('/food/meals');
        },
        onError: (error) => {
          showError(error.message || 'Failed to delete meal');
        }
      });
    } catch (err) {
      console.error('Error in handleDelete:', err);
      showError('An unexpected error occurred');
    }
  }

  function handleCancel() {
    router.push(`/food/meals/${id}`);
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

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">Edit Meal</h1>
      <p className="text-base">Update your meal recipe details.</p>

      <MealForm
        initialValues={initialValues}
        onSubmit={handleUpdateMeal}
        onCancel={handleCancel}
        isEditing={true}
        loading={updateMealMutation.isPending}
        error={updateMealMutation.error?.message}
      />
      <SharedDeleteButton
        onClick={handleDelete}
        size="sm"
        aria-label="Delete meal"
        disabled={deleteMealMutation.isPending}
        label="Delete"
      />
    </div>
  );
} 