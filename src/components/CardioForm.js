'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { z } from 'zod';
import { mapZodErrors } from '@/lib/validationHelpers';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';
import BackButton from '@/components/BackButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { supabase } from '@/lib/supabaseClient';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/calendarUtils';

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
  const { showSuccess, showError } = useToast();
  const { user, loading: userLoading } = useUser();
  
  const [activity, setActivity] = useState(initialData?.activity_type || '');
  const [date, setDate] = useState(initialData?.date || '');
  const [duration, setDuration] = useState(initialData?.duration_minutes || '');
  const [distance, setDistance] = useState(initialData?.distance_miles || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setFieldErrors({});

    // Validate with Zod
    const result = cardioSchema.safeParse({
      activity,
      date,
      duration,
      distance,
      notes,
    });
    if (!result.success) {
      setFieldErrors(mapZodErrors(result.error));
      setLoading(false);
      return;
    }

    const cardioData = {
      activity_type: activity,
      date,
      duration_minutes: parseInt(duration),
      distance_miles: distance ? parseFloat(distance) : undefined,
      notes,
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
          showError('Calendar event update failed:', calendarError);
        }
        showSuccess("Cardio entry updated!");
        router.push(`/fitness/cardio/${initialData.id}`);
      } else {
        // Create new cardio entry
        const { data, error } = await supabase
          .from('fitness_cardio')
          .insert([{ ...cardioData, user_id: user.id }])
          .select()
          .single();
        if (error) throw error;
        showSuccess("Cardio entry created!");
        router.push('/fitness/cardio');
      }
    } catch (err) {
      showError(err.message || 'Failed to save cardio entry');
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">{isEdit ? '✏️ Edit Cardio Session' : '🏃‍♂️ Add Cardio Session'}</h1>
      <p className="text-base">{isEdit ? 'Update your cardio session details.' : 'Log a new cardio activity.'}</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <FormLabel>Activity Type</FormLabel>
          <FormInput
            type="text"
            value={activity}
            onChange={(e) => setActivity(e.target.value)}
            placeholder="e.g., Running, Cycling, Swimming"
            required
          />
          {fieldErrors.activity && <div className="text-red-400 text-xs mt-1">{fieldErrors.activity}</div>}
        </div>

        <div>
          <FormLabel>Date</FormLabel>
          <FormInput
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
          {fieldErrors.date && <div className="text-red-400 text-xs mt-1">{fieldErrors.date}</div>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Duration (minutes)</FormLabel>
            <FormInput
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="30"
              required
            />
            {fieldErrors.duration && <div className="text-red-400 text-xs mt-1">{fieldErrors.duration}</div>}
          </div>
          <div>
            <FormLabel>Distance (miles)</FormLabel>
            <FormInput
              type="number"
              step="0.1"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              placeholder="3.1"
            />
            {fieldErrors.distance && <div className="text-red-400 text-xs mt-1">{fieldErrors.distance}</div>}
          </div>
        </div>

        <div>
          <FormLabel>Notes</FormLabel>
          <FormTextarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="How did it feel? Any observations?"
          />
          {fieldErrors.notes && <div className="text-red-400 text-xs mt-1">{fieldErrors.notes}</div>}
        </div>

        <Button type="submit" variant="primary" className="w-full" disabled={loading}>
          {loading ? <LoadingSpinner size={20} /> : (isEdit ? 'Update Cardio Session' : 'Save Cardio Activity')}
        </Button>
      </form>
    </div>
  );
}
