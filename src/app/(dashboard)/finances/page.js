"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import dynamic from "next/dynamic";
const Wallet = dynamic(() => import("lucide-react/dist/esm/icons/wallet"), { ssr: false });
const BarChart2 = dynamic(() => import("lucide-react/dist/esm/icons/bar-chart-2"), { ssr: false });
const PlusCircle = dynamic(() => import("lucide-react/dist/esm/icons/plus-circle"), { ssr: false });
const Receipt = dynamic(() => import("lucide-react/dist/esm/icons/receipt"), { ssr: false });
const PiggyBank = dynamic(() => import("lucide-react/dist/esm/icons/piggy-bank"), { ssr: false });
import AuthGuard from '@/components/AuthGuard';
import FinancesHomeContent from '@/components/FinancesHomeContent';

export default function FinancesHome(props) {
  return (
    <AuthGuard>
      <FinancesHomeContent {...props} />
    </AuthGuard>
  );
}
