'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { z } from 'zod';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import FormField from '@/components/shared/FormField';
import BackButton from '@/components/shared/BackButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useApiError } from '@/lib/hooks/useApiError';
import { supabase } from '@/lib/supabaseClient';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/utils/calendarUtils';
import { useFormValidation } from '@/lib/hooks/useFormValidation';

const cardioSchema = z.object({
  activity: z.string().min(1, 'Activity is required'),
  date: z.string().min(1, 'Date is required'),
  duration: z.union([
    z.string().min(1, 'Duration is required'),
    z.number()
  ]),
  distance: z.union([
    z.string(),
    z.number()
  ]).optional(),
  notes: z.string().optional(),
});

export default function CardioForm({ initialData = null, isEdit = false }) {
  const router = useRouter();
  const { handleError, handleSuccess } = useApiError();
  const { user, loading: userLoading } = useUser();
  
  const [activity, setActivity] = useState(initialData?.activity_type || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [duration, setDuration] = useState(initialData?.duration_minutes || '');
  const [distance, setDistance] = useState(initialData?.distance_miles || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleFormSubmit = async (formData) => {
    const cardioData = {
      activity_type: formData.activity,
      date: formData.date,
      duration_minutes: parseInt(formData.duration),
      distance_miles: formData.distance ? parseFloat(formData.distance) : undefined,
      notes: formData.notes,
    };

    try {
      if (isEdit) {
        // Update existing cardio entry
        const { error } = await supabase
          .from('fitness_cardio')
          .update(cardioData)
          .eq('id', initialData.id);
        if (error) throw error;

        // Update linked calendar event
        const calendarError = await updateCalendarEventFromSource(
          CALENDAR_SOURCES.CARDIO,
          initialData.id,
          {
            title: `Cardio: ${cardioData.activity_type}`,
            start_time: cardioData.date ? new Date(cardioData.date).toISOString() : undefined,
            description: cardioData.notes || null,
          }
        );
        if (calendarError) {
          handleError(calendarError, { 
            customMessage: 'Calendar event update failed' 
          });
        }
        handleSuccess("Cardio entry updated!");
        router.push(`/fitness`);
      } else {
        // Create new cardio entry
        const { data, error } = await supabase
          .from('fitness_cardio')
          .insert([{ ...cardioData, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;

        handleSuccess("Cardio entry created!");
        router.push(`/fitness`);
      }
    } catch (err) {
      handleError(err, { 
        customMessage: 'Failed to save cardio entry' 
      });
    }
  };

  const {
    fieldErrors,
    isSubmitting,
    handleSubmit,
    getFieldError,
  } = useFormValidation(cardioSchema, handleFormSubmit);

  const onSubmitHandler = (e) => {
    const formData = {
      activity,
      date,
      duration,
      distance,
      notes,
    };
    handleSubmit(e, formData);
  };

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">{isEdit ? '✏️ Edit Cardio Session' : '🏃‍♂️ Add Cardio Session'}</h1>
      <p className="text-base">{isEdit ? 'Update your cardio session details.' : 'Log a new cardio activity.'}</p>
      
      <form onSubmit={onSubmitHandler} className="space-y-4">
        <FormField 
          label="Activity Type" 
          error={getFieldError('activity')}
          required
        >
          <FormInput
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g., Running, Cycling, Swimming"
            disabled={isSubmitting}
          />
        </FormField>

        <FormField 
          label="Date" 
          error={getFieldError('date')}
          required
        >
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSubmitting}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField 
            label="Duration (minutes)" 
            error={getFieldError('duration')}
            required
          >
            <FormInput
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              disabled={isSubmitting}
            />
          </FormField>
          
          <FormField 
            label="Distance (miles)" 
            error={getFieldError('distance')}
          >
            <FormInput
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="3.1"
              disabled={isSubmitting}
            />
          </FormField>
        </div>

        <FormField 
          label="Notes" 
          error={getFieldError('notes')}
        >
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How did it feel? Any observations?"
            disabled={isSubmitting}
          />
        </FormField>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? <LoadingSpinner size={20} /> : (isEdit ? 'Update Cardio Session' : 'Save Cardio Activity')}
        </Button>
      </form>
    </div>
  );
}
