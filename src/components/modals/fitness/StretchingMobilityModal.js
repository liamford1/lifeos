"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useUser } from "@/context/UserContext";
import { useStretchingSessions } from "@/lib/hooks/useStretchingSessions";
import { useStretchingSession } from "@/context/StretchingSessionContext";
import { supabase } from "@/lib/supabaseClient";
import BaseModal from "@/components/shared/BaseModal";
import Button from "@/components/shared/Button";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import SharedDeleteButton from "@/components/SharedDeleteButton";
import EditButton from "@/components/EditButton";
import StretchingForm from "@/components/forms/StretchingForm";
import { useToast } from "@/components/client/Toast";
import { updateCalendarEventForCompletedEntity, cleanupPlannedSessionOnCompletion } from "@/lib/calendarSync";
import { CALENDAR_SOURCES } from "@/lib/utils/calendarUtils";
import dynamic from "next/dynamic";

const StretchHorizontal = dynamic(
  () => import("lucide-react/dist/esm/icons/stretch-horizontal"),
  { ssr: false },
);
const Clock = dynamic(() => import("lucide-react/dist/esm/icons/clock"), {
  ssr: false,
  loading: () => <span className="inline-block w-4 h-4" />,
});
const Calendar = dynamic(() => import("lucide-react/dist/esm/icons/calendar"), {
  ssr: false,
});
const CalendarClient = dynamic(() => import("@/components/client/CalendarClient"));

// Skeleton component for stretching sessions
function StretchingSkeleton() {
  return (
    <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
        <div className="flex-1">
          <div className="h-6 bg-gray-700 rounded mb-2 w-3/4"></div>
          <div className="h-4 bg-gray-700 rounded mb-2 w-1/4"></div>
          <div className="h-4 bg-gray-700 rounded mb-2 w-1/2"></div>
        </div>
      </div>
    </div>
  );
}

export default function StretchingMobilityModal({ isOpen, onClose, initialMode = 'list', initialSessionId = null }) {
  const { user } = useUser();
  const { activeStretchingId, stretchingData, refreshStretching, clearSession, loading: stretchingLoading } = useStretchingSession();
  const { fetchStretchingSessions, deleteStretchingSession, updateStretchingSession } = useStretchingSessions();
  const { showSuccess, showError } = useToast();
  
  const [mode, setMode] = useState(initialMode);
  const [selectedSession, setSelectedSession] = useState(null);
  const [stretchingSessions, setStretchingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [endingSession, setEndingSession] = useState(false);
  
  const fetchedRef = useRef({ userId: null, done: false });

  const loadStretchingSessions = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      setHasInitialized(true);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchStretchingSessions(user.id);
      setStretchingSessions(data || []);
      setLoading(false);
      setHasInitialized(true);
    } catch (error) {
      console.error("Error loading stretching sessions:", error);
      setLoading(false);
      setHasInitialized(true);
    }
  }, [user?.id, fetchStretchingSessions]);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (fetchedRef.current.done && fetchedRef.current.userId === user.id)
      return;
    fetchedRef.current = { userId: user.id, done: true };
    loadStretchingSessions();
  }, [isOpen, user, loadStretchingSessions]);

  // Load initial session if provided
  useEffect(() => {
    if (initialSessionId && stretchingSessions.length > 0) {
      const session = stretchingSessions.find(s => s.id === initialSessionId);
      if (session) {
        setSelectedSession(session);
      }
    }
  }, [initialSessionId, stretchingSessions]);

  const handleDeleteStretching = useCallback(
    async (id) => {
      const confirm = window.confirm("Delete this stretching session?");
      if (!confirm) return;
      if (!user) return;
      const success = await deleteStretchingSession(id, user.id);
      if (success) {
        setStretchingSessions((prev) => prev.filter((s) => s.id !== id));
        if (selectedSession?.id === id) {
          setSelectedSession(null);
          setMode('list');
        }
      }
    },
    [deleteStretchingSession, user, selectedSession],
  );

  const handleStartNewSession = () => {
    setMode('create');
    setSelectedSession(null);
  };

  const handleEditSession = useCallback((session) => {
    setSelectedSession(session);
    setMode('edit');
  }, []);

  const handleViewSession = useCallback((session) => {
    setSelectedSession(session);
    setMode('view');
  }, []);

  const handleBackToList = () => {
    setMode('list');
    setSelectedSession(null);
  };

  const handleFormSuccess = () => {
    loadStretchingSessions();
    setMode('list');
    setSelectedSession(null);
  };

  const handleEndStretching = async () => {
    if (!activeStretchingId || !stretchingData) return;
    
    setEndingSession(true);
    
    // Calculate duration from start time
    const startTime = new Date(stretchingData.start_time);
    const endTime = new Date();
    const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
    
    // Update the stretching session to mark it as completed
    const { error } = await supabase
      .from('fitness_stretching')
      .update({ 
        in_progress: false, 
        end_time: endTime.toISOString(),
        duration_minutes: durationMinutes,
        status: 'completed'
      })
      .eq('id', activeStretchingId);
    
    if (error) {
      showError('Failed to end stretching session.');
      setEndingSession(false);
      return;
    }

    // Clean up any planned session data
    if (user?.id) {
      const cleanupError = await cleanupPlannedSessionOnCompletion('stretching', activeStretchingId, user.id);
      if (cleanupError) {
        console.error('Error cleaning up planned session:', cleanupError);
      }
    }
    
    // Clear session state in context immediately
    if (typeof clearSession === 'function') clearSession();
    if (typeof refreshStretching === 'function') await refreshStretching();
    
    // Show success message
    showSuccess('Stretching session ended!');
    setEndingSession(false);
    
    // Refresh the sessions list
    loadStretchingSessions();
  };

  // Determine what to render based on mode
  const renderContent = () => {
    // Show live session if active
    if (stretchingData && activeStretchingId) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-500/10 rounded-lg flex items-center justify-center mx-auto mb-4">
              <StretchHorizontal className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-medium mb-2">Stretching Session In Progress</h3>
            <p className="text-sm text-gray-400 mb-4">
              {stretchingData.session_type || 'Untitled Stretching'}
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Session Type:</span>
                <span className="font-medium">{stretchingData.session_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Intensity:</span>
                <span className="font-medium">{stretchingData.intensity_level || 'N/A'}</span>
              </div>
              {stretchingData.body_parts && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Body Parts:</span>
                  <span className="font-medium">{stretchingData.body_parts}</span>
                </div>
              )}
              {stretchingData.notes && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Notes:</span>
                  <span className="font-medium">{stretchingData.notes}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Started:</span>
                <span className="font-medium">
                  {stretchingData.start_time ? new Date(stretchingData.start_time).toLocaleString() : 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={handleEndStretching}
            variant="danger"
            loading={endingSession}
            disabled={endingSession}
            className="w-full"
          >
            End Stretching Session
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            <p>Your stretching session is active. Click &quot;End Stretching Session&quot; when you&apos;re finished to save your session.</p>
          </div>
        </div>
      );
    }

    // Show form for create/edit mode
    if (mode === 'create' || mode === 'edit') {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">
              {mode === 'create' ? 'Start New Stretching Session' : 'Edit Stretching Session'}
            </h3>
            <Button onClick={handleBackToList} variant="secondary" size="sm">
              Back to List
            </Button>
          </div>
          <StretchingForm 
            initialData={selectedSession} 
            isEdit={mode === 'edit'} 
            onSuccess={handleFormSuccess}
          />
        </div>
      );
    }

    // Show session details for view mode
    if (mode === 'view' && selectedSession) {
      return (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Stretching Session Details</h3>
            <div className="flex gap-2">
              <Button onClick={() => handleEditSession(selectedSession)} variant="secondary" size="sm">
                Edit
              </Button>
              <Button onClick={handleBackToList} variant="secondary" size="sm">
                Back to List
              </Button>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Session Type:</span>
                <span className="font-medium">{selectedSession.session_type || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Date:</span>
                <span className="font-medium">{selectedSession.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Duration:</span>
                <span className="font-medium">{selectedSession.duration_minutes || 'N/A'} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-400">Intensity Level:</span>
                <span className="font-medium">{selectedSession.intensity_level || 'N/A'}</span>
              </div>
              {selectedSession.body_parts && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Body Parts:</span>
                  <span className="font-medium">{selectedSession.body_parts}</span>
                </div>
              )}
              {selectedSession.start_time && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">Start Time:</span>
                  <span className="font-medium">
                    {new Date(selectedSession.start_time).toLocaleString()}
                  </span>
                </div>
              )}
              {selectedSession.end_time && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-400">End Time:</span>
                  <span className="font-medium">
                    {new Date(selectedSession.end_time).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {selectedSession.notes && (
            <div className="bg-card border border-border rounded-lg p-4">
              <h4 className="font-medium mb-2">Notes</h4>
              <p className="text-gray-300 whitespace-pre-wrap">{selectedSession.notes}</p>
            </div>
          )}
        </div>
      );
    }

    // Show list of recent sessions (default mode)
    return (
      <div className="space-y-6">
        {/* Start New Session Button */}
        <div className="text-center">
          <Button
            onClick={handleStartNewSession}
            variant="primary"
            className="w-full max-w-md"
          >
            Start New Stretching Session
          </Button>
        </div>

        {/* Recent Stretching Sessions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-md font-semibold mb-3">
            Recent Stretching Sessions
          </h4>
          <div className="space-y-4 min-h-[200px] relative">
            {renderRecentSessions()}
          </div>
        </div>

        {/* Calendar for scheduling stretching sessions */}
        <div className="bg-card border border-border rounded-lg p-4">
          <h4 className="text-md font-semibold mb-3">
            Schedule Stretching Sessions
          </h4>
          <CalendarClient />
        </div>
      </div>
    );
  };

  const renderRecentSessions = () => {
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <StretchingSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (loading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <StretchingSkeleton key={`skeleton-${index}`} />
      ));
    }

    if (!user) {
      return <div data-testid="stretching-no-user" />;
    }

    if (stretchingSessions.length === 0) {
      return (
        <div className="text-center py-8 space-y-3">
          <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
            <StretchHorizontal className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium">No stretching sessions yet</h3>
            <p className="text-sm text-gray-400">Start your first stretching session to begin tracking</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {stretchingSessions.slice(0, 5).map((session) => (
          <div key={session.id} className="group relative">
            <div 
              onClick={() => handleViewSession(session)}
              className="bg-card hover:bg-[#2e2e2e] transition p-4 rounded-lg shadow cursor-pointer border border-border pr-12"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500/10">
                  <StretchHorizontal className="w-4 h-4 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-white truncate">
                      {session.session_type || 'Stretching Session'}
                    </h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-500">
                      Stretching
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{session.date}</p>
                  
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-300">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {session.duration_minutes ?? "-"} min
                    </span>
                    {session.intensity_level && (
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-700">
                        {session.intensity_level}
                      </span>
                    )}
                  </div>
                  
                  {session.body_parts && (
                    <p className="text-sm text-gray-300 mt-2">
                      {session.body_parts}
                    </p>
                  )}
                  
                  {session.notes && (
                    <p className="text-sm text-gray-300 mt-2 line-clamp-2">{session.notes}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex gap-2">
                <EditButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditSession(session);
                  }}
                />
                <SharedDeleteButton
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteStretching(session.id);
                  }}
                  size="sm"
                  aria-label="Delete stretching session"
                  label=""
                  className="w-8 h-8 p-0 flex items-center justify-center"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        stretchingData && activeStretchingId 
          ? "Stretching Session In Progress" 
          : mode === 'create' 
            ? "Start New Stretching Session"
            : mode === 'edit'
              ? "Edit Stretching Session"
              : mode === 'view'
                ? "Stretching Session Details"
                : "Stretching / Mobility"
      }
      subtitle={
        stretchingData && activeStretchingId
          ? "Track your active stretching session"
          : mode === 'create'
            ? "Log a new stretching activity"
            : mode === 'edit'
              ? "Update your stretching session details"
              : mode === 'view'
                ? "View stretching session information"
                : "Yoga, rehab, cooldowns and flexibility work"
      }
      icon={StretchHorizontal}
      iconBgColor="bg-blue-500/10"
      iconColor="text-blue-500"
      maxWidth="max-w-4xl"
      data-testid="stretching-mobility-modal"
    >
      {renderContent()}
    </BaseModal>
  );
}
