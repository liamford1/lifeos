'use client';

import BackButton from '@/components/BackButton';

export default function FitnessHome() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">🏋️ Fitness Dashboard</h1>

      <ul className="space-y-3">
        <li>
          <a href="/fitness/workouts" className="text-blue-600 underline">
            🏋️‍♂️ Workouts (Weightlifting)
          </a>
        </li>
        <li>
          <a href="/fitness/cardio" className="text-blue-600 underline">
            🏃‍♂️ Cardio Logs
          </a>
        </li>
        <li>
          <a href="/fitness/sports" className="text-blue-600 underline">
            🏀 Sports & Activities
          </a>
        </li>
        <li>
          <a href="/fitness/stretching" className="text-blue-600 underline">
            🧘 Stretching / Mobility
          </a>
        </li>
        <li>
          <a href="/fitness/activity" className="text-blue-600 underline">
            📱 Daily Activity (Steps, Mood, etc.)
          </a>
        </li>
      </ul>
    </main>
  );
}
