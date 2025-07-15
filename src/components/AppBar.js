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

  // Fetch user profile data when user is available
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

  // Handle user logout and redirect
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  // Display user's full name if available, otherwise show email
  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : null;

  if (loading) return <LoadingSpinner />;

  return (
    // Main navigation bar with dark theme and shadow
    <nav className="flex items-center justify-between p-4 shadow bg-surface">
      {/* App title - clickable to navigate home */}
      <h1
        className="text-xl font-bold cursor-pointer text-base"
        onClick={() => router.push('/')}
      >
        Your Life Planner
      </h1>

      {/* Right side actions container */}
      <div className="flex items-center space-x-4">
        {/* Profile icon button - only show when user is logged in */}
        {user && (
          <Button
            onClick={() => router.push('/profile')}
            variant="ghost"
            size="sm"
            className="text-base hover:text-base p-0"
            aria-label="Profile"
          >
            <FaUserCircle size={24} />
          </Button>
        )}

        {/* User authentication section */}
        {user ? (
          <>
            {/* Display user name or email - hidden on mobile for space */}
            {displayName ? (
              <p className="text-sm hidden md:block text-base">
                {displayName}
              </p>
            ) : (
              <p className="text-sm hidden md:block text-base">
                Signed in as <strong>{user.email}</strong>
              </p>
            )}

            {/* Logout button */}
            <Button
              onClick={handleLogout}
              variant="danger"
              size="sm"
            >
              Log Out
            </Button>
          </>
        ) : (
          // Login link for unauthenticated users
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
