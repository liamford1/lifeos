'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { CalendarIconClient as CalendarIcon } from "@/components/client/CalendarIconClient";
import AuthGuard from '@/components/client/AuthGuard';
import FitnessHomeContent from '@/components/FitnessHomeContent';

export default function FitnessHome(props) {
  return (
    <AuthGuard>
      <FitnessHomeContent {...props} />
    </AuthGuard>
  );
}
