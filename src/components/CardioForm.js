'use client';

import { useState } from 'react';
import Button from '@/components/Button';

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
        <label className="block text-sm font-medium mb-1">Activity Type</label>
        <input
          type="text"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., Running, Cycling, Swimming"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full p-2 border rounded"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="30"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Distance (miles)</label>
          <input
            type="number"
            step="0.1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="3.1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., Central Park, Gym"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full p-2 border rounded"
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
