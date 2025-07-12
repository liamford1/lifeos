'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { FaUserCircle } from 'react-icons/fa';

export default function AppBar() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const getUserAndProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .single();

        if (!error && data) {
          setProfile(data);
        }
      }
    };

    getUserAndProfile();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    router.refresh();
  };

  // Compose display name or fallback
  const displayName = profile?.first_name && profile?.last_name
    ? `${profile.first_name} ${profile.last_name}`
    : null;

  return (
    <nav
      className="flex items-center justify-between p-4 shadow"
      style={{ backgroundColor: '#202123' }}
    >
      <h1
        className="text-xl font-bold cursor-pointer"
        onClick={() => router.push('/')}
        style={{ color: '#e6e6e6' }}
      >
        Your Life Planner
      </h1>

      <div className="flex items-center space-x-4">
        {user && (
          <button
            onClick={() => router.push('/profile')}
            aria-label="Profile"
            className="hover:text-gray-300"
            style={{ color: '#e6e6e6' }}
          >
            <FaUserCircle size={24} />
          </button>
        )}

        {user ? (
          <>
            {displayName ? (
              <p
                className="text-sm hidden md:block"
                style={{ color: '#e6e6e6' }}
              >
                {displayName}
              </p>
            ) : (
              <p
                className="text-sm hidden md:block"
                style={{ color: '#e6e6e6' }}
              >
                Signed in as <strong>{user.email}</strong>
              </p>
            )}

            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded hover:bg-red-600"
              style={{ backgroundColor: '#ff4b5c', color: 'white' }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ff3140'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ff4b5c'}
            >
              Log Out
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className="px-3 py-1 rounded hover:bg-blue-700"
            style={{ backgroundColor: '#10a37f', color: 'white' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#0d7a60'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#10a37f'}
          >
            Log In
          </Link>
        )}
      </div>
    </nav>
  );
}
