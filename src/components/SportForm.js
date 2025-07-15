'use client';

import { useState } from 'react';
import Button from '@/components/Button';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
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
      calories_burned: null, // reserved for AI estimation
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Sport/Activity</label>
        <input
          type="text"
          value={activityType}
          onChange={(e) => setActivityType(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., Basketball, Tennis, Soccer"
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
            placeholder="60"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Intensity Level</label>
          <select
            value={intensity}
            onChange={(e) => setIntensity(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select intensity</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Location</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., Local Gym, Park"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Weather</label>
          <input
            type="text"
            value={weather}
            onChange={(e) => setWeather(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Sunny, Rainy"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Participants</label>
          <input
            type="text"
            value={participants}
            onChange={(e) => setParticipants(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="e.g., Team, Solo, 2v2"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Score/Result</label>
        <input
          type="text"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., Won 21-15, 3 sets"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Performance Notes</label>
        <textarea
          value={performanceNotes}
          onChange={(e) => setPerformanceNotes(e.target.value)}
          className="w-full p-2 border rounded"
          rows={3}
          placeholder="How did you perform? What went well?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Injuries/Flags</label>
        <textarea
          value={flags}
          onChange={(e) => setFlags(e.target.value)}
          className="w-full p-2 border rounded"
          rows={2}
          placeholder="Any injuries, pain, or concerns?"
        />
      </div>

      <Button type="submit" variant="primary" className="w-full">
        Save Sport Activity
      </Button>
    </form>
  );
}
