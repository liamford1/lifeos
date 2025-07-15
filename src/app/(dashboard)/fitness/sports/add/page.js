'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import SportForm from '@/components/SportForm';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';

export default function AddSportSession() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const handleAdd = async (formData) => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase.from('fitness_sports').insert([
      {
        ...formData,
        user_id: user.id,
      },
    ]).select().single();

    if (error) {
      console.error(error);
      showError('Failed to add session.');
      return;
    }

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
      console.error('Calendar event creation failed:', calendarError);
    }

    showSuccess('Sport session added successfully!');
    router.push('/fitness/sports');
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">➕ Add Sport Session</h1>
      <SportForm onSubmit={handleAdd} />
    </div>
  );
}
