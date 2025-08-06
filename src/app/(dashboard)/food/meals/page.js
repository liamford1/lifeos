"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';

export default function MealsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
      return;
    }

    // Check if we need to show the add meal modal
    if (searchParams.get('showAddModal') === 'true') {
      // Redirect to food dashboard with modal open
      router.push('/food?showAddMealModal=true');
    } else {
      // Redirect to food dashboard with meals modal open
      router.push('/food?showMealsModal=true');
    }
  }, [userLoading, user, router, searchParams]);

  // Show loading spinner while redirecting
  return <LoadingSpinner />;
}
