'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import SportForm from '@/components/SportForm';
import { CALENDAR_SOURCES, updateCalendarEvent } from '@/lib/calendarUtils';

export default function ViewOrEditSportSession({ params }) {
  const { id } = use(params); // Next.js 15 App Router param access
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('fitness_sports')
        .select('*')
        .eq('id', id)
        .single();

      if (error) console.error(error);
      else setSession(data);
      setLoading(false);
    };

    fetchSession();
  }, [id]);

  const handleUpdate = async (formData) => {
    const { error } = await supabase
      .from('fitness_sports')
      .update({ ...formData })
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Failed to update session.');
      return;
    }

    // Update calendar event for the edited sports session
    const startTime = new Date(formData.date);
    const endTime = new Date(startTime.getTime() + (formData.duration_minutes * 60000));
    
    const calendarError = await updateCalendarEvent(
      CALENDAR_SOURCES.SPORT,
      id,
      `Sport: ${formData.activity_type}`,
      startTime.toISOString(),
      endTime.toISOString()
    );

    if (calendarError) {
      console.error('Calendar event update failed:', calendarError);
    }

    alert('Session updated!');
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!session) return <div className="p-4">Session not found.</div>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      {isEditing ? (
        <>
          <h1 className="text-2xl font-bold mb-4">✏️ Edit Sport Session</h1>
          <SportForm initialData={session} onSubmit={handleUpdate} />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">{session.activity_type}</h1>
          <p className="text-gray-700 mb-1">📅 {session.date}</p>
          <p className="text-gray-700 mb-1">⏱️ Duration: {session.duration_minutes ?? 'N/A'} min</p>
          <p className="text-gray-700 mb-1">💥 Intensity: {session.intensity_level || 'N/A'}</p>
          <p className="text-gray-700 mb-1">📍 Location: {session.location || 'N/A'}</p>
          <p className="text-gray-700 mb-1">🌤️ Weather: {session.weather || 'N/A'}</p>
          <p className="text-gray-700 mb-1">🧑‍🤝‍🧑 Participants: {session.participants || 'N/A'}</p>
          <p className="text-gray-700 mb-1">🏆 Score: {session.score || 'N/A'}</p>
          <p className="text-gray-700 mb-1">🔥 Calories: {session.calories_burned ?? 'TBD'}</p>
          {session.performance_notes && (
            <p className="text-gray-700 mt-3 whitespace-pre-wrap">{session.performance_notes}</p>
          )}
          {session.injuries_or_flags && (
            <p className="text-red-600 mt-2 whitespace-pre-wrap">{session.injuries_or_flags}</p>
          )}
        </>
      )}
    </div>
  );
}
