'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { supabase } from '@/lib/supabaseClient';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import BaseModal from '@/components/shared/BaseModal';
import { HeartPulse } from 'lucide-react';

export default function CardioDetailsModal({ isOpen, onClose, cardioId }) {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const { showError } = useToast();
  const [cardio, setCardio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCardio = useCallback(async () => {
    if (!cardioId || !user) return;
    
    setLoading(true);
    setError(null);
    try {
      const { data: cardioData, error: cardioErr } = await supabase
        .from('fitness_cardio')
        .select('*')
        .eq('id', cardioId)
        .single();
      if (cardioErr) throw cardioErr;
      setCardio(cardioData);
    } catch (err) {
      setError(err.message || 'Failed to load cardio details.');
      if (typeof showError === 'function') showError(err.message || 'Failed to load cardio details.');
    } finally {
      setLoading(false);
    }
  }, [cardioId, user, showError]);

  useEffect(() => {
    if (isOpen && user) {
      fetchCardio();
    }
  }, [isOpen, user, fetchCardio]);

  async function handleDelete() {
    if (!window.confirm("Delete this cardio entry?")) return;
    const { error } = await supabase
      .from('fitness_cardio')
      .delete()
      .eq('id', cardioId);
    if (error) {
      showError("Failed to delete cardio entry");
    } else {
      onClose();
    }
  }

  // Don't render if not open
  if (!isOpen) return null;

  // Show loading spinner when user is loading
  if (userLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
        subtitle="Please wait"
        icon={HeartPulse}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

  // Show loading state while fetching cardio data
  if (loading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading Cardio Session..."
        subtitle="Please wait"
        icon={HeartPulse}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Show error state
  if (error) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Error Loading Cardio Session"
        subtitle="Something went wrong"
        icon={HeartPulse}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
      >
        <div className="text-red-400 text-center py-8">
          <p>{error}</p>
          <Button 
            onClick={onClose}
            variant="primary"
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </BaseModal>
    );
  }

  // Show not found state
  if (!cardio) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Cardio Session Not Found"
        subtitle="The cardio session doesn't exist or you don't have permission to view it"
        icon={HeartPulse}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
      >
        <div className="text-center py-8">
          <Button 
            onClick={onClose}
            variant="primary"
            className="mt-4"
          >
            Close
          </Button>
        </div>
      </BaseModal>
    );
  }

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={cardio.activity_type || 'Cardio Session'}
      subtitle={cardio.date}
      icon={HeartPulse}
      iconBgColor="bg-red-500/10"
      iconColor="text-red-500"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {cardio.notes && (
          <div className="bg-panel border border-border rounded-lg p-4">
            <p className="italic text-base">{cardio.notes}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        <div className="flex gap-4">
          <Button
            variant="primary"
            onClick={() => router.push(`/fitness/cardio/${cardioId}/edit`)}
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
    </BaseModal>
  );
}
