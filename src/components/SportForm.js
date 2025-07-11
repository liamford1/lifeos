'use client';

import { useState } from 'react';

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
      <input
        type="text"
        placeholder="Activity Type (e.g. Basketball, Skiing)"
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
      />
      <select
        value={intensity}
        onChange={(e) => setIntensity(e.target.value)}
        className="w-full p-2 border rounded"
      >
        <option value="">Intensity Level</option>
        <option value="Light">Light</option>
        <option value="Moderate">Moderate</option>
        <option value="Intense">Intense</option>
      </select>
      <input
        type="text"
        placeholder="Location (optional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Weather (optional)"
        value={weather}
        onChange={(e) => setWeather(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Participants (optional)"
        value={participants}
        onChange={(e) => setParticipants(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Score (optional)"
        value={score}
        onChange={(e) => setScore(e.target.value)}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Performance Notes (optional)"
        value={performanceNotes}
        onChange={(e) => setPerformanceNotes(e.target.value)}
        className="w-full p-2 border rounded"
        rows={3}
      />
      <textarea
        placeholder="Injuries or Flags (optional)"
        value={flags}
        onChange={(e) => setFlags(e.target.value)}
        className="w-full p-2 border rounded"
        rows={2}
      />

      <button
        type="submit"
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
      >
        ✅ Save Sport Session
      </button>
    </form>
  );
}
