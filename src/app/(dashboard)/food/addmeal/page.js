"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import MealForm from '@/components/MealForm';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useApiError } from '@/lib/hooks/useApiError';
import dynamic from "next/dynamic";
const CirclePlus = dynamic(() => import("lucide-react/dist/esm/icons/circle-plus"), { ssr: false });
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import { useCreateMealMutation } from '@/lib/hooks/useMeals';

export default function AddMealPage(props) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { handleError } = useApiError();
  const createMealMutation = useCreateMealMutation();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  // Show loading spinner only when user is loading or when we don't have user data yet
  if (userLoading || (!user && !userLoading)) {
    return <LoadingSpinner />;
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  async function handleSaveMeal(mealData) {
    if (!user) {
      handleError(new Error('User not logged in.'), { 
        customMessage: 'User not logged in.' 
      });
      return;
    }

    try {
      // Create the meal using React Query mutation
      createMealMutation.mutate(
        {
          mealData: {
            user_id: user.id,
            name: mealData.name,
            description: mealData.description,
            prep_time: mealData.prep_time,
            cook_time: mealData.cook_time,
            servings: mealData.servings,
            instructions: mealData.instructions,
            notes: mealData.notes,
            calories: mealData.calories,
            date: mealData.date,
            ingredients: mealData.ingredients
          },
          options: {
            onSuccess: (createdMeal) => {
              router.push('/food/meals');
            },
            onError: (error) => {
              handleError(error, { 
                customMessage: 'Failed to save meal.' 
              });
            }
          }
        }
      );
    } catch (err) {
      handleError(err, { 
        customMessage: 'An unexpected error occurred.' 
      });
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <CirclePlus className="w-5 h-5 text-base mr-2 inline-block" />
        Add a New Meal
      </h1>
      <p className="text-base">Create a new meal recipe with ingredients and instructions.</p>

      <MealForm
        onSubmit={handleSaveMeal}
        loading={createMealMutation.isPending}
        error={createMealMutation.error?.message}
      />
    </div>
  );
}
