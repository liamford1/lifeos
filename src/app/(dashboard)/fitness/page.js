'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Activity, Goal, Timer, StretchHorizontal, HeartPulse, Dumbbell, CalendarDays } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import FitnessHomeContent from '@/components/FitnessHomeContent';

export default function FitnessHome(props) {
  return (
    <AuthGuard>
      <FitnessHomeContent {...props} />
    </AuthGuard>
  );
}
