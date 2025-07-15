'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils'
import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import LoadingSpinner from '@/components/LoadingSpinner'
import { CALENDAR_SOURCES } from '@/lib/calendarUtils'
import { useToast } from '@/components/Toast'

export default function MealPlannerPage() {
  const { showSuccess, showError } = useToast();
  const [meals, setMeals] = useState([])
  const [plannedMeals, setPlannedMeals] = useState([])
  const [selectedMealId, setSelectedMealId] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [mealTime, setMealTime] = useState('dinner')
  const [message, setMessage] = useState('')
  const [mealsLoading, setMealsLoading] = useState(true)
  const [plannedMealsLoading, setPlannedMealsLoading] = useState(true)

  const fetchMeals = async () => {
    setMealsLoading(true)
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error fetching meals:', error.message)
    } else {
      setMeals(data)
    }
    setMealsLoading(false)
  }

  const fetchPlannedMeals = async () => {
    setPlannedMealsLoading(true)
    const { data, error } = await supabase
      .from('planned_meals')
      .select(`
        *,
        meals (
          name
        )
      `)
      .order('planned_date')

    if (error) {
      console.error('Error fetching planned meals:', error.message)
    } else {
      setPlannedMeals(data)
    }
    setPlannedMealsLoading(false)
  }

  useEffect(() => {
    fetchMeals()
    fetchPlannedMeals()
  }, [])

  const addCalendarEvent = async ({ userId, title, startTime, source, sourceId }) => {
    const { error } = await supabase
      .from('calendar_events')
      .insert([
        {
          user_id: userId,
          title,
          start_time: startTime,
          source,
          source_id: sourceId,
        },
      ])

    if (error) {
      console.error('Error adding calendar event:', error.message)
    }
  }

  const handlePlanMeal = async () => {
    setMessage('')
    if (!selectedMealId || !plannedDate) {
      setMessage('Please select a meal and date.')
      return
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setMessage('Error: not logged in')
      return
    }

    const { data: insertData, error } = await supabase
      .from('planned_meals')
      .insert([
        {
          user_id: user.id,
          meal_id: selectedMealId,
          planned_date: plannedDate,
          meal_time: mealTime,
        },
      ])
      .select()
      .single()

    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      // Log the planned meal ID when inserting the calendar event
      console.log('Planned meal ID:', insertData.id)
      
      const meal = meals.find((m) => m.id === selectedMealId)
      const [year, month, day] = plannedDate.split('-').map(Number)
      const startTime = new Date(year, month - 1, day,
        mealTime === 'breakfast' ? 8 :
        mealTime === 'lunch' ? 12 :
        mealTime === 'dinner' ? 18 : 15
      )

      await addCalendarEvent({
        userId: user.id,
        title: `${mealTime[0].toUpperCase() + mealTime.slice(1)}: ${meal.name}`,
        startTime: startTime.toISOString(),
        source: CALENDAR_SOURCES.PLANNED_MEAL,
        sourceId: insertData.id,
      })

      setMessage('Meal planned successfully!')
      setSelectedMealId('')
      setPlannedDate('')
      setMealTime('dinner')
      fetchPlannedMeals()
    }
  }

  const handleDelete = async (id) => {
    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      showError('You must be logged in.');
      return;
    }

    const error = await deleteEntityWithCalendarEvent({
      table: 'planned_meals',
      id: id,
      user_id: user_id,
      source: CALENDAR_SOURCES.PLANNED_MEAL,
    });

    if (error) {
      console.error('Error deleting planned meal:', error);
      showError('Failed to delete planned meal.');
    } else {
      fetchPlannedMeals();
      showSuccess('Planned meal deleted successfully!');
    }
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
    <>
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">📅 Plan a Meal</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <select
          value={selectedMealId}
          onChange={(e) => setSelectedMealId(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
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
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
        />

        <select
          value={mealTime}
          onChange={(e) => setMealTime(e.target.value)}
          className="bg-gray-800 text-white border border-gray-600 rounded px-3 py-2"
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
      >
        Plan Meal
      </Button>

      {message && <p className="mt-4 text-sm text-green-400">{message}</p>}

      {plannedMealsLoading ? (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">🗓️ Upcoming Planned Meals</h2>
          <LoadingSpinner />
        </div>
      ) : Object.keys(groupedMeals).length > 0 ? (
        <div className="mt-10">
          <h2 className="text-xl font-semibold mb-4">🗓️ Upcoming Planned Meals</h2>

          {Object.entries(groupedMeals).map(([date, times]) => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-bold mb-2 text-gray-300">
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
                    className="bg-gray-800 p-3 rounded mb-2 flex justify-between items-center border border-gray-700"
                  >
                    <div>
                      <div className="font-medium">{item.meals?.name}</div>
                      <div className="text-sm text-gray-400 capitalize">
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
    </>
  )
}
