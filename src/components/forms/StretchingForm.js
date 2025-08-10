'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { z } from 'zod';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import FormSelect from '@/components/shared/FormSelect';
import FormField from '@/components/shared/FormField';
import BackButton from '@/components/shared/BackButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useApiError } from '@/lib/hooks/useApiError';
import { supabase } from '@/lib/supabaseClient';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/utils/calendarUtils';
import { useFormValidation } from '@/lib/hooks/useFormValidation';

const stretchingSchema = z.object({
  session_type: z.string().min(1, 'Session type is required'),
  date: z.string().min(1, 'Date is required'),
  duration: z.union([
    z.string().min(1, 'Duration is required'),
    z.number()
  ]),
  intensity_level: z.string().min(1, 'Intensity level is required'),
  body_parts: z.string().optional(),
  notes: z.string().optional(),
});

export default function StretchingForm({ initialData = null, isEdit = false, onSuccess }) {
  const router = useRouter();
  const { handleError, handleSuccess } = useApiError();
  const { user, loading: userLoading } = useUser();
  
  const [sessionType, setSessionType] = useState(initialData?.session_type || 'Full Body');
  const [date, setDate] = useState(initialData?.date || '');
  const [duration, setDuration] = useState(initialData?.duration_minutes || '');
  const [intensityLevel, setIntensityLevel] = useState(initialData?.intensity_level || 'Moderate');
  const [bodyParts, setBodyParts] = useState(initialData?.body_parts || '');
  const [notes, setNotes] = useState(initialData?.notes || '');

  const handleFormSubmit = async (formData) => {
    const stretchingData = {
      session_type: formData.session_type,
      date: formData.date,
      duration_minutes: parseInt(formData.duration),
      intensity_level: formData.intensity_level,
      body_parts: formData.body_parts || null,
      notes: formData.notes || null,
    };

    try {
      if (isEdit) {
        // Update existing stretching entry
        const { error } = await supabase
          .from('fitness_stretching')
          .update(stretchingData)
          .eq('id', initialData.id);
        if (error) throw error;

        // Update linked calendar event
        const calendarError = await updateCalendarEventFromSource(
          CALENDAR_SOURCES.STRETCHING,
          initialData.id,
          {
            title: `Stretching: ${stretchingData.session_type}`,
            start_time: stretchingData.date ? new Date(stretchingData.date).toISOString() : undefined,
            description: stretchingData.notes || null,
          }
        );
        if (calendarError) {
          handleError(calendarError, { 
            customMessage: 'Calendar event update failed' 
          });
        }
        handleSuccess("Stretching entry updated!");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/fitness`);
        }
      } else {
        // Create new stretching entry
        const { data, error } = await supabase
          .from('fitness_stretching')
          .insert([{ ...stretchingData, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;

        handleSuccess("Stretching entry created!");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/fitness`);
        }
      }
    } catch (err) {
      handleError(err, { 
        customMessage: 'Failed to save stretching entry' 
      });
    }
  };

  const {
    fieldErrors,
    isSubmitting,
    handleSubmit,
    getFieldError,
  } = useFormValidation(stretchingSchema, handleFormSubmit);

  const onSubmitHandler = (e) => {
    const formData = {
      session_type: sessionType,
      date,
      duration,
      intensity_level: intensityLevel,
      body_parts: bodyParts,
      notes,
    };
    handleSubmit(e, formData);
  };

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{isEdit ? '✏️ Edit Stretching Session' : '🧘‍♀️ Add Stretching Session'}</h1>
      <p className="text-base">{isEdit ? 'Update your stretching session details.' : 'Log a new stretching activity.'}</p>
      
      <form onSubmit={onSubmitHandler} className="space-y-4">
        <FormField 
          label="Session Type" 
          error={getFieldError('session_type')}
          required
        >
          <FormSelect
            value={sessionType}
            onChange={(e) => setSessionType(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="Full Body">Full Body</option>
            <option value="Upper Body">Upper Body</option>
            <option value="Lower Body">Lower Body</option>
            <option value="Yoga">Yoga</option>
            <option value="Mobility">Mobility</option>
            <option value="Recovery">Recovery</option>
          </FormSelect>
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
            label="Intensity Level" 
            error={getFieldError('intensity_level')}
            required
          >
            <FormSelect
              value={intensityLevel}
              onChange={(e) => setIntensityLevel(e.target.value)}
              disabled={isSubmitting}
            >
              <option value="Light">Light</option>
              <option value="Moderate">Moderate</option>
              <option value="Deep">Deep</option>
            </FormSelect>
          </FormField>
        </div>

        <FormField 
          label="Body Parts (optional)" 
          error={getFieldError('body_parts')}
        >
          <FormInput
            type="text"
            value={bodyParts}
            onChange={(e) => setBodyParts(e.target.value)}
            placeholder="e.g. Hamstrings, Shoulders, Lower Back"
            disabled={isSubmitting}
          />
        </FormField>

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
          {isSubmitting ? <LoadingSpinner size={20} /> : (isEdit ? 'Update Stretching Session' : 'Save Stretching Activity')}
        </Button>
      </form>
    </div>
  );
}
