'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';
import { useSportsSession } from '@/context/SportsSessionContext';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/shared/Button';
import FormInput from '@/components/shared/FormInput';
import FormTextarea from '@/components/shared/FormTextarea';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/client/Toast';
import { updateCalendarEventForCompletedEntity, cleanupPlannedSessionOnCompletion } from '@/lib/calendarSync';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';

export default function LiveSportsPage() {
  const { user, loading: userLoading } = useUser();
  const { activeSportsId, sportsData, refreshSports, clearSession, loading: sportsLoading } = useSportsSession();
  const [creating, setCreating] = useState(false);
  const [activityType, setActivityType] = useState(() => {
    const now = new Date();
    return `Sports - ${now.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    })}`;
  });
  const [performanceNotes, setPerformanceNotes] = useState('');
  const [location, setLocation] = useState('');
  const [formError, setFormError] = useState('');
  const [plannedId, setPlannedId] = useState(null);

  const router = useRouter();
  const { showSuccess, showError } = useToast();

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
        setPerformanceNotes(decodeURIComponent(notesParam));
      }
    }
  }, []);

  // Show loading while sports session is loading
  if (sportsLoading) {
    return (
      <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
        <div className="text-center">Loading sports session...</div>
      </div>
    );
  }

  // Show the form if there is no active sports session
  if (!sportsData) {
    const handleStartSports = async (e) => {
      e.preventDefault();
      setFormError('');
      if (!activityType.trim()) {
        setFormError('Activity type is required.');
        return;
      }
      setCreating(true);
      
      // Double-check that there's no in-progress sports before creating a new one
      const { data: existingSports } = await supabase
        .from('fitness_sports')
        .select('*')
        .eq('user_id', user.id)
        .eq('in_progress', true)
        .maybeSingle();
      
      if (existingSports) {
        // There's already an in-progress sports, refresh the context and return
        await refreshSports();
        setCreating(false);
        return;
      }
      
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      let sportsData = {
        user_id: user.id,
        activity_type: activityType.trim(),
        performance_notes: performanceNotes.trim(),
        location: location.trim(),
        in_progress: true,
        start_time: now.toISOString(),
        date: today,
      };

      // If this is from a planned event, update the planned entry instead of creating new
      if (plannedId) {
        const { data, error } = await supabase
          .from('fitness_sports')
          .update({
            ...sportsData,
            status: 'completed' // Mark as completed since we're starting it
          })
          .eq('id', plannedId)
          .eq('user_id', user.id)
          .select()
          .single();
        
        setCreating(false);
        if (!error && data) {
          // Clean up the calendar event since it's no longer planned
          await updateCalendarEventForCompletedEntity(CALENDAR_SOURCES.SPORT, plannedId);
          await refreshSports();
        } else {
          setFormError(error?.message || 'Failed to start planned sports session');
        }
      } else {
        // Create new sports session
        const { data, error } = await supabase
          .from('fitness_sports')
          .insert(sportsData)
          .select()
          .single();
        
        setCreating(false);
        if (!error && data) {
          await refreshSports();
        } else {
          setFormError(error?.message || 'Failed to start sports session');
        }
      }
    };
    return (
      <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Start a New Sports Session</h1>
        {formError && <div className="text-red-500 mb-2">{formError}</div>}
        <form onSubmit={handleStartSports} className="space-y-4">
          <div>
            <label className="font-semibold">Activity Type</label>
            <FormInput
              value={activityType}
              onChange={e => setActivityType(e.target.value)}
              required
              placeholder="e.g. Basketball, Soccer, Tennis, Golf"
            />
          </div>
          <div>
            <label className="font-semibold">Location (optional)</label>
            <FormInput
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g. Central Park, Gym, Tennis Court"
            />
          </div>
          <div>
            <label className="font-semibold">Performance Notes (optional)</label>
            <FormTextarea
              value={performanceNotes}
              onChange={e => setPerformanceNotes(e.target.value)}
              placeholder="Add any performance notes or goals for this session (optional)"
            />
          </div>
          <Button type="submit" variant="primary" loading={creating} disabled={creating}>
            Start Activity
          </Button>
        </form>
      </div>
    );
  }

  // Show the logging UI if a sports session is active
  return (
    <div className="max-w-xl mx-auto p-6 mt-8 bg-panel rounded shadow">
      <h1 className="text-2xl font-bold mb-2">Sports Session In Progress</h1>
      <p className="mb-2"><strong>Activity:</strong> {sportsData.activity_type || 'Untitled Sports'}</p>
      {sportsData.location && <p className="mb-2"><strong>Location:</strong> {sportsData.location}</p>}
      {sportsData.performance_notes && <p className="mb-2"><strong>Performance Notes:</strong> {sportsData.performance_notes}</p>}
      <p className="mb-2"><strong>Started:</strong> {sportsData.start_time ? new Date(sportsData.start_time).toLocaleString() : 'Unknown'}</p>
      
      {/* End Sports Button */}
      <Button variant="danger" className="mb-4" onClick={handleEndSports}>
        End Activity
      </Button>
      
      <div className="text-sm text-muted-foreground">
        <p>Your sports session is active. Click &quot;End Activity&quot; when you&apos;re finished to save your session.</p>
      </div>
    </div>
  );

  async function handleEndSports() {
    if (!activeSportsId) return;
    
    // Calculate duration from start time
    const startTime = new Date(sportsData.start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    // Update the sports session to mark it as completed
    const { error } = await supabase
      .from('fitness_sports')
      .update({ 
        in_progress: false, 
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        status: 'completed' // Ensure it's marked as completed
      })
      .eq('id', activeSportsId);
    
    if (error) {
      showError('Failed to end sports session.');
      return;
    }

    // Clean up any planned session data (calendar events, etc.)
    if (user?.id) {
      const cleanupError = await cleanupPlannedSessionOnCompletion('sport', activeSportsId, user.id);
      if (cleanupError) {
        console.error('Error cleaning up planned session:', cleanupError);
        // Don't fail the sports end if cleanup fails
      }
    }
    
    // Clear session state in context immediately
    if (typeof clearSession === 'function') clearSession();
    if (typeof refreshSports === 'function') await refreshSports();
    
    // Show success message
    showSuccess('Sports session ended!');
    
    // Redirect
    router.push('/fitness/sports');
  }
} 