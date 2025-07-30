"use client";

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteEntityWithCalendarEvent } from '@/lib/utils/deleteUtils'
import BackButton from '@/components/shared/BackButton'
import Button from '@/components/shared/Button'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils'
import { useToast } from '@/components/client/Toast'
import { MdOutlineCalendarToday } from 'react-icons/md';
import dynamic from "next/dynamic";
const CalendarCheck = dynamic(() => import("lucide-react/dist/esm/icons/calendar-check"), { ssr: false });
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import { deleteCalendarEventForEntity } from '@/lib/calendarSync';
import { useUser } from '@/context/UserContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export default function MealPlannerPage() {
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
  const { user, loading: userLoading } = useUser();

  useEffect(() => {
    if (!userLoading && user) {
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
  }, [user, userLoading]);

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
      setPlannedDate('');
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

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Plan a Meal
      </h1>
      <p className="text-base">Schedule meals for the week ahead.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={selectedMealId}
          onChange={(e) => setSelectedMealId(e.target.value)}
          className="bg-surface text-white border border-[#232323] rounded px-3 py-2"
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
        </select>

        <input
          type="date"
          value={plannedDate}
          onChange={(e) => setPlannedDate(e.target.value)}
          className="bg-surface text-white border border-[#232323] rounded px-3 py-2"
        />

        <select
          value={mealTime}
          onChange={(e) => setMealTime(e.target.value)}
          className="bg-surface text-white border border-[#232323] rounded px-3 py-2"
          data-testid="meal-time-select"
        >
          <option value="breakfast">Breakfast</option>
          <option value="lunch">Lunch</option>
          <option value="dinner">Dinner</option>
          <option value="snack">Snack</option>
        </select>
      </div>

      <Button
        onClick={handlePlanMeal}
        variant="primary"
        disabled={planMealMutation.isPending}
      >
        {planMealMutation.isPending ? 'Planning...' : 'Plan Meal'}
      </Button>

      {message && <p className="mt-4 text-sm text-green-400">{message}</p>}

      {isLoading ? (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">
            <CalendarCheck className="w-5 h-5 text-base mr-2 inline-block" />
            Upcoming Planned Meals
          </h2>
          <LoadingSpinner />
        </div>
      ) : Object.keys(groupedMeals).length > 0 ? (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">
            <CalendarCheck className="w-5 h-5 text-base mr-2 inline-block" />
            Upcoming Planned Meals
          </h2>

          {Object.entries(groupedMeals).map(([date, times]) => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-bold mb-2 text-base">
                {new Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(date))}
              </h3>

              {['breakfast', 'lunch', 'dinner', 'snack'].map((slot) =>
                times[slot]?.map((item) => (
                  <div
                    key={item.id}
                    className="bg-surface p-3 rounded mb-2 flex justify-between items-center border border-[#232323]"
                    data-testid={`planned-meal-card-${item.id}`}
                  >
                    <div>
                      <div className="font-medium">{item.meals?.name}</div>
                      <div className="text-sm text-base capitalize">
                        {slot}
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDelete(item.id)}
                      variant="link"
                      size="sm"
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </Button>
                  </div>
                )) ?? null
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">🗓️ Upcoming Planned Meals</h2>
          <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
        </div>
      )}
    </div>
  )
}
