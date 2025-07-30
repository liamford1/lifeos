'use client';

import { useParams, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useEffect, useState, useCallback } from 'react';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { supabase } from '@/lib/supabaseClient';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import Button from '@/components/shared/Button';
import BackButton from '@/components/shared/BackButton';

export default function CardioDetailPage() {
  const params = useParams();
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showError } = useToast();
  const [cardio, setCardio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  const fetchCardio = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: cardioData, error: cardioErr } = await supabase
        .from('fitness_cardio')
        .select('*')
        .eq('id', params.id)
        .single();
      if (cardioErr) throw cardioErr;
      setCardio(cardioData);
    } catch (err) {
      setError(err.message || 'Failed to load cardio details.');
      if (typeof showError === 'function') showError(err.message || 'Failed to load cardio details.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  useEffect(() => {
    if (user) fetchCardio();
  }, [user, fetchCardio]);

  async function handleDelete() {
    if (!window.confirm("Delete this cardio entry?")) return;
    const { error } = await supabase
      .from('fitness_cardio')
      .delete()
      .eq('id', params.id);
    if (error) {
      showError("Failed to delete cardio entry");
    } else {
      router.push("/fitness/cardio");
    }
  }

  if (loading || userLoading) return <LoadingSpinner />;
  if (!user) return null;
  if (error) return <div className="p-4"><p className="text-red-500 text-sm">{error}</p></div>;
  if (!cardio) return <div className="p-4"><p className="text-muted-foreground text-sm">Cardio session not found.</p></div>;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold">{cardio.activity_type || 'Cardio Session'}</h1>
      <p className="text-base">View your cardio session details.</p>
      <p className="text-sm text-base mb-3">{cardio.date}</p>
      {cardio.notes && <p className="mb-4 italic text-base">{cardio.notes}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="border p-4 rounded bg-panel">
          <h3 className="font-semibold text-lg mb-2">📊 Session Details</h3>
          <div className="space-y-2">
            <div><strong>Activity:</strong> {cardio.activity_type || 'Cardio'}</div>
            <div><strong>Duration:</strong> {cardio.duration_minutes ?? '-'} minutes</div>
            {cardio.distance_miles && (
              <div><strong>Distance:</strong> {cardio.distance_miles} miles</div>
            )}
            {cardio.calories_burned && (
              <div><strong>Calories:</strong> {cardio.calories_burned} kcal</div>
            )}
          </div>
        </div>
        
        <div className="border p-4 rounded bg-panel">
          <h3 className="font-semibold text-lg mb-2">📍 Location & Notes</h3>
          <div className="space-y-2">
            {cardio.location && (
              <div><strong>Location:</strong> {cardio.location}</div>
            )}
            <div><strong>Started:</strong> {cardio.start_time ? new Date(cardio.start_time).toLocaleString() : 'Unknown'}</div>
            {cardio.end_time && (
              <div><strong>Ended:</strong> {new Date(cardio.end_time).toLocaleString()}</div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button
          variant="primary"
          onClick={() => router.push(`/fitness/cardio/${params.id}/edit`)}
          className="px-4 py-2"
        >
          ✏️ Edit Session
        </Button>
        <SharedDeleteButton
          onClick={handleDelete}
          aria-label="Delete cardio entry"
          label="Delete Session"
        />
        <Button
          variant="secondary"
          onClick={() => router.push('/')}
          className="px-4 py-2"
        >
          <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
          Back to Calendar
        </Button>
      </div>
    </div>
  );
}
