"use client";

import React from 'react'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Button from '@/components/Button'
import FormInput from '@/components/FormInput'
import FormSelect from '@/components/FormSelect'
import FormTextarea from '@/components/FormTextarea'
import FormField from '@/components/FormField'
import dayjs from 'dayjs'
import { CALENDAR_SOURCES } from '@/lib/calendarUtils'
import { useToast } from '@/components/Toast'
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

export default function PlannedWorkoutForm({ onSuccess }) {
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();
  const [type, setType] = useState('workout') // workout | cardio | sports
  const [title, setTitle] = useState('')
  const [startTime, setStartTime] = useState('')
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
          }),
      }

      const { data, error } = await supabase
        .from(table)
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to save planned workout: ${error.message}`)
      }

      // Map table to source for calendar events
      const source = formData.type === 'workout' ? CALENDAR_SOURCES.WORKOUT 
                   : formData.type === 'cardio' ? CALENDAR_SOURCES.CARDIO 
                   : CALENDAR_SOURCES.SPORT

      const calendarError = await createCalendarEventForEntity(source, {
        id: data.id,
        user_id: userId,
        title: formData.title,
        activity_type: formData.type === 'cardio' || formData.type === 'sports' ? formData.title : undefined,
        date: formData.startTime,
        notes: formData.type === 'sports' ? undefined : formData.notes,
        performance_notes: formData.type === 'sports' ? formData.notes : undefined,
        end_time: formData.endTime && formData.endTime.trim() !== '' ? formData.endTime : null,
      });

      if (calendarError) {
        throw new Error('Failed to create calendar event.')
      }

      return { data, userId }
    },
    onSuccess: (data, variables) => {
      showSuccess('Planned workout created successfully!');
      
      // Invalidate calendar events query to trigger a refresh
      queryClient.invalidateQueries({ queryKey: ["events", data.userId] });
      
      // Reset form
      setTitle('');
      setStartTime('');
      setEndTime('');
      setNotes('');
      
      onSuccess?.();
    },
    onError: (error) => {
      showError(error.message);
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
