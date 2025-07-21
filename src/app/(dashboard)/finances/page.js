'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import dynamic from "next/dynamic";
const Wallet = dynamic(() => import("lucide-react").then(m => m.Wallet), { ssr: false });
const BarChart2 = dynamic(() => import("lucide-react").then(m => m.BarChart2), { ssr: false });
const PlusCircle = dynamic(() => import("lucide-react").then(m => m.PlusCircle), { ssr: false });
const Receipt = dynamic(() => import("lucide-react").then(m => m.Receipt), { ssr: false });
const PiggyBank = dynamic(() => import("lucide-react").then(m => m.PiggyBank), { ssr: false });
import AuthGuard from '@/components/AuthGuard';
import FinancesHomeContent from '@/components/FinancesHomeContent';

export default function FinancesHome(props) {
  return (
    <AuthGuard>
      <FinancesHomeContent {...props} />
    </AuthGuard>
  );
}
