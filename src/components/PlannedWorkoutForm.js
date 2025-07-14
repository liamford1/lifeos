'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import dayjs from 'dayjs'

export default function PlannedWorkoutForm({ onSuccess }) {
  const [type, setType] = useState('workout') // workout | cardio | sports
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    // Validate required fields
    if (!title.trim() || !startTime) {
      alert('Please fill in all required fields.')
      setLoading(false)
      return
    }

    const { data: userData, error: authError } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    if (!userId) {
      console.error('❌ Not logged in:', authError)
      alert('Not logged in.')
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

    console.log('📋 Attempting to insert into:', table)
    console.log('📦 Insert data:', insertData)

    const { data, error } = await supabase
      .from(table)
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('🔥 Supabase insert error:', error)
      console.error('📋 Table:', table)
      console.error('📦 Insert data:', insertData)
      alert(`Failed to save planned workout.\n\n${error.message}`)
      setLoading(false)
      return
    }

    console.log('✅ Inserted entry:', data)

    const calendarTitle = `Planned ${type.charAt(0).toUpperCase() + type.slice(1)}: ${title}`

    // Map table to source for calendar events
    const source = type === 'workout' ? 'workout' 
                 : type === 'cardio' ? 'cardio' 
                 : 'sports'

    const { error: calendarError } = await supabase.from('calendar_events').insert({
      user_id: userId,
      title: calendarTitle,
      source: source,
      source_id: data.id,
      start_time: startTime,
      end_time: endTime || null,
    })

    if (calendarError) {
      console.error('⚠️ Calendar event creation failed:', calendarError)
      console.error('📅 Calendar event data:', {
        user_id: userId,
        title: calendarTitle,
        source: source,
        source_id: data.id,
        start_time: startTime,
        end_time: endTime || null,
      })
    } else {
      console.log('📅 Calendar event created.')
    }

    setLoading(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4 p-4 bg-gray-800 rounded shadow">
      <div>
        <label className="block text-sm mb-1 text-white">Type</label>
        <select value={type} onChange={e => setType(e.target.value)} className="w-full p-2 rounded text-black">
          <option value="workout">Workout</option>
          <option value="cardio">Cardio</option>
          <option value="sports">Sports</option>
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1 text-white">
          {type === 'workout' ? 'Title' : 'Activity Type'}
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          className="w-full p-2 rounded text-black"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-white">Start Time</label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          required
          className="w-full p-2 rounded text-black"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-white">End Time</label>
        <input
          type="datetime-local"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          className="w-full p-2 rounded text-black"
        />
      </div>

      <div>
        <label className="block text-sm mb-1 text-white">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          className="w-full p-2 rounded text-black"
        />
      </div>

      <Button type="submit" className="mt-2">
        {loading ? 'Saving...' : 'Save Planned Activity'}
      </Button>
    </form>
  )
}
