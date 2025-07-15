'use client';

import { useRouter } from 'next/navigation';
import { useInsertEntity } from '@/lib/useSupabaseCrud';
import CardioForm from '@/components/CardioForm';
import BackButton from '@/components/BackButton';
import { CALENDAR_SOURCES } from '@/lib/calendarUtils';
import { useToast } from '@/components/Toast';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useState } from 'react';

export default function AddCardioSessionPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user, loading: userLoading } = useUser();
  const { insert: insertCardio, loading: cardioLoading } = useInsertEntity('fitness_cardio');
  const { insert: insertCalendar, loading: calendarLoading } = useInsertEntity('calendar_events');
  const [formKey, setFormKey] = useState(0); // for resetting CardioForm

  const handleSubmit = async (formData) => {
    if (!user) {
      showError('You must be logged in.');
      return;
    }
    // Insert cardio session
    const { data, error } = await insertCardio({
      ...formData,
      user_id: user.id,
      calories_burned: null, // placeholder for AI estimate later
    });
    if (error || !data || !data[0]?.id) {
      // Toast handled by hook
      return;
    }
    // Create calendar event for the cardio session
    const startTime = new Date(formData.date);
    const endTime = new Date(startTime.getTime() + (formData.duration_minutes * 60000));
    const { error: calendarError } = await insertCalendar({
      user_id: user.id,
      title: `Cardio: ${formData.activity_type}`,
      source: CALENDAR_SOURCES.CARDIO,
      source_id: data[0].id,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });
    if (calendarError) {
      // Toast handled by hook
      return;
    }
    showSuccess('Cardio session added successfully!');
    setFormKey((k) => k + 1); // reset form
    router.push('/fitness/cardio');
  };

  if (userLoading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">➕ Add Cardio Session</h1>
      <p className="text-gray-400">Record a new cardio activity like running, cycling, or swimming.</p>
      <CardioForm key={formKey} onSubmit={handleSubmit} loading={cardioLoading || calendarLoading} />
    </div>
  );
}
