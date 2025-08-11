'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useCardioSession } from '@/context/CardioSessionContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/components/client/Toast';
import { updateCalendarEventForCompletedEntity, cleanupPlannedSessionOnCompletion } from '@/lib/calendarSync';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';

export default function CardioSessionPage() {
  const { user, loading: userLoading } = useUser();
  const { activeCardioId, cardioData, refreshCardio, clearSession, loading: cardioLoading } = useCardioSession();
  const params = useParams();
  const cardioId = params.id;
  
  const [creating, setCreating] = useState(false);
  const [activityType, setActivityType] = useState(() => {
    const now = new Date();
    return `Cardio - ${now.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })}`;
  });
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState('');
  const [plannedId, setPlannedId] = useState(null);

  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Check if the requested cardio ID matches the active session
  useEffect(() => {
    if (cardioId && activeCardioId && cardioId !== activeCardioId) {
      // If there's a mismatch, refresh the session to get the correct one
      refreshCardio();
    }
  }, [cardioId, activeCardioId, refreshCardio]);

  // Handle URL parameters for pre-filled data from planned events
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const plannedIdParam = urlParams.get('plannedId');
      const titleParam = urlParams.get('title');
      const notesParam = urlParams.get('notes');
      
      if (plannedIdParam) {
        setPlannedId(plannedIdParam);
      }
      
      if (titleParam) {
        setActivityType(decodeURIComponent(titleParam));
      }
      
      if (notesParam) {
        setNotes(decodeURIComponent(notesParam));
      }
    }
  }, []);

  // Show loading while cardio session is loading
  if (cardioLoading || userLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
        <div className="text-center">Loading cardio session...</div>
      </div>
    );
  }

  // Show the form if there is no active cardio session
  if (!cardioData) {
    const handleStartCardio = async (e) => {
      e.preventDefault();
      setFormError('');
      if (!activityType.trim()) {
        setFormError('Activity type is required.');
        return;
      }
      setCreating(true);
      
      // Double-check that there's no in-progress cardio before creating a new one
      const { data: existingCardio } = await supabase
        .from('fitness_cardio')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_progress', true)
        .maybeSingle();
      
      if (existingCardio) {
        // There's already an in-progress cardio, refresh the context and return
        await refreshCardio();
        setCreating(false);
        return;
      }
      
      const now = new Date();
      const [today] = now.toISOString().split('T');
      const cardioData = {
        user_id: user.id,
        activity_type: activityType.trim(),
        notes: notes.trim(),
        location: location.trim(),
        in_progress: true,
        start_time: now.toISOString(),
        date: today,
      };

      // If this is from a planned event, update the planned entry instead of creating new
      if (plannedId) {
        const { data, error } = await supabase
          .from('fitness_cardio')
          .update({
            ...cardioData,
            status: 'completed' // Mark as completed since we're starting it
          })
          .eq('id', plannedId)
          .eq('user_id', user.id)
          .select()
          .single();
        
        setCreating(false);
        if (!error && data) {
          // Clean up the calendar event since it's no longer planned
          await updateCalendarEventForCompletedEntity(CALENDAR_SOURCES.CARDIO, plannedId);
          await refreshCardio();
        } else {
          setFormError(error?.message || 'Failed to start planned cardio session');
        }
      } else {
        // Create new cardio session
        const { data, error } = await supabase
          .from('fitness_cardio')
          .insert(cardioData)
          .select()
          .single();
        
        setCreating(false);
        if (!error && data) {
          await refreshCardio();
        } else {
          setFormError(error?.message || 'Failed to start cardio session');
        }
      }
    };
    return (
      <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Start a New Cardio Session</h1>
        {formError && <div className="text-red-500 mb-2">{formError}</div>}
        <form onSubmit={handleStartCardio} className="space-y-4">
          <div>
            <label className="font-semibold">Activity Type</label>
            <FormInput
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              required
              placeholder="e.g. Running, Cycling, Swimming, Walking"
            />
          </div>
          <div>
            <label className="font-semibold">Location (optional)</label>
            <FormInput
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Central Park, Gym, Home"
            />
          </div>
          <div>
            <label className="font-semibold">Notes (optional)</label>
            <FormTextarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add any notes or goals for this session (optional)"
            />
          </div>
          <Button type="submit" variant="primary" loading={creating} disabled={creating}>
            Start Cardio
          </Button>
        </form>
      </div>
    );
  }

  // Show the logging UI if a cardio session is active
  return (
    <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Cardio Session In Progress</h1>
      <p className="mb-2"><strong>Activity:</strong> {cardioData.activity_type || 'Untitled Cardio'}</p>
      {cardioData.location && <p className="mb-2"><strong>Location:</strong> {cardioData.location}</p>}
      {cardioData.notes && <p className="mb-2"><strong>Notes:</strong> {cardioData.notes}</p>}
      <p className="mb-2"><strong>Started:</strong> {cardioData.start_time ? new Date(cardioData.start_time).toLocaleString() : 'Unknown'}</p>
      
      {/* End Cardio Button */}
      <Button variant="danger" className="mb-4" onClick={handleEndCardio}>
        End Cardio Session
      </Button>
      
      <div className="text-sm text-muted-foreground">
        <p>Your cardio session is active. Click &quot;End Cardio Session&quot; when you&apos;re finished to save your session.</p>
      </div>
    </div>
  );

  async function handleEndCardio() {
    if (!activeCardioId) return;
    
    // Calculate duration from start time
    const startTime = new Date(cardioData.start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    // Update the cardio session to mark it as completed
    const { error } = await supabase
      .from('fitness_cardio')
      .update({ 
        in_progress: false, 
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        status: 'completed' // Ensure it's marked as completed
      })
      .eq('id', activeCardioId);
    
    if (error) {
      showError('Failed to end cardio session.');
      return;
    }

    // Clean up any planned session data (calendar events, etc.)
    if (user?.id) {
      const cleanupError = await cleanupPlannedSessionOnCompletion('cardio', activeCardioId, user.id);
      if (cleanupError) {
        console.error('Error cleaning up planned session:', cleanupError);
        // Don't fail the cardio end if cleanup fails
      }
    }
    
    // Clear session state in context immediately
    if (typeof clearSession === 'function') clearSession();
    if (typeof refreshCardio === 'function') await refreshCardio();
    
    // Show success message
    showSuccess('Cardio session ended!');
    
    // Redirect to Fitness dashboard
    router.push('/fitness');
  }
} 