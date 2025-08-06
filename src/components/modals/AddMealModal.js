"use client";

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MealForm from '@/components/forms/MealForm';
import { useApiError } from '@/lib/hooks/useApiError';
import { useCreateMealMutation } from '@/lib/hooks/useMeals';
import BaseModal from '@/components/shared/BaseModal';
import dynamic from "next/dynamic";
const CirclePlus = dynamic(() => import("lucide-react/dist/esm/icons/circle-plus"), { ssr: false });

export default function AddMealModal({ isOpen, onClose, onSuccess }) {
  const { user, loading: userLoading } = useUser();
  const { handleError } = useApiError();
  const createMealMutation = useCreateMealMutation();

  // Don't render if not open
  if (!isOpen) return null;

  // Show loading spinner when user is loading
  if (userLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
        subtitle="Please wait"
        icon={CirclePlus}
        iconBgColor="bg-green-500/10"
        iconColor="text-green-500"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Don't render if user is not authenticated
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
              // Close modal and optionally refresh meal list
              onClose();
              if (onSuccess) {
                onSuccess(createdMeal);
              }
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

  function handleCancel() {
    onClose();
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Add a New Meal"
      subtitle="Create a new meal recipe with ingredients and instructions"
      icon={CirclePlus}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      disabled={createMealMutation.isPending}
    >
      <MealForm
        onSubmit={handleSaveMeal}
        onCancel={handleCancel}
        loading={createMealMutation.isPending}
        error={createMealMutation.error?.message}
      />
    </BaseModal>
  );
} 