"use client";

import React, { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/shared/Button'
import FormInput from '@/components/shared/FormInput'
import FormSelect from '@/components/shared/FormSelect'
import FormTextarea from '@/components/shared/FormTextarea'
import FormField from '@/components/shared/FormField'
import dayjs from 'dayjs'
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils'
import { useApiError } from '@/lib/hooks/useApiError'
import { createCalendarEventForEntity } from '@/lib/calendarSync';
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useFormValidation } from '@/lib/hooks/useFormValidation'

// Zod schema for planned workout form
const plannedWorkoutSchema = z.object({
  type: z.enum(['workout', 'cardio', 'sports']),
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().optional(),
  notes: z.string().optional(),
})

export default function PlannedWorkoutForm({ onSuccess, selectedDate }) {
  const { handleError, handleSuccess } = useApiError();
  const queryClient = useQueryClient();
  const [type, setType] = useState('workout') // workout | cardio | sports
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState(selectedDate ? `${selectedDate}T10:00` : '')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')

  // React Query mutation for creating planned workouts
  const createPlannedWorkoutMutation = useMutation({
    mutationFn: async (formData) => {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      const userId = userData?.user?.id

      if (!userId) {
        throw new Error('Not logged in.')
      }

      const table = formData.type === 'workout' ? 'fitness_workouts'
                  : formData.type === 'cardio' ? 'fitness_cardio'
                  : 'fitness_sports'

      // Ensure required fields are not empty
      if (!formData.title || formData.title.trim() === '') {
        throw new Error('Activity type is required');
      }

      const insertData = {
          user_id: userId,
          status: 'planned',
          ...(formData.type === 'workout' && {
              title: formData.title,
              date: formData.startTime ? formData.startTime.split('T')[0] : new Date().toISOString().split('T')[0],
              start_time: formData.startTime || null,
              end_time: formData.endTime || null,
              notes: formData.notes
          }),
          ...(formData.type === 'cardio' && {
              activity_type: formData.title.trim(),
              date: formData.startTime ? formData.startTime.split('T')[0] : new Date().toISOString().split('T')[0],
              start_time: formData.startTime || null,
              end_time: formData.endTime || null,
              notes: formData.notes
          }),
          ...(formData.type === 'sports' && {
              activity_type: formData.title.trim(),
              date: formData.startTime ? formData.startTime.split('T')[0] : new Date().toISOString().split('T')[0],
              start_time: formData.startTime || null,
              end_time: formData.endTime || null,
              performance_notes: formData.notes
          })
      }

      const { data, error } = await supabase
          .from(table)
          .insert([insertData])
          .select()
          .single()

      if (error) {
          throw error
      }

      // Set default end time to 1 hour after start time if not provided
      let finalEndTime = formData.endTime;
      if (!finalEndTime && formData.startTime) {
        finalEndTime = dayjs(formData.startTime).add(1, 'hour').toISOString();
      }

      // Create calendar event
      const calendarSource = formData.type === 'workout' ? CALENDAR_SOURCES.WORKOUT
                          : formData.type === 'cardio' ? CALENDAR_SOURCES.CARDIO
                          : CALENDAR_SOURCES.SPORT // Fixed: was SPORTS, should be SPORT

      // Fixed: Pass the entity object instead of separate parameters
      const calendarError = await createCalendarEventForEntity(
          calendarSource,
          {
              ...data,
              user_id: userId,
              title: formData.title,
              activity_type: formData.type === 'workout' ? undefined : formData.title,
              notes: formData.type === 'sports' ? undefined : formData.notes,
              performance_notes: formData.type === 'sports' ? formData.notes : undefined,
              date: formData.startTime ? formData.startTime.split('T')[0] : new Date().toISOString().split('T')[0],
              start_time: formData.startTime || null,
              end_time: finalEndTime,
          }
      )

      if (calendarError) {
          console.error('Calendar event creation failed:', calendarError)
          // Don't throw here - allow the workout to be created even if calendar fails
          // But we should notify the user about the calendar issue
          handleError(calendarError, { 
              customMessage: 'Workout created but calendar event failed to create',
              showToast: true 
          });
      }

      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['events'])
      handleSuccess('Planned workout created successfully!');
      onSuccess?.()
    },
    onError: (error) => {
      handleError(error, { 
        customMessage: error.message 
      });
    }
  });

  const handleFormSubmit = (formData) => {
    // Execute the mutation
    createPlannedWorkoutMutation.mutate(formData);
  };

  const {
    fieldErrors,
    isSubmitting,
    handleSubmit,
    getFieldError,
  } = useFormValidation(plannedWorkoutSchema, handleFormSubmit);

  const onSubmitHandler = (e) => {
    const formData = { type, title, startTime, endTime, notes };
    handleSubmit(e, formData);
  };

  return (
    <form onSubmit={onSubmitHandler} className="mt-4 space-y-4 p-4 bg-surface rounded shadow">
      <FormField 
        label="Type" 
        error={getFieldError('type')}
        required
      >
        <FormSelect 
          value={type} 
          onChange={e => setType(e.target.value)}
          disabled={isSubmitting}
        >
          <option value="workout">Workout</option>
          <option value="cardio">Cardio</option>
          <option value="sports">Sports</option>
        </FormSelect>
      </FormField>

      <FormField 
        label={type === 'workout' ? 'Title' : 'Activity Type'}
        error={getFieldError('title')}
        required
      >
        <FormInput
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={type === 'workout' ? 'e.g., Upper Body, Leg Day' : 'e.g., Running, Cycling'}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField 
        label="Start Time" 
        error={getFieldError('startTime')}
        required
      >
        <FormInput
          type="datetime-local"
          value={startTime}
          onChange={e => setStartTime(e.target.value)}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField 
        label="End Time (Optional)" 
        error={getFieldError('endTime')}
      >
        <FormInput
          type="datetime-local"
          value={endTime}
          onChange={e => setEndTime(e.target.value)}
          disabled={isSubmitting}
        />
      </FormField>

      <FormField 
        label="Notes (Optional)" 
        error={getFieldError('notes')}
      >
        <FormTextarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any additional notes about this planned workout..."
          rows={3}
          disabled={isSubmitting}
        />
      </FormField>

      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || createPlannedWorkoutMutation.isPending}
        className="w-full"
      >
        {isSubmitting || createPlannedWorkoutMutation.isPending ? 'Saving...' : 'Save Planned Workout'}
      </Button>
    </form>
  )
}
