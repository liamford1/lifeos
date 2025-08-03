import React, { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { supabase } from '@/lib/supabaseClient';
import { getMealSuggestions } from '@/lib/api/ai/mealSuggestionsClient';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import { useToast } from '@/components/client/Toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';
import { MdRestaurant, MdAdd, MdClose, MdLightbulb } from 'react-icons/md';

export default function AIMealSuggestionsModal({ onClose, onMealAdded }) {
  const { user } = useUser();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  
  const [pantryItems, setPantryItems] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('dinner');

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setSelectedDate(today);
  }, []);

  // Fetch pantry items
  useEffect(() => {
    const fetchPantryItems = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('food_items')
          .select('*')
          .eq('user_id', user.id)
          .order('name');
        
        if (error) {
          console.error('Error fetching pantry items:', error);
          setError('Failed to load pantry items');
        } else {
          setPantryItems(data || []);
        }
      } catch (err) {
        console.error('Error fetching pantry items:', err);
        setError('Failed to load pantry items');
      }
    };

    fetchPantryItems();
  }, [user]);

  // Mutation for adding meal to planner
  const addMealToPlannerMutation = useMutation({
    mutationFn: async ({ meal, date, time }) => {
      if (!user) {
        throw new Error('Not logged in');
      }

      // First, create the meal in the meals table
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert([{
          user_id: user.id,
          name: meal.name,
          description: meal.description,
          prep_time: meal.prepTime,
          cook_time: meal.cookTime,
          instructions: meal.instructions,
          servings: meal.estimatedServings,
          ai_generated: true,
        }])
        .select()
        .single();

      if (mealError) {
        throw new Error(`Failed to create meal: ${mealError.message}`);
      }

      // Then, save the ingredients to the meal_ingredients table
      if (meal.ingredients && meal.ingredients.length > 0) {
        const ingredientsData = meal.ingredients.map(ingredient => ({
          meal_id: mealData.id,
          food_item_name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit || null,
          name: ingredient.name
        }));

        const { error: ingredientsError } = await supabase
          .from('meal_ingredients')
          .insert(ingredientsData);

        if (ingredientsError) {
          console.error('Failed to insert ingredients:', ingredientsError);
          // Don't throw here - the meal was created successfully
        }
      }

      // Then, create the planned meal
      const { data: plannedMealData, error: plannedError } = await supabase
        .from('planned_meals')
        .insert([{
          user_id: user.id,
          meal_id: mealData.id,
          planned_date: date,
          meal_time: time,
        }])
        .select()
        .single();

      if (plannedError) {
        throw new Error(`Failed to plan meal: ${plannedError.message}`);
      }

      // Create calendar event
      const calendarError = await createCalendarEventForEntity(CALENDAR_SOURCES.PLANNED_MEAL, {
        id: plannedMealData.id,
        user_id: user.id,
        meal_name: meal.name,
        meal_time: time,
        planned_date: date,
      });

      if (calendarError) {
        console.warn('Failed to create calendar event:', calendarError);
      }

      return { mealData, plannedMealData };
    },
    onSuccess: (data, variables) => {
      showSuccess(`${variables.meal.name} added to planner!`);
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["meals"] });
      queryClient.invalidateQueries({ queryKey: ["meal-ingredients"] });
      if (onMealAdded) onMealAdded();
    },
    onError: (error) => {
      showError(`Failed to add meal: ${error.message}`);
    }
  });

  const handleGetSuggestions = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Check if user is logged in
      if (!user) {
        setError('Please log in to use AI meal suggestions');
        return;
      }

      const pantryData = pantryItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit
      }));

      const response = await getMealSuggestions(
        pantryData,
        { maxPrepTime: 60 }, // Default preferences
        [] // No dietary restrictions by default
      );

      setSuggestions(response.suggestions);
    } catch (err) {
      console.error('Error getting meal suggestions:', err);
      if (err.message === 'Not authenticated' || err.message.includes('log in')) {
        setError('Please log in to use AI meal suggestions');
      } else {
        setError(err.message || 'Failed to get meal suggestions');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAddToPlanner = async (meal) => {
    if (!selectedDate) {
      showError('Please select a date');
      return;
    }

    addMealToPlannerMutation.mutate({
      meal,
      date: selectedDate,
      time: selectedTime
    });
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MdLightbulb className="w-6 h-6 text-yellow-400" />
            <h2 className="text-xl font-bold">AI Meal Suggestions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            disabled={loading}
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        {/* Pantry Summary */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Current Pantry ({pantryItems.length} items)</h3>
          <div className="text-sm text-gray-300">
            {pantryItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pantryItems.slice(0, 10).map((item, index) => (
                  <span key={index} className="bg-gray-700 px-2 py-1 rounded">
                    {item.name} ({item.quantity} {item.unit})
                  </span>
                ))}
                {pantryItems.length > 10 && (
                  <span className="text-gray-400">+{pantryItems.length - 10} more</span>
                )}
              </div>
            ) : (
              <p className="text-gray-400">No pantry items found. Add some items to get better suggestions!</p>
            )}
          </div>
        </div>

        {/* Get Suggestions Button */}
        <div className="mb-6">
                  <Button
          onClick={handleGetSuggestions}
          disabled={loading || pantryItems.length === 0 || !user}
          variant="primary"
          className="w-full"
        >
            {loading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Getting AI Suggestions...
              </>
            ) : !user ? (
              <>
                <MdLightbulb className="w-4 h-4 mr-2" />
                Please Log In to Use AI
              </>
            ) : (
              <>
                <MdLightbulb className="w-4 h-4 mr-2" />
                Get AI Meal Suggestions
              </>
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300">
            {error}
          </div>
        )}

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Suggested Meals</h3>
            
            {/* Date/Time Selection */}
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Meal Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              {suggestions.map((meal, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <MdRestaurant className="w-5 h-5 text-orange-400" />
                        {meal.name}
                      </h4>
                      <p className="text-gray-300 text-sm mt-1">{meal.description}</p>
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>Prep: {formatTime(meal.prepTime)}</div>
                      <div>Cook: {formatTime(meal.cookTime)}</div>
                      <div className="capitalize">{meal.difficulty}</div>
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="mb-3">
                    <h5 className="font-medium text-sm mb-2">Ingredients:</h5>
                    <div className="flex flex-wrap gap-2">
                      {meal.ingredients.map((ingredient, idx) => (
                        <span key={idx} className="bg-gray-700 px-2 py-1 rounded text-xs">
                          {ingredient.name} ({ingredient.quantity} {ingredient.unit})
                        </span>
                      ))}
                    </div>
                    {meal.missingIngredients.length > 0 && (
                      <div className="mt-2">
                        <h6 className="text-sm text-yellow-400 mb-1">Missing ingredients:</h6>
                        <div className="flex flex-wrap gap-2">
                          {meal.missingIngredients.map((ingredient, idx) => (
                            <span key={idx} className="bg-yellow-900/30 border border-yellow-500/30 px-2 py-1 rounded text-xs text-yellow-300">
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Instructions Preview */}
                  <div className="mb-4">
                    <h5 className="font-medium text-sm mb-2">Instructions:</h5>
                    <ol className="text-sm text-gray-300 space-y-1">
                      {meal.instructions.slice(0, 3).map((instruction, idx) => (
                        <li key={idx} className="flex gap-2">
                          <span className="text-gray-500 font-mono">{idx + 1}.</span>
                          <span>{instruction}</span>
                        </li>
                      ))}
                      {meal.instructions.length > 3 && (
                        <li className="text-gray-500 text-xs">
                          ... and {meal.instructions.length - 3} more steps
                        </li>
                      )}
                    </ol>
                  </div>

                  {/* Add to Planner Button */}
                  <Button
                    onClick={() => handleAddToPlanner(meal)}
                    disabled={addMealToPlannerMutation.isPending}
                    variant="success"
                    size="sm"
                    className="w-full"
                  >
                    {addMealToPlannerMutation.isPending ? (
                      <>
                        <LoadingSpinner className="w-4 h-4 mr-2" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <MdAdd className="w-4 h-4 mr-2" />
                        Add to Planner
                      </>
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && suggestions.length === 0 && !error && (
          <div className="text-center py-8 text-gray-400">
            <MdLightbulb className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p>Click "Get AI Meal Suggestions" to see what you can cook with your current pantry items.</p>
          </div>
        )}
      </div>
    </div>
  );
} 