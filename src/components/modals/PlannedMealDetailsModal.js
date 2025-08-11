'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday, MdOutlineStickyNote2 } from 'react-icons/md';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';
import BaseModal from '@/components/shared/BaseModal';
import CookingSessionModal from '@/components/modals/CookingSessionModal';
import { UtensilsCrossed } from 'lucide-react';
import { deleteCalendarEventForEntity } from '@/lib/calendarSync';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';

export default function PlannedMealDetailsModal({ isOpen, onClose, plannedMealId }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { handleError } = useApiError();
  const [plannedMeal, setPlannedMeal] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);
  const [showCookingSessionModal, setShowCookingSessionModal] = useState(false);

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
  }, [isOpen, plannedMealId, user?.id, handleError]);

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
    try {
      const confirm = window.confirm('Delete this planned meal? This will also remove any linked calendar events.');
      if (!confirm) return;

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
        console.error('Failed to delete linked calendar event:', calendarError);
        // Don't show error to user since the main deletion succeeded
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
            <span>Planned for: {new Date(plannedMeal.planned_date).toLocaleDateString()}</span>
            {plannedMeal.meal_time && <span>Time: {plannedMeal.meal_time}</span>}
            {plannedMeal.meals?.prep_time && <span>Prep: {plannedMeal.meals.prep_time} min</span>}
            {plannedMeal.meals?.cook_time && <span>Cook: {plannedMeal.meals.cook_time} min</span>}
            {plannedMeal.meals?.servings && <span>Servings: {plannedMeal.meals.servings}</span>}
          </div>
          
          <div className="flex gap-4 mt-4">
            <Button 
              onClick={() => {
                // Navigate to food page to create the actual meal
                router.push('/food');
                onClose();
              }}
              variant="primary"
            >
              Create Meal
            </Button>
            <Button
              onClick={() => router.push(`/food/planner/${plannedMeal.id}`)}
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
            ) : ingredients.length === 0 ? (
              <p className="text-zinc-500 italic">No ingredients specified.</p>
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
              {Array.isArray(plannedMeal.meals?.instructions)
                ? plannedMeal.meals.instructions.map((step, index) => (
                    <li key={index}>{step}</li>
                  ))
                : (typeof plannedMeal.meals?.instructions === 'string' && plannedMeal.meals.instructions.trim()
                    ? plannedMeal.meals.instructions.split('\n').map((step, index) => (
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
              onClick={handleDeletePlannedMeal}
              size="sm"
              aria-label="Delete planned meal"
              label="Delete"
            />
          </div>
        </div>
      </BaseModal>
    </>
  );
}
