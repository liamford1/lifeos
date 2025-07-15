'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function FoodHome() {
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
      <h1 className="text-2xl font-bold">🍽️ Food & Diet Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/food/inventory"
          className="block p-6 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          🥫 <span className="font-semibold">View Pantry</span>
          <p className="text-sm text-base mt-1">See what you have in stock</p>
        </Link>
        <Link
          href="/food/addreceipt"
          className="block p-6 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          ➕ <span className="font-semibold">Add Pantry Item</span>
          <p className="text-sm text-base mt-1">Manually add or scan items</p>
        </Link>
        <Link
          href="/food/meals"
          className="block p-6 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          📖 <span className="font-semibold">View Meals</span>
          <p className="text-sm text-base mt-1">Browse your saved meals</p>
        </Link>
        <Link
          href="/food/addmeal"
          className="block p-6 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          ➕ <span className="font-semibold">Add a Meal</span>
          <p className="text-sm text-base mt-1">Create a new meal manually</p>
        </Link>
        <Link
          href="/food/planner"
          className="block p-6 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          🗓️ <span className="font-semibold">Plan Meals</span>
          <p className="text-sm text-base mt-1">Schedule meals for the week</p>
        </Link>
      </div>
    </div>
  );
}
