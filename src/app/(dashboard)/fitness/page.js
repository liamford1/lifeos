'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function FitnessHome() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">🏋️ Fitness Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/fitness/workouts" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🏋️‍♂️ <span className="font-semibold">Workouts</span>
          <div className="text-sm text-gray-400">Weightlifting sessions</div>
        </Link>
        <Link href="/fitness/cardio" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🏃‍♂️ <span className="font-semibold">Cardio Logs</span>
          <div className="text-sm text-gray-400">Runs, biking, rowing, etc.</div>
        </Link>
        <Link href="/fitness/sports" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🏀 <span className="font-semibold">Sports & Activities</span>
          <div className="text-sm text-gray-400">Games, hikes, other active things</div>
        </Link>
        <Link href="/fitness/stretching" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          🧘 <span className="font-semibold">Stretching / Mobility</span>
          <div className="text-sm text-gray-400">Yoga, rehab, cooldowns</div>
        </Link>
        <Link href="/fitness/activity" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          📱 <span className="font-semibold">Daily Activity</span>
          <div className="text-sm text-gray-400">Steps, mood, energy</div>
        </Link>
        <Link href="/fitness/planner" className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition">
          📅 <span className="font-semibold">Plan Workouts</span>
          <div className="text-sm text-gray-400">Schedule fitness sessions</div>
        </Link>
      </div>
    </div>
  );
}
