'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function FinancesLayout({ children }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth'); // 🔐 Redirect if not logged in
      } else {
        setUser(user);
        setLoading(false);
      }
    };
    getUser();
  }, [router]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return <>{children}</>;
}
