'use client';

import BackButton from '@/components/BackButton';

export default function FinancesHome() {
  return (
    <main className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">💸 Finances Dashboard</h1>

      <ul className="space-y-3">
        <li>
          <a href="/finances/expenses" className="text-blue-600 underline">
            📊 View All Expenses
          </a>
        </li>
        <li>
          <a href="/finances/add" className="text-blue-600 underline">
            ➕ Add a New Expense
          </a>
        </li>
        <li>
          <a href="/finances/receipts" className="text-blue-600 underline">
            🧾 Upload Receipt (Coming Soon)
          </a>
        </li>
        <li>
          <a href="/finances/budget" className="text-blue-600 underline">
            📈 Budget & Goals (Coming Soon)
          </a>
        </li>
      </ul>
    </main>
  );
}
