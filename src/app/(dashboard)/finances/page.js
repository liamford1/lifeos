'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import BackButton from '@/components/BackButton';
import Link from 'next/link';
import { Wallet, BarChart2, PlusCircle, Receipt, PiggyBank } from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import FinancesHomeContent from '@/components/FinancesHomeContent';

export default function FinancesHome(props) {
  return (
    <AuthGuard>
      <FinancesHomeContent {...props} />
    </AuthGuard>
  );
}
