'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';

export default function FinancesHome() {
  return (
    <>
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">💸 Finances Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          href="/finances/expenses"
          className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition"
        >
          📊 <span className="font-semibold">View Expenses</span>
          <div className="text-sm text-gray-400">See all your expense records</div>
        </Link>

        <Link
          href="/finances/add"
          className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition"
        >
          ➕ <span className="font-semibold">Add Expense</span>
          <div className="text-sm text-gray-400">Record a new expense</div>
        </Link>

        <Link
          href="/finances/receipts"
          className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition"
        >
          🧾 <span className="font-semibold">Upload Receipt</span>
          <div className="text-sm text-gray-400">Coming Soon</div>
        </Link>

        <Link
          href="/finances/budget"
          className="block p-5 bg-gray-800 rounded shadow hover:bg-gray-700 transition"
        >
          📈 <span className="font-semibold">Budget & Goals</span>
          <div className="text-sm text-gray-400">Coming Soon</div>
        </Link>
      </div>
    </>
  );
}
