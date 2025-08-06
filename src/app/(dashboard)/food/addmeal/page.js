"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function AddMealPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
      return;
    }

    // Redirect to meals page with modal open
    if (user) {
      router.push('/food/meals?showAddModal=true');
    }
  }, [userLoading, user, router]);

  // Show loading spinner while redirecting
  return <LoadingSpinner />;
}
