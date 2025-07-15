// src/app/fitness/planner/page.js
'use client'

import CalendarView from '@/components/CalendarView'
import BackButton from '@/components/BackButton'
import { useState } from 'react'
import Button from '@/components/Button'
import PlannedWorkoutForm from '@/components/PlannedWorkoutForm' // we’ll make this next

export default function FitnessPlannerPage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">Planned Fitness Activities</h1>
      <p className="text-gray-400">Schedule and plan your fitness activities.</p>

      <CalendarView filter="fitness" /> {/* You can add this filtering in your existing CalendarView */}

      <div className="mt-6">
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Planned Activity'}
        </Button>
        {showForm && <PlannedWorkoutForm onSuccess={() => setShowForm(false)} />}
      </div>
    </div>
  )
}
