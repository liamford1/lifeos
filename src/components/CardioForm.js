'use client';

import React from 'react';
import { useState } from 'react';
import { z } from 'zod';
import { mapZodErrors } from '@/lib/validationHelpers';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';

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

export default function CardioForm({ initialData = {}, onSubmit }) {
  const [activity, setActivity] = useState(initialData.activity_type || '');
  const [date, setDate] = useState(initialData.date || '');
  const [duration, setDuration] = useState(initialData.duration_minutes || '');
  const [distance, setDistance] = useState(initialData.distance_miles || '');
  const [notes, setNotes] = useState(initialData.notes || '');
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

    onSubmit({
      activity_type: activity,
      date,
      duration_minutes: parseInt(duration),
      distance_miles: distance ? parseFloat(distance) : undefined,
      notes,
    });
    setLoading(false);
  };

  return (
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
        {loading ? 'Saving...' : 'Save Cardio Activity'}
      </Button>
    </form>
  );
}
