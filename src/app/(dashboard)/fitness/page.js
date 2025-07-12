'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';

export default function FitnessHome() {
  return (
    <>
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">🏋️ Fitness Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/fitness/workouts" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🏋️‍♂️ <span className="font-semibold">Workouts</span> <div className="text-sm text-gray-400">Weightlifting sessions</div>
        </Link>

        <Link href="/fitness/cardio" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🏃‍♂️ <span className="font-semibold">Cardio Logs</span> <div className="text-sm text-gray-400">Runs, biking, rowing, etc.</div>
        </Link>

        <Link href="/fitness/sports" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🏀 <span className="font-semibold">Sports & Activities</span> <div className="text-sm text-gray-400">Games, hikes, other active things</div>
        </Link>

        <Link href="/fitness/stretching" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🧘 <span className="font-semibold">Stretching / Mobility</span> <div className="text-sm text-gray-400">Yoga, rehab, cooldowns</div>
        </Link>

        <Link href="/fitness/activity" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          📱 <span className="font-semibold">Daily Activity</span> <div className="text-sm text-gray-400">Steps, mood, energy</div>
        </Link>

        <Link href="/fitness/planner" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          📅 <span className="font-semibold">Plan Workouts</span> <div className="text-sm text-gray-400">Schedule fitness sessions</div>
        </Link>
      </div>
    </>
  );
}
