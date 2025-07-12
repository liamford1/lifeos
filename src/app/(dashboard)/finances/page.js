'use client';

import BackButton from '@/components/BackButton';
import Link from 'next/link';

export default function FinancesHome() {
  return (
    <>
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">💸 Finances Dashboard</h1>

      <ul className="space-y-3">
        <li>
          <Link href="/finances/expenses" className="text-blue-600 underline">
            📊 View All Expenses
          </Link>
        </li>
        <li>
          <Link href="/finances/add" className="text-blue-600 underline">
            ➕ Add a New Expense
          </Link>
        </li>
        <li>
          <Link href="/finances/receipts" className="text-blue-600 underline">
            🧾 Upload Receipt (Coming Soon)
          </Link>
        </li>
        <li>
          <Link href="/finances/budget" className="text-blue-600 underline">
            📈 Budget & Goals (Coming Soon)
          </Link>
        </li>
      </ul>
    </>
  );
}
