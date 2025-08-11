"use client";

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteEntityWithCalendarEvent } from '@/lib/utils/deleteUtils'
import Button from '@/components/shared/Button'
import SharedDeleteButton from '@/components/SharedDeleteButton'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import FormInput from '@/components/shared/FormInput'
import FormSelect from '@/components/shared/FormSelect'
import FormLabel from '@/components/shared/FormLabel'
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils'
import { useToast } from '@/components/client/Toast'
import { MdOutlineCalendarToday, MdLightbulb } from 'react-icons/md';
import dynamic from "next/dynamic";
const CalendarCheck = dynamic(() => import("lucide-react/dist/esm/icons/calendar-check"), { ssr: false });
import { createCalendarEventForEntity, deleteCalendarEventForEntity } from '@/lib/calendarSync';
import { useUser } from '@/context/UserContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import BaseModal from '@/components/shared/BaseModal';
import { toYMD } from '@/lib/date';
import AIMealSuggestionsModal from '@/components/forms/AIMealSuggestionsModal';

export default function PlanMealModal({ isOpen, onClose, onSuccess, selectedDate }) {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [meals, setMeals] = useState([])
  const [plannedMeals, setPlannedMeals] = useState([])
  const [selectedMealId, setSelectedMealId] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [mealTime, setMealTime] = useState('dinner')
  const [message, setMessage] = useState('')
  const [mealsLoading, setMealsLoading] = useState(true)
  const [plannedMealsLoading, setPlannedMealsLoading] = useState(true)
  const [showAIModal, setShowAIModal] = useState(false)

  const { user, loading: userLoading } = useUser();

  // Set default date to selected date or today when modal opens
  useEffect(() => {
    if (isOpen) {
      const dateToUse = selectedDate || toYMD(new Date());
      setPlannedDate(dateToUse);
    }
  }, [isOpen, selectedDate]);

  useEffect(() => {
    if (!userLoading && user && isOpen) {
      const fetchData = async () => {
        setMealsLoading(true);
        setPlannedMealsLoading(true);
        try {
          const { data: mealsData, error: mealsError } = await supabase
            .from('meals')
            .select('*')
            .order('name');
          if (mealsError) {
            showError('Error fetching meals:', mealsError.message);
            setMeals([]);
          } else {
            setMeals(mealsData);
          }
        } catch (err) {
          showError('Error fetching meals:', err.message || String(err));
          setMeals([]);
        } finally {
          setMealsLoading(false);
        }

        try {
          const { data: plannedData, error: plannedError } = await supabase
            .from('planned_meals')
            .select(`
              *,
              meals (
                name
              )
            `)
            .order('planned_date');
          if (plannedError) {
            showError('Error fetching planned meals:', plannedError.message);
            setPlannedMeals([]);
          } else {
            setPlannedMeals(plannedData);
          }
        } catch (err) {
          showError('Error fetching planned meals:', err.message || String(err));
          setPlannedMeals([]);
        } finally {
          setPlannedMealsLoading(false);
        }
      };
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, userLoading, isOpen]);

  const isLoading = userLoading || mealsLoading || plannedMealsLoading;

  // React Query mutation for planning meals
  const planMealMutation = useMutation({
    mutationFn: async (formData) => {
      if (!user) {
        throw new Error('Not logged in');
      }

      const { data: insertData, error } = await supabase
        .from('planned_meals')
        .insert([
          {
            user_id: user.id,
            meal_id: formData.selectedMealId,
            planned_date: formData.plannedDate,
            meal_time: formData.mealTime,
          },
        ])
        .select()
        .single()

      if (error) {
        throw new Error(`Error: ${error.message}`)
      }

      // Add calendar event for the planned meal
      const mealName = meals.find(m => m.id === formData.selectedMealId)?.name || '';
      const calendarError = await createCalendarEventForEntity(CALENDAR_SOURCES.PLANNED_MEAL, {
        id: insertData.id,
        user_id: user.id,
        meal_name: mealName,
        meal_time: formData.mealTime,
        planned_date: formData.plannedDate,
      });

      if (calendarError) {
        throw new Error('Failed to create calendar event');
      }

      return { insertData, mealName };
    },
    onSuccess: (data, variables) => {
      showSuccess('Meal planned successfully!');
      
      // Invalidate calendar events query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["events", user?.id] });
      
      // Reset form
      setSelectedMealId('');
      setPlannedDate(toYMD(new Date()));
      setMealTime('dinner');
      setMessage('');

      // Refetch planned meals
      setPlannedMealsLoading(true);
      supabase
        .from('planned_meals')
        .select(`
          *,
          meals (
            name
          )
        `)
        .order('planned_date')
        .then(({ data: plannedData, error: plannedError }) => {
          if (plannedError) {
            showError('Error fetching planned meals:', plannedError.message);
            setPlannedMeals([]);
          } else {
            setPlannedMeals(plannedData);
          }
          setPlannedMealsLoading(false);
        })
        .catch((err) => {
          showError('Error fetching planned meals:', err.message || String(err));
          setPlannedMeals([]);
          setPlannedMealsLoading(false);
        });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error) => {
      setMessage(error.message);
    }
  });

  const handlePlanMeal = async () => {
    setMessage('')
    if (!selectedMealId || !plannedDate) {
      setMessage('Please select a meal and date.')
      return
    }

    // Execute the mutation
    planMealMutation.mutate({ selectedMealId, plannedDate, mealTime });
  }



  const handleDelete = async (id) => {
    if (!user) {
      showError('You must be logged in.');
      return;
    }
    const user_id = user.id;

    // Delete the planned meal
    const { error: deleteError } = await supabase
      .from('planned_meals')
      .delete()
      .eq('id', id);
    if (deleteError) {
      showError('Failed to delete planned meal.');
      return;
    }
    // Delete the linked calendar event
    const calendarError = await deleteCalendarEventForEntity(CALENDAR_SOURCES.PLANNED_MEAL, id);
    if (calendarError) {
      showError('Failed to delete linked calendar event.');
      return;
    }
    // Refetch planned meals only
    setPlannedMealsLoading(true);
    try {
      const { data: plannedData, error: plannedError } = await supabase
        .from('planned_meals')
        .select(`
          *,
          meals (
            name
          )
        `)
        .order('planned_date');
      if (plannedError) {
        showError('Error fetching planned meals:', plannedError.message);
        setPlannedMeals([]);
      } else {
        setPlannedMeals(plannedData);
      }
    } catch (err) {
      showError('Error fetching planned meals:', err.message || String(err));
      setPlannedMeals([]);
    } finally {
      setPlannedMealsLoading(false);
    }
    showSuccess('Planned meal deleted successfully!');
  }

  const groupedMeals = {}
  plannedMeals.forEach((meal) => {
    const date = meal.planned_date
    const time = meal.meal_time || 'dinner'
    if (!groupedMeals[date]) groupedMeals[date] = {}
    if (!groupedMeals[date][time]) groupedMeals[date][time] = []
    groupedMeals[date][time].push(meal)
  })

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Plan a Meal"
      subtitle="Schedule meals for the week ahead"
      icon={MdOutlineCalendarToday}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      disabled={planMealMutation.isPending}
    >


          {/* Form */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <MdOutlineCalendarToday className="w-4 h-4 text-blue-500" />
              </div>
              <h2 className="text-lg font-semibold">Plan a New Meal</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <FormLabel htmlFor="meal-select">Meal</FormLabel>
                <FormSelect
                  id="meal-select"
                  value={selectedMealId}
                  onChange={(e) => setSelectedMealId(e.target.value)}
                  data-testid="meal-select"
                >
                  <option value="">-- Choose a meal --</option>
                  {mealsLoading ? (
                    <option disabled>Loading meals...</option>
                  ) : (
                    meals.map((meal) => (
                      <option key={meal.id} value={meal.id}>
                        {meal.name}
                      </option>
                    ))
                  )}
                </FormSelect>
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="planned-date">Date</FormLabel>
                <FormInput
                  id="planned-date"
                  type="date"
                  value={plannedDate}
                  onChange={(e) => setPlannedDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <FormLabel htmlFor="meal-time-select">Meal Time</FormLabel>
                <FormSelect
                  id="meal-time-select"
                  value={mealTime}
                  onChange={(e) => setMealTime(e.target.value)}
                  data-testid="meal-time-select"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </FormSelect>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2">
              <Button
                onClick={() => setShowAIModal(true)}
                variant="secondary"
                size="md"
                className="flex items-center gap-2"
              >
                <MdLightbulb className="w-4 h-4" />
                AI Suggest Meals
              </Button>
              <Button
                onClick={handlePlanMeal}
                variant="primary"
                size="md"
                disabled={planMealMutation.isPending}
                loading={planMealMutation.isPending}
                className="max-w-xs"
              >
                {planMealMutation.isPending ? 'Planning...' : 'Plan Meal'}
              </Button>
            </div>

            {message && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <p className="text-sm text-green-400">{message}</p>
              </div>
            )}
          </div>

        {/* Planned Meals Section */}
        <div className="border-t border-border/50 pt-6">
          {isLoading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-gray-700 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-gray-400" />
                </div>
                <h2 className="text-lg font-semibold">Upcoming Planned Meals</h2>
              </div>
              <div className="flex justify-center py-8">
                <LoadingSpinner />
              </div>
            </div>
          ) : Object.keys(groupedMeals).length > 0 ? (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-500/10 rounded-lg flex items-center justify-center">
                  <CalendarCheck className="w-4 h-4 text-green-500" />
                </div>
                <h2 className="text-lg font-semibold">Upcoming Planned Meals</h2>
              </div>

              <div className="space-y-4">
                {Object.entries(groupedMeals).map(([date, times]) => (
                  <div key={date} className="space-y-3">
                    <h3 className="text-base font-medium text-gray-400">
                      {new Intl.DateTimeFormat('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC',
                      }).format(new Date(date))}
                    </h3>

                    <div className="space-y-2">
                      {['breakfast', 'lunch', 'dinner', 'snack'].map((slot) =>
                        times[slot]?.map((item) => (
                          <div
                            key={item.id}
                            className="bg-card border border-border rounded-lg p-4 flex justify-between items-center hover:bg-card/80 transition-colors"
                            data-testid={`planned-meal-card-${item.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                              <div>
                                <div className="font-medium">{item.meals?.name}</div>
                                <div className="text-sm text-gray-400 capitalize">
                                  {slot}
                                </div>
                              </div>
                            </div>
                            <SharedDeleteButton
                              onClick={() => handleDelete(item.id)}
                              size="sm"
                            />
                          </div>
                        )) ?? null
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <CalendarCheck className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No planned meals yet</h3>
                <p className="text-sm text-gray-400">Add a meal above to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* AI Meal Suggestions Modal */}
        <AIMealSuggestionsModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onMealAdded={() => {
            setShowAIModal(false);
            if (onSuccess) onSuccess();
          }}
        />
      </BaseModal>
    );
  } 