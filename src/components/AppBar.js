'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { FaUserCircle } from 'react-icons/fa';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';

export default function AppBar() {
  const { user, loading } = useUser();
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getProfile = async () => {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    };
    getProfile();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : null;

  if (loading) return <LoadingSpinner />;

  return (
    <nav className="flex items-center justify-between p-4 shadow bg-gray-800">
      <h1
        className="text-xl font-bold cursor-pointer text-gray-100"
        onClick={() => router.push('/')}
      >
        Your Life Planner
      </h1>

      <div className="flex items-center space-x-4">
        {user && (
          <Button
            onClick={() => router.push('/profile')}
            variant="ghost"
            size="sm"
            className="text-gray-100 hover:text-gray-300 p-0"
          >
            <FaUserCircle size={24} />
          </Button>
        )}

        {user ? (
          <>
            {displayName ? (
              <p className="text-sm hidden md:block text-gray-100">
                {displayName}
              </p>
            ) : (
              <p className="text-sm hidden md:block text-gray-100">
                Signed in as <strong>{user.email}</strong>
              </p>
            )}

            <Button
              onClick={handleLogout}
              variant="danger"
              size="sm"
            >
              Log Out
            </Button>
          </>
        ) : (
          <Link href="/auth">
            <Button variant="primary" size="sm">
              Log In
            </Button>
          </Link>
        )}
      </div>
    </nav>
  );
}
