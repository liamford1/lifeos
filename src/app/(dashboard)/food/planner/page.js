"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MealPlannerPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to food page since planning is now done via modal
    router.push('/food');
  }, [router]);

  return null;
}
