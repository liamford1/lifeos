'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CalendarIconClient as CalendarIcon } from "@/components/client/CalendarIconClient";
import AuthGuard from '@/components/client/AuthGuard';
import dynamic from 'next/dynamic';

// Dynamic import for the heavy FitnessHomeContent component
const FitnessHomeContent = dynamic(() => import('@/components/FitnessHomeContent'), {
  loading: () => (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-muted-foreground">Loading fitness dashboard...</p>
      </div>
    </div>
  ),
  ssr: false
});

export default function FitnessHome(props) {
  return (
    <AuthGuard>
      <FitnessHomeContent {...props} />
    </AuthGuard>
  );
}
