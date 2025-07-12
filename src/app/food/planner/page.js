'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { addCalendarEvent } from '@/lib/calendarUtils'

export default function MealPlannerPage() {
  const [meals, setMeals] = useState([])
  const [selectedMealId, setSelectedMealId] = useState('')
  const [plannedDate, setPlannedDate] = useState('')
  const [mealTime, setMealTime] = useState('dinner')
  const [message, setMessage] = useState('')
  const [plannedMeals, setPlannedMeals] = useState([])

  // Fetch all available meals
  useEffect(() => {
    const fetchMeals = async () => {
      const { data, error } = await supabase
        .from('meals')
        .select('id, name')
        .order('name')

      if (error) {
        console.error('Error fetching meals:', error.message)
      } else {
        setMeals(data)
      }
    }

    fetchMeals()
  }, [])

  // Fetch all planned meals
  const fetchPlannedMeals = async () => {
    const { data, error } = await supabase
      .from('planned_meals')
      .select('id, planned_date, meal_time, meal_id, meals(name)')
      .order('planned_date', { ascending: true })

    if (error) {
      console.error('Error fetching planned meals:', error.message)
    } else {
      setPlannedMeals(data)
    }
  }

  useEffect(() => {
    fetchPlannedMeals()
  }, [])

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
      const meal = meals.find((m) => m.id === selectedMealId)
      const [year, month, day] = plannedDate.split('-').map(Number);
      const startTime = new Date(year, month - 1, day,
        mealTime === 'breakfast' ? 8 :
        mealTime === 'lunch' ? 12 :
        mealTime === 'dinner' ? 18 : 15
      );

      await addCalendarEvent({
        userId: user.id,
        title: `${mealTime[0].toUpperCase() + mealTime.slice(1)}: ${meal.name}`,
        startTime: startTime.toISOString(),
        source: 'meal',
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
    const { error: mealError } = await supabase
      .from('planned_meals')
      .delete()
      .eq('id', id)

    const { error: eventError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('source', 'meal')
      .eq('source_id', id)

    if (mealError || eventError) {
      console.error('Error deleting planned meal or calendar event:', mealError?.message || eventError?.message)
    } else {
      fetchPlannedMeals()
    }
  }

  const groupedMeals = {}
  plannedMeals.forEach((meal) => {
    const date = meal.planned_date
    const time = meal.meal_time || 'dinner'

    if (!groupedMeals[date]) {
      groupedMeals[date] = {}
    }
    if (!groupedMeals[date][time]) {
      groupedMeals[date][time] = []
    }
    groupedMeals[date][time].push(meal)
  })

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">📅 Plan a Meal</h1>

      <label className="block mb-2">Select Meal:</label>
      <select
        value={selectedMealId}
        onChange={(e) => setSelectedMealId(e.target.value)}
        className="border rounded p-2 mb-4 w-full"
      >
        <option value="">-- Choose a meal --</option>
        {meals.map((meal) => (
          <option key={meal.id} value={meal.id}>
            {meal.name}
          </option>
        ))}
      </select>

      <label className="block mb-2">Select Date:</label>
      <input
        type="date"
        value={plannedDate}
        onChange={(e) => setPlannedDate(e.target.value)}
        className="border rounded p-2 mb-4 w-full"
      />

      <label className="block mb-2">Meal Time:</label>
      <select
        value={mealTime}
        onChange={(e) => setMealTime(e.target.value)}
        className="border rounded p-2 mb-4 w-full"
      >
        <option value="breakfast">Breakfast</option>
        <option value="lunch">Lunch</option>
        <option value="dinner">Dinner</option>
        <option value="snack">Snack</option>
      </select>

      <button
        onClick={handlePlanMeal}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Plan Meal
      </button>

      {message && <p className="mt-4 text-sm text-gray-700">{message}</p>}

      {Object.keys(groupedMeals).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">🗓️ Upcoming Planned Meals</h2>

          {Object.entries(groupedMeals).map(([date, times]) => (
            <div key={date} className="mb-6">
              <h3 className="text-lg font-bold mb-2">
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
                    className="border p-3 rounded mb-2 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium">{item.meals?.name}</div>
                      <div className="text-sm text-gray-600 capitalize">
                        {slot}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                )) ?? null
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
