'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import Link from 'next/link';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday, MdOutlineStickyNote2 } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealQuery, useMealIngredientsQuery, useUpdateMealMutation, useDeleteMealMutation } from '@/lib/hooks/useMeals';
import { useCookingSession } from '@/context/CookingSessionContext';
import BaseModal from '@/components/shared/BaseModal';
import CookingSessionModal from '@/components/modals/CookingSessionModal';
import { UtensilsCrossed } from 'lucide-react';
import MealForm from '@/components/forms/MealForm';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/utils/calendarUtils';
import { useApiError } from '@/lib/hooks/useApiError';

export default function MealDetailsModal({ isOpen, onClose, mealId }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { endCooking, mealId: cookingMealId } = useCookingSession();
  const [showCookingSessionModal, setShowCookingSessionModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const { handleError } = useApiError();

  // Use React Query for data fetching
  const { 
    data: meal, 
    isLoading: mealLoading, 
    error: mealError 
  } = useMealQuery(mealId, user?.id);
  
  const { 
    data: ingredients = [], 
    isLoading: ingredientsLoading, 
    error: ingredientsError 
  } = useMealIngredientsQuery(mealId);
  
  const updateMealMutation = useUpdateMealMutation();
  const deleteMealMutation = useDeleteMealMutation();

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
        icon={UtensilsCrossed}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
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

  async function handleUpdateMeal(mealData) {
    if (!user || !mealId) {
      handleError(new Error('User not authenticated or meal ID missing'), {
        customMessage: 'User not authenticated or meal ID missing'
      });
      return;
    }

    try {
      // Update the meal using React Query mutation
      updateMealMutation.mutate(
        {
          id: mealId,
          updatedData: {
            name: mealData.name,
            description: mealData.description,
            prep_time: mealData.prep_time,
            cook_time: mealData.cook_time,
            servings: mealData.servings,
            instructions: mealData.instructions
          },
          ingredients: mealData.ingredients,
          options: {
            onSuccess: async (updatedMeal) => {
              // Update calendar event for the edited meal
              const startTime = new Date();
              const calendarError = await updateCalendarEventFromSource(
                CALENDAR_SOURCES.MEAL,
                mealId,
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
              setIsEditing(false);
            },
            onError: (error) => {
              handleError(error, { 
                customMessage: 'Failed to update meal' 
              });
            }
          }
        }
      );
    } catch (err) {
      console.error('Error in handleUpdateMeal:', err);
      handleError(err, { 
        customMessage: 'An unexpected error occurred' 
      });
    }
  }

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

      // End cooking session if this meal is being cooked
      if (cookingMealId === meal.id) {
        await endCooking();
      }

      // Delete the meal (this will cascade delete ingredients)
      deleteMealMutation.mutate({
        id: meal.id,
        options: {
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
            onClose();
          },
          onError: (error) => {
            showError(error.message || 'Failed to delete meal.');
          }
        }
      });
    } catch (error) {
      showError('An unexpected error occurred while deleting the meal.');
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  // Show loading state while fetching meal data
  if (mealLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading Meal..."
        subtitle="Please wait"
        icon={UtensilsCrossed}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Show error state
  if (mealError) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Error Loading Meal"
        subtitle="Something went wrong"
        icon={UtensilsCrossed}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
      >
        <div className="text-red-400 text-center py-8">
          <p>{mealError.message}</p>
          <Button 
            onClick={onClose}
            variant="primary"
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </BaseModal>
    );
  }

  // Show not found state
  if (!meal) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Meal Not Found"
        subtitle="The meal doesn't exist or you don't have permission to view it"
        icon={UtensilsCrossed}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
      >
        <div className="text-center py-8">
          <Button 
            onClick={onClose}
            variant="primary"
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </BaseModal>
    );
  }

  // If editing, show the edit form
  if (isEditing) {
    // Prepare initial values for the form
    const mappedIngredients = ingredients.map(ing => ({
      name: ing.food_item_name || '',
      quantity: ing.quantity?.toString() || '',
      unit: ing.unit || '',
    }));
    
    // Ensure we have at least one ingredient to prevent validation failure
    const initialIngredients = mappedIngredients.length > 0 ? mappedIngredients : [{ name: '', quantity: '', unit: '' }];
    
    const initialValues = {
      name: meal?.name || '',
      description: meal?.description || '',
      prep_time: meal?.prep_time,
      cook_time: meal?.cook_time,
      servings: meal?.servings,
      instructions: meal?.instructions || [],
      ingredients: initialIngredients,
    };

    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Edit Meal"
        subtitle="Update your meal recipe details"
        icon={UtensilsCrossed}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
        maxWidth="max-w-4xl"
      >
        <MealForm
          initialValues={initialValues}
          onSubmit={handleUpdateMeal}
          onCancel={handleCancelEdit}
          isEditing={true}
          loading={updateMealMutation.isPending}
          error={updateMealMutation.error?.message}
        />
      </BaseModal>
    );
  }

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={meal.name}
        subtitle={meal.description || "Meal details"}
        icon={UtensilsCrossed}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center text-xs text-zinc-500 mt-1">
            <span>Prep: {meal.prep_time || 0} min</span>
            <span>Cook: {meal.cook_time || 0} min</span>
            <span>Servings: {meal.servings || 1}</span>
          </div>
          
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={() => setShowCookingSessionModal(true)}
              variant="primary"
            >
              Cook Meal
            </Button>
            <Button
              onClick={() => setIsEditing(true)}
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
      </BaseModal>

      {/* Cooking Session Modal */}
      <CookingSessionModal
        isOpen={showCookingSessionModal}
        onClose={() => setShowCookingSessionModal(false)}
        mealId={mealId}
      />
    </>
  );
} 