'use client';

import BackButton from '@/components/BackButton';

export default function FoodDashboard() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">🍽️ Food & Diet Dashboard</h1>

      <ul className="space-y-3">
        <li>
          <a href="/food/inventory" className="text-blue-600 underline">
            🧺 View Pantry
          </a>
        </li>
        <li>
          <a href="/food/addreceipt" className="text-blue-600 underline">
            ➕ Add Pantry Item
          </a>
        </li>
        <li>
          <a href="/food/meals" className="text-blue-600 underline">
            📖 View Meals
          </a>
        </li>
        <li>
          <a href="/food/addmeal" className="text-blue-600 underline">
            ➕ Add a Meal
          </a>
        </li>
        <li>
          <a href="/food/planner" className="text-blue-600 underline">
            🗓️ Plan Meals
          </a>
        </li>
      </ul>
    </main>
  );
}
