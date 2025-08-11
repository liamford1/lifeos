'use client';

import React, { useState } from 'react';
import { z } from 'zod';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormSelect from '@/components/shared/FormSelect';
import FormTextarea from '@/components/shared/FormTextarea';
import FormField from '@/components/shared/FormField';
import { useFormValidation } from '@/lib/hooks/useFormValidation';

// Zod schema for sport form validation
const sportSchema = z.object({
  activity_type: z.string().min(1, 'Sport/Activity is required'),
  date: z.string().min(1, 'Date is required'),
  duration_minutes: z.union([
    z.string().min(1, 'Duration is required'),
    z.number()
  ]),
  intensity_level: z.string().min(1, 'Intensity level is required'),
  location: z.string().optional(),
  weather: z.string().optional(),
  participants: z.string().optional(),
  score: z.string().optional(),
  performance_notes: z.string().optional(),
  injuries_or_flags: z.string().optional(),
});

export default function SportForm({ initialData = {}, onSubmit }) {
  const [activityType, setActivityType] = useState(initialData.activity_type || '');
  const [date, setDate] = useState(initialData.date || '');
  const [duration, setDuration] = useState(initialData.duration_minutes || '');
  const [intensity, setIntensity] = useState(initialData.intensity_level || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [weather, setWeather] = useState(initialData.weather || '');
  const [participants, setParticipants] = useState(initialData.participants || '');
  const [score, setScore] = useState(initialData.score || '');
  const [performanceNotes, setPerformanceNotes] = useState(initialData.performance_notes || '');
  const [flags, setFlags] = useState(initialData.injuries_or_flags || '');

  const handleFormSubmit = (formData) => {
    onSubmit({
      ...formData,
      calories_burned: null, // reserved for AI estimation
    });
    // TODO: Provide accurate start_time and end_time if available
    // import { createCalendarEventForEntity } from '@/lib/utils/calendarUtils';
    // await createCalendarEventForEntity('sport', /* newEntry.id */, /* user.id */, /* start_time */, /* end_time */);
  };

  const {
    fieldErrors,
    isSubmitting,
    handleSubmit,
    getFieldError,
  } = useFormValidation(sportSchema, handleFormSubmit);

  const onSubmitHandler = (e) => {
    const formData = {
      activity_type: activityType,
      date,
      duration_minutes: parseInt(duration),
      intensity_level: intensity,
      location,
      weather,
      participants,
      score,
      performance_notes: performanceNotes,
      injuries_or_flags: flags,
    };
    handleSubmit(e, formData);
  };

  return (
    <form onSubmit={onSubmitHandler} className="space-y-4">
      <FormField 
        label="Sport/Activity" 
        error={getFieldError('activity_type')}
        required
      >
        <FormInput
          type="text"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          placeholder="e.g., Basketball, Tennis, Soccer"
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
          error={getFieldError('duration_minutes')}
          required
        >
          <FormInput
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="60"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField 
          label="Intensity Level" 
          error={getFieldError('intensity_level')}
          required
        >
          <FormSelect
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            disabled={isSubmitting}
          >
            <option value="">Select intensity</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </FormSelect>
        </FormField>
      </div>

      <FormField 
        label="Location" 
        error={getFieldError('location')}
      >
        <FormInput
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Local Gym, Park"
          disabled={isSubmitting}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-4">
        <FormField 
          label="Weather" 
          error={getFieldError('weather')}
        >
          <FormInput
            type="text"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            placeholder="e.g., Sunny, Rainy"
            disabled={isSubmitting}
          />
        </FormField>
        
        <FormField 
          label="Participants" 
          error={getFieldError('participants')}
        >
          <FormInput
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            placeholder="e.g., Team, Solo, 2v2"
            disabled={isSubmitting}
          />
        </FormField>
      </div>

      <FormField 
        label="Score/Result" 
        error={getFieldError('score')}
      >
        <FormInput
          type="text"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="e.g., Won 21-15, 3 sets"
          disabled={isSubmitting}
        />
      </FormField>

      <FormField 
        label="Performance Notes" 
        error={getFieldError('performance_notes')}
      >
        <FormTextarea
          value={performanceNotes}
          onChange={(e) => setPerformanceNotes(e.target.value)}
          rows={3}
          placeholder="How did you perform? What went well?"
          disabled={isSubmitting}
        />
      </FormField>

      <FormField 
        label="Injuries/Flags" 
        error={getFieldError('injuries_or_flags')}
      >
        <FormTextarea
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          rows={2}
          placeholder="Any injuries, pain, or concerns?"
          disabled={isSubmitting}
        />
      </FormField>

      <Button 
        type="submit" 
        variant="primary" 
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Saving...' : 'Save Sport Activity'}
      </Button>
    </form>
  );
}
