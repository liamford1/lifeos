'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { Wallet, BarChart2, PlusCircle, Receipt, PiggyBank } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';

export function FinancesHomeContent() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Wallet className="w-5 h-5 text-base align-text-bottom" />
        Finances Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/finances/expenses"
          className="block p-5 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          <BarChart2 className="w-5 h-5 text-base align-text-bottom mr-2" />
          <span className="font-semibold">View Expenses</span>
          <div className="text-sm text-base">See all your expense records</div>
        </Link>

        <Link
          href="/finances/add"
          className="block p-5 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          <PlusCircle className="w-5 h-5 text-base align-text-bottom mr-2" />
          <span className="font-semibold">Add Expense</span>
          <div className="text-sm text-base">Record a new expense</div>
        </Link>

        <Link
          href="/finances/receipts"
          className="block p-5 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          <Receipt className="w-5 h-5 text-base align-text-bottom mr-2" />
          <span className="font-semibold">Upload Receipt</span>
          <div className="text-sm text-base">Coming Soon</div>
        </Link>

        <Link
          href="/finances/budget"
          className="block p-5 bg-surface rounded shadow hover:bg-[#2e2e2e] transition"
        >
          <PiggyBank className="w-5 h-5 text-base align-text-bottom mr-2" />
          <span className="font-semibold">Budget & Goals</span>
          <div className="text-sm text-base">Coming Soon</div>
        </Link>
      </div>
    </div>
  );
}

export default function FinancesHome(props) {
  return (
    <AuthGuard>
      <FinancesHomeContent {...props} />
    </AuthGuard>
  );
}
