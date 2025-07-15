'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import CalendarView from '@/components/CalendarView';

export default function Home() {
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
      <h1 className="text-2xl font-bold">📅 Your Life Planner</h1>
      <div className='bg-surface text-base border border-default p-4 rounded-lg'>
        <p>This should be dark gray background, light text, and a subtle border. If it looks off, theme classes are still broken.</p>
      </div>
      <CalendarView />
    </div>
  );
} 