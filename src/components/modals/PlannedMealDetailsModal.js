'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import { useToast } from '@/components/client/Toast';
import { MdOutlineStickyNote2 } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';
import BaseModal from '@/components/shared/BaseModal';
import CookingSessionModal from '@/components/modals/CookingSessionModal';
import { UtensilsCrossed } from 'lucide-react';
import { deleteCalendarEventForEntity } from '@/lib/calendarSync';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import ConfirmationModal from '@/components/shared/ConfirmationModal';

export default function PlannedMealDetailsModal({ isOpen, onClose, plannedMealId, calendarEvent, refreshKey, onRefresh }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { handleError } = useApiError();
  const [plannedMeal, setPlannedMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [showCookingSessionModal, setShowCookingSessionModal] = useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  // Fetch planned meal data
  useEffect(() => {
    if (!isOpen || !plannedMealId || !user?.id) return;



    const fetchIngredients = async (mealId) => {
      if (!mealId) {
        setIngredients([]);
        return;
      }
      
      setIngredientsLoading(true);
      try {
        const { data, error } = await supabase
          .from('meal_ingredients')
          .select('*')
          .eq('meal_id', mealId)
          .order('id', { ascending: true });

        if (error) {
          console.error('Error fetching ingredients:', error);
          return;
        }

        setIngredients(data || []);
      } catch (error) {
        console.error('Error fetching ingredients:', error);
      } finally {
        setIngredientsLoading(false);
      }
    };

    const fetchPlannedMealAndIngredients = async () => {
      setLoading(true);
      try {
        // Add cache-busting by including refreshKey in the query
        const { data, error } = await supabase
          .from('planned_meals')
          .select(`
            *,
            meals (
              name,
              description,
              instructions,
              prep_time,
              cook_time,
              servings,
              difficulty,
              calories
            )
          `)
          .eq('id', plannedMealId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching planned meal:', error);
          handleError(error, { customMessage: 'Failed to fetch planned meal details.' });
          return;
        }

        if (!data) {
          console.error('Planned meal not found');
          handleError(new Error('Planned meal not found'), { customMessage: 'Planned meal not found or no longer exists.' });
          onClose();
          return;
        }

        setPlannedMeal(data);
        // Fetch ingredients using the meal_id from the planned meal
        await fetchIngredients(data.meal_id);
      } catch (error) {
        console.error('Error fetching planned meal:', error);
        handleError(error, { customMessage: 'Failed to fetch planned meal details.' });
      } finally {
        setLoading(false);
      }
    };

    fetchPlannedMealAndIngredients();
  }, [isOpen, plannedMealId, user?.id, handleError, refreshKey, internalRefreshKey]);

  // Expose refresh function to parent component
  useEffect(() => {
    if (onRefresh) {
      onRefresh(() => {
        setInternalRefreshKey(prev => prev + 1);
      });
    }
  }, [onRefresh]);

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

  async function handleDeletePlannedMeal() {
    setShowDeleteConfirmation(true);
  }

  async function handleConfirmDeletePlannedMeal() {
    try {

      if (!user) {
        showError('You must be logged in.');
        return;
      }

      if (!plannedMeal) {
        showError('No planned meal data available.');
        return;
      }

      // Delete the planned meal
      const { error } = await supabase
        .from('planned_meals')
        .delete()
        .eq('id', plannedMeal.id)
        .eq('user_id', user.id);

      if (error) {
        showError(error.message || 'Failed to delete planned meal.');
        return;
      }

      // Delete the linked calendar event
      const calendarError = await deleteCalendarEventForEntity(CALENDAR_SOURCES.PLANNED_MEAL, plannedMeal.id);
      if (calendarError) {
        // Silent error handling - main deletion succeeded
      }

      showSuccess('Planned meal deleted successfully!');
      onClose();
    } catch (error) {
      showError('An unexpected error occurred while deleting the planned meal.');
    }
  }

  // Show loading state while fetching planned meal data
  if (loading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading Planned Meal..."
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

  // Show error state if no planned meal found
  if (!plannedMeal) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Planned Meal Not Found"
        subtitle="The planned meal doesn't exist or you don't have permission to view it"
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

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title={plannedMeal.meals?.name || plannedMeal.meal_name || 'Planned Meal'}
        subtitle={plannedMeal.meals?.description || plannedMeal.description || "Planned meal details"}
        icon={UtensilsCrossed}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
        maxWidth="max-w-4xl"
      >
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center text-xs text-zinc-500 mt-1">
            <span>Planned for: {(() => {
              // Use the calendar event's current date if available, otherwise use the planned meal's date
              if (calendarEvent?.start_time) {
                const eventDate = new Date(calendarEvent.start_time);
                return eventDate.toLocaleDateString();
              } else if (plannedMeal?.planned_date) {
                const plannedDate = new Date(plannedMeal.planned_date);
                return plannedDate.toLocaleDateString();
              } else {
                return 'Date not specified';
              }
            })()}</span>
            {plannedMeal.meal_time && <span>Time: {plannedMeal.meal_time}</span>}
            {plannedMeal.meals?.prep_time && <span>Prep: {plannedMeal.meals.prep_time} min</span>}
            {plannedMeal.meals?.cook_time && <span>Cook: {plannedMeal.meals.cook_time} min</span>}
            {plannedMeal.meals?.servings && <span>Servings: {plannedMeal.meals.servings}</span>}
          </div>
          
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={() => {
                // Navigate to cooking session for this meal
                router.push(`/food/meals/${plannedMeal.meal_id}/cook`);
                onClose();
              }}
              variant="primary"
            >
              <UtensilsCrossed className="inline w-5 h-5 text-base align-text-bottom mr-2" />
              Cook Meal
            </Button>
          </div>
          
          <div className="border-t border-zinc-700 mt-4 pt-4">
            <h3 className="text-lg font-semibold mb-2">Ingredients</h3>
            {ingredientsLoading ? (
              <div className="flex justify-center py-4">
                <LoadingSpinner />
              </div>
            ) : ingredients.length === 0 ? (
              <p className="text-zinc-500 italic">No ingredients specified.</p>
            ) : (
              <ul className="list-disc list-inside space-y-2 text-base">
                {ingredients.map((item, i) => (
                  <li key={`ingredient-${item.id || i}-${item.food_item_name}`}>
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
              {Array.isArray(plannedMeal.meals?.instructions)
                ? plannedMeal.meals.instructions.map((step, index) => (
                    <li key={`instruction-${index}-${step.substring(0, 20)}`}>{step}</li>
                  ))
                : (typeof plannedMeal.meals?.instructions === 'string' && plannedMeal.meals.instructions.trim()
                    ? plannedMeal.meals.instructions.split('\n').map((step, index) => (
                        <li key={`instruction-${index}-${step.substring(0, 20)}`}>{step}</li>
                      ))
                    : <li className="text-zinc-500 italic">No instructions provided.</li>
                  )}
            </ol>
          </div>
          
          <div className="flex justify-end mt-6">
            <SharedDeleteButton
              onClick={handleDeletePlannedMeal}
              size="sm"
              aria-label="Delete planned meal"
              label="Delete"
            />
          </div>
        </div>
      </BaseModal>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleConfirmDeletePlannedMeal}
        title="Delete Planned Meal"
        message="Delete this planned meal? This will also remove any linked calendar events."
        confirmText="Delete"
        cancelText="Cancel"
      />
    </>
  );
}
