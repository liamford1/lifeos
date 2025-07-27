'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useUser } from '@/context/UserContext';
import BackButton from '@/components/BackButton';
import SportForm from '@/components/SportForm';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';

export default function AddSportSession() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { createSportsSession } = useSportsSessions();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  const handleAdd = async (formData) => {
    if (!user) {
      showError('You must be logged in.');
      return;
    }

    const data = await createSportsSession({
      ...formData,
      user_id: user.id,
    });

    if (data) {
      // Create calendar event for the sports session
      const startTime = new Date(formData.date);
      const endTime = new Date(startTime.getTime() + (formData.duration_minutes * 60000));

      const { error: calendarError } = await supabase.from('calendar_events').insert({
        user_id: user.id,
        title: `Sport: ${formData.activity_type}`,
        source: CALENDAR_SOURCES.SPORT,
        source_id: data.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      if (calendarError) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Calendar event creation failed:', calendarError);
        }
      }

      router.push('/fitness/sports');
    }
  };

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">➕ Add Sport Session</h1>
      <p className="text-base">Record a new sports activity or game session.</p>
      <SportForm onSubmit={handleAdd} />
    </div>
  );
}
