'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import FormLabel from '@/components/FormLabel';
import FormInput from '@/components/FormInput';
import FormTextarea from '@/components/FormTextarea';

export default function CardioForm({ initialData = {}, onSubmit }) {
  const [activityType, setActivityType] = useState(initialData.activity_type || '');
  const [date, setDate] = useState(initialData.date || '');
  const [duration, setDuration] = useState(initialData.duration_minutes || '');
  const [distance, setDistance] = useState(initialData.distance_miles || '');
  const [location, setLocation] = useState(initialData.location || '');
  const [notes, setNotes] = useState(initialData.notes || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      activity_type: activityType,
      date,
      duration_minutes: parseInt(duration),
      distance_miles: parseFloat(distance),
      location,
      notes,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <FormLabel>Activity Type</FormLabel>
        <FormInput
          type="text"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          placeholder="e.g., Running, Cycling, Swimming"
          required
        />
      </div>

      <div>
        <FormLabel>Date</FormLabel>
        <FormInput
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
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
        </div>
      </div>

      <div>
        <FormLabel>Location</FormLabel>
        <FormInput
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g., Central Park, Gym"
        />
      </div>

      <div>
        <FormLabel>Notes</FormLabel>
        <FormTextarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="How did it feel? Any observations?"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Save Cardio Activity
      </Button>
    </form>
  );
}
