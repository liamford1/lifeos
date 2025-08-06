"use client";

import { useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import MealForm from '@/components/forms/MealForm';
import { useApiError } from '@/lib/hooks/useApiError';
import { useCreateMealMutation } from '@/lib/hooks/useMeals';
import { MdClose } from 'react-icons/md';
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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6">
        <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative">
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-200">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative transform transition-all duration-200 ease-out">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CirclePlus className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Add a New Meal</h2>
                <p className="text-sm text-gray-400">Create a new meal recipe with ingredients and instructions</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              aria-label="Close modal"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <MealForm
            onSubmit={handleSaveMeal}
            onCancel={handleCancel}
            loading={createMealMutation.isPending}
            error={createMealMutation.error?.message}
          />
        </div>
      </div>
    </div>
  );
} 