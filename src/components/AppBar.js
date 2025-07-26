'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { FaUserCircle } from 'react-icons/fa';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/Button';
import { useWorkoutSession } from '@/context/WorkoutSessionContext';
import { useCardioSession } from '@/context/CardioSessionContext';
import { useCookingSession } from '@/context/CookingSessionContext';
import Image from 'next/image';

export default function AppBar() {
  const { user, loading, session } = useUser();
  const { activeWorkoutId } = useWorkoutSession();
  const { activeCardioId } = useCardioSession();
  const { mealId, currentStep, instructions, loading: cookingSessionLoading } = useCookingSession();
  const [profile, setProfile] = useState(null);
  const router = useRouter();

  // Fetch user profile data when user is available
  useEffect(() => {
    const getProfile = async () => {
      if (loading) return;
      if (!session?.access_token) return;
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name', { headers: { Accept: 'application/json' } })
        .eq('user_id', user.id)
        .single();
      if (!error && data) {
        setProfile(data);
      }
    };
    getProfile();
  }, [user, loading, session]);

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
    <nav className="flex items-center justify-between p-4 bg-panel border-b border-default">
      {/* App title - clickable to navigate home */}
      <Image
        src="/threados-logo.png"
        alt="Thread OS Logo"
        width={80}
        height={40}
        className="h-10 w-auto cursor-pointer ml-4"
        onClick={() => router.push('/')}
        priority
      />

      {/* Right side actions container */}
      <div className="flex items-center space-x-4">
        {/* Workout in progress button */}
        {activeWorkoutId && (
          <Button
            onClick={() => router.push('/fitness/workouts/live')}
            variant="success"
            size="sm"
            className="flex items-center gap-1"
            aria-label="Workout In Progress"
          >
            Workout In Progress
          </Button>
        )}
        {/* Cardio in progress button */}
        {activeCardioId && (
          <Button
            onClick={() => router.push('/fitness/cardio/live')}
            variant="success"
            size="sm"
            className="flex items-center gap-1"
            aria-label="Cardio In Progress"
          >
            Cardio In Progress
          </Button>
        )}
        {/* Cooking in progress indicator */}
        {mealId && instructions.length > 0 && !cookingSessionLoading && (
          <Button
            type="button"
            onClick={() => router.push(`/food/meals/${mealId}/cook`)}
            variant="secondary"
            size="sm"
            className="text-sm text-orange-600 font-medium ml-4 cursor-pointer hover:underline focus:underline focus:outline-none"
            aria-label="Go to Cooking Session"
            data-testid="cooking-session-indicator"
          >
            🍳 Cooking in progress – Step {currentStep} of {instructions.length}
          </Button>
        )}
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
