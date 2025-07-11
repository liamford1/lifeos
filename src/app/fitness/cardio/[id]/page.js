'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import CardioForm from '@/components/CardioForm';

export default function ViewOrEditCardioSession({ params }) {
  const { id } = use(params); // ✅ unwrap `params` safely for Next.js 15+
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();
  const isEditing = searchParams.get('edit') === 'true';

  useEffect(() => {
    const fetchSession = async () => {
      const { data, error } = await supabase
        .from('fitness_cardio')
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
      .from('fitness_cardio')
      .update({ ...formData })
      .eq('id', id);

    if (error) {
      console.error(error);
      alert('Failed to update cardio session.');
    } else {
      alert('Session updated!');
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!session) return <div className="p-4">Session not found.</div>;

  return (
    <div className="p-4 max-w-xl mx-auto">
      <BackButton />
      {isEditing ? (
        <>
          <h1 className="text-2xl font-bold mb-4">✏️ Edit Cardio Session</h1>
          <CardioForm initialData={session} onSubmit={handleUpdate} />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold mb-4">{session.activity_type}</h1>
          <p className="text-gray-700 mb-1">📅 {session.date}</p>
          <p className="text-gray-700 mb-1">
            ⏱️ Duration: {session.duration_minutes} minutes
          </p>
          <p className="text-gray-700 mb-1">
            📏 Distance: {session.distance_miles} miles
          </p>
          <p className="text-gray-700 mb-1">
            🔥 Calories: {session.calories_burned ?? 'TBD'}
          </p>
          <p className="text-gray-700 mb-1">
            📍 Location: {session.location || 'N/A'}
          </p>
          <p className="text-gray-700 mt-3 whitespace-pre-wrap">
            {session.notes}
          </p>
        </>
      )}
    </div>
  );
}
