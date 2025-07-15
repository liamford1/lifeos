'use client';

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import CardioForm from '@/components/CardioForm';
import BackButton from '@/components/BackButton';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';

export default function AddCardioSessionPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const handleAdd = async (formData) => {
    const { data: userData } = await supabase.auth.getUser();
    const user_id = userData?.user?.id;

    if (!user_id) {
      showError('You must be logged in.');
      return;
    }

    const { data, error } = await supabase.from('fitness_cardio').insert([
      {
        ...formData,
        user_id,
        calories_burned: null, // placeholder for AI estimate later
      },
    ]).select().single();

    if (error) {
      console.error(error);
      showError('Failed to save cardio session.');
      return;
    }

    // Create calendar event for the cardio session
    const startTime = new Date(formData.date);
    const endTime = new Date(startTime.getTime() + (formData.duration_minutes * 60000));

    const { error: calendarError } = await supabase.from('calendar_events').insert({
      user_id: user_id,
      title: `Cardio: ${formData.activity_type}`,
      source: CALENDAR_SOURCES.CARDIO,
      source_id: data.id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });

    if (calendarError) {
      console.error('Calendar event creation failed:', calendarError);
    }

    showSuccess('Cardio session added successfully!');
    router.push('/fitness/cardio');
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">➕ Add Cardio Session</h1>
      <p className="text-gray-400">Record a new cardio activity like running, cycling, or swimming.</p>
      <CardioForm onSubmit={handleAdd} />
    </div>
  );
}
