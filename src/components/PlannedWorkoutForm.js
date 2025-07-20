'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import FormLabel from '@/components/FormLabel'
import FormInput from '@/components/FormInput'
import FormTextarea from '@/components/FormTextarea'
import dayjs from 'dayjs'
import { CALENDAR_SOURCES } from '@/lib/calendarUtils'
import { useToast } from '@/components/Toast'
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import { z } from 'zod'
import { mapZodErrors } from '@/lib/validationHelpers'

// Zod schema for planned workout form
const plannedWorkoutSchema = z.object({
  type: z.enum(['workout', 'cardio', 'sports']),
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  notes: z.string().optional(),
})

export default function PlannedWorkoutForm({ onSuccess }) {
  const { showSuccess, showError } = useToast();
  const [type, setType] = useState('workout') // workout | cardio | sports
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setFieldErrors({})

    // Zod validation
    const result = plannedWorkoutSchema.safeParse({ type, title, startTime, endTime, notes })
    if (!result.success) {
      setFieldErrors(mapZodErrors(result.error))
      setLoading(false)
      return
    }

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (!userId) {
      showError('Not logged in.')
      setLoading(false)
      return
    }

    const table = type === 'workout' ? 'fitness_workouts'
                : type === 'cardio' ? 'fitness_cardio'
                : 'fitness_sports'

    const insertData = {
        user_id: userId,
        notes,
        ...(type === 'workout' && {
            title,
            date: startTime ? startTime.split('T')[0] : null
        }),
        ...(type !== 'workout' && {
            activity_type: title,
            date: startTime ? startTime.split('T')[0] : null
        }),
    }         

    const { data, error } = await supabase
      .from(table)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      showError(`Failed to save planned workout: ${error.message}`)
      setLoading(false)
      return
    }

    const calendarTitle = `Planned ${type.charAt(0).toUpperCase() + type.slice(1)}: ${title}`

    // Map table to source for calendar events
    const source = type === 'workout' ? CALENDAR_SOURCES.WORKOUT 
                 : type === 'cardio' ? CALENDAR_SOURCES.CARDIO 
                 : CALENDAR_SOURCES.SPORT

    const calendarError = await createCalendarEventForEntity(source, {
      id: data.id,
      user_id: userId,
      title,
      activity_type: type === 'cardio' ? title : undefined,
      date: startTime,
      notes,
      end_time: endTime || null,
    });
    if (calendarError) {
      showError('Failed to create calendar event.');
    } else {
      showSuccess('Planned workout created successfully!');
    }

    setLoading(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 p-4 bg-surface rounded shadow">
      <div>
        <FormLabel>Type</FormLabel>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 bg-surface rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <option value="workout">Workout</option>
          <option value="cardio">Cardio</option>
          <option value="sports">Sports</option>
        </select>
        {fieldErrors.type && <div className="text-red-400 text-xs mt-1">{fieldErrors.type}</div>}
      </div>

      <div>
        <FormLabel>
          {type === 'workout' ? 'Title' : 'Activity Type'}
        </FormLabel>
        <FormInput
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />
        {fieldErrors.title && <div className="text-red-400 text-xs mt-1">{fieldErrors.title}</div>}
      </div>

      <div>
        <FormLabel>Start Time</FormLabel>
        <FormInput
          type="datetime-local"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          required
        />
        {fieldErrors.startTime && <div className="text-red-400 text-xs mt-1">{fieldErrors.startTime}</div>}
      </div>

      <div>
        <FormLabel>End Time</FormLabel>
        <FormInput
          type="datetime-local"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
        />
        {fieldErrors.endTime && <div className="text-red-400 text-xs mt-1">{fieldErrors.endTime}</div>}
      </div>

      <div>
        <FormLabel>Notes (optional)</FormLabel>
        <FormTextarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
        />
        {fieldErrors.notes && <div className="text-red-400 text-xs mt-1">{fieldErrors.notes}</div>}
      </div>

      <Button type="submit" className="mt-2">
        {loading ? 'Saving...' : 'Save Planned Activity'}
      </Button>
    </form>
  )
}
