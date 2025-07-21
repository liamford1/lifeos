'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from "next/dynamic";
const Activity = dynamic(() => import("lucide-react").then(m => m.Activity), { ssr: false });
const Goal = dynamic(() => import("lucide-react").then(m => m.Goal), { ssr: false });
const Timer = dynamic(() => import("lucide-react").then(m => m.Timer), { ssr: false });
const StretchHorizontal = dynamic(() => import("lucide-react").then(m => m.StretchHorizontal), { ssr: false });
const HeartPulse = dynamic(() => import("lucide-react").then(m => m.HeartPulse), { ssr: false });
const Dumbbell = dynamic(() => import("lucide-react").then(m => m.Dumbbell), { ssr: false });
const CalendarDays = dynamic(() => import("lucide-react").then(m => m.CalendarDays), { ssr: false });
import AuthGuard from '@/components/AuthGuard';
import FitnessHomeContent from '@/components/FitnessHomeContent';

export default function FitnessHome(props) {
  return (
    <AuthGuard>
      <FitnessHomeContent {...props} />
    </AuthGuard>
  );
}
