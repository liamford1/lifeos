'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';

export default function FoodDashboard() {
  return (
    <>
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">🍽️ Food & Diet Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/food/inventory"
          className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
        >
          🧺 <span className="font-semibold">View Pantry</span>
          <p className="text-sm text-gray-300 mt-1">See what you have in stock</p>
        </Link>

        <Link
          href="/food/addreceipt"
          className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
        >
          ➕ <span className="font-semibold">Add Pantry Item</span>
          <p className="text-sm text-gray-300 mt-1">Manually add or scan items</p>
        </Link>

        <Link
          href="/food/meals"
          className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
        >
          📖 <span className="font-semibold">View Meals</span>
          <p className="text-sm text-gray-300 mt-1">Browse your saved meals</p>
        </Link>

        <Link
          href="/food/addmeal"
          className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
        >
          ➕ <span className="font-semibold">Add a Meal</span>
          <p className="text-sm text-gray-300 mt-1">Create a new meal manually</p>
        </Link>

        <Link
          href="/food/planner"
          className="block p-6 bg-gray-700 rounded shadow hover:bg-gray-600 transition"
        >
          🗓️ <span className="font-semibold">Plan Meals</span>
          <p className="text-sm text-gray-300 mt-1">Schedule meals for the week</p>
        </Link>
      </div>
    </>
  );
}
