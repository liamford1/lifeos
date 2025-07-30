'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function BudgetPage() {
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
      <h1 className="text-2xl font-bold">📈 Budget & Goals</h1>
      <p className="text-base">Set budgets and track financial goals.</p>
      <p className="text-base">Budget & Goals coming soon.</p>
    </div>
  );
}
