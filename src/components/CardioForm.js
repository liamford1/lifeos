'use client';

import { useState } from 'react';

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
      <input
        type="text"
        placeholder="Activity Type (e.g. Run, Hike)"
        value={activityType}
        onChange={(e) => setActivityType(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        placeholder="Duration (minutes)"
        value={duration}
        onChange={(e) => setDuration(e.target.value)}
        className="w-full p-2 border rounded"
        required
      />
      <input
        type="number"
        step="0.01"
        placeholder="Distance (miles)"
        value={distance}
        onChange={(e) => setDistance(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="w-full p-2 border rounded"
        rows={3}
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        ✅ Save Cardio Session
      </button>
    </form>
  );
}
