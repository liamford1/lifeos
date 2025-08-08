"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Button from '@/components/shared/Button';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import BaseModal from '@/components/shared/BaseModal';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';
import { useSportsSession } from '@/context/SportsSessionContext';
import dynamic from "next/dynamic";
const Goal = dynamic(() => import("lucide-react/dist/esm/icons/goal"), { ssr: false, loading: () => <span className="inline-block w-4 h-4" /> });

// Skeleton component for sports items
function SportsSkeleton() {
  return (
    <div className="border p-3 rounded shadow-sm animate-pulse">
      <div className="h-6 bg-gray-700 rounded mb-2 w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/4"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded mb-2 w-1/3"></div>
      <div className="flex gap-4 mt-2">
        <div className="h-6 bg-gray-700 rounded w-16"></div>
        <div className="h-6 bg-gray-700 rounded w-16"></div>
      </div>
    </div>
  );
}

export default function SportsActivitiesModal({ isOpen, onClose }) {
  const { user } = useUser();
  const { activeSportsId } = useSportsSession();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const fetchedRef = useRef({ userId: null, done: false });
  const { fetchSportsSessions, deleteSportsSession } = useSportsSessions();
  
  // Memoize fetchSportsSessions to avoid unnecessary effect reruns
  const memoizedFetchSportsSessions = useCallback(fetchSportsSessions, [fetchSportsSessions]);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  const loadSessions = useCallback(async () => {
    if (!userId) {
      setSessionsLoading(false);
      setHasInitialized(true);
      return;
    }
    
    setSessionsLoading(true);
    
    try {
      const data = await memoizedFetchSportsSessions(userId);
      setSessions(data || []);
      setSessionsLoading(false);
      setHasInitialized(true);
    } catch (error) {
      console.error('Error loading sports sessions:', error);
      setSessionsLoading(false);
      setHasInitialized(true);
    }
  }, [userId, memoizedFetchSportsSessions]);

  useEffect(() => {
    if (!isOpen || !user) return;
    if (fetchedRef.current.done && fetchedRef.current.userId === user.id) return;
    fetchedRef.current = { userId: user.id, done: true };
    loadSessions();
  }, [isOpen, user, loadSessions]);

  const handleDelete = useCallback(async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;
    if (!user) return;
    const success = await deleteSportsSession(id, user.id);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  }, [deleteSportsSession, user]);

  const handleStartActivity = useCallback(() => {
    if (!user) return router.push('/auth');
    router.push('/fitness/sports/live');
  }, [user, router]);

  // Determine what to render - memoized to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Don't render anything until we've initialized
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <SportsSkeleton key={`skeleton-${index}`} />
      ));
    }
    
    if (sessionsLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <SportsSkeleton key={`skeleton-${index}`} />
      ));
    }
    
    if (!user) {
      return <div data-testid="sports-no-user" />;
    }
    
    if (sessions.length === 0) {
      return (
        <div className="border p-8 rounded shadow-sm text-center">
          <p className="text-muted-foreground text-sm" data-testid="sports-empty">
            No entries yet. Add one above ⬆️
          </p>
        </div>
      );
    }
    
    return sessions.map((s) => (
      <li
        key={s.id}
        onClick={() => router.push(`/fitness/sports/${s.id}`)}
        className="border p-3 rounded shadow-sm cursor-pointer hover:bg-[#2e2e2e] transition"
      >
        <div className="font-semibold text-lg">{s.activity_type || 'Sports'}</div>
        <div className="text-sm text-base">{s.date}</div>
        <div className="text-sm text-base">
          ⏱️ {s.duration_minutes ?? '-'} min
          {s.distance_miles && ` — 📏 ${s.distance_miles} mi`}
        </div>
        {s.location && <div className="text-sm text-base">📍 {s.location}</div>}
        {s.performance_notes && (
          <div className="text-sm text-base mt-1">
            {s.performance_notes}
          </div>
        )}

        <div className="flex gap-4 mt-2 text-sm">
          <EditButton
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/fitness/sports/${s.id}/edit`);
            }}
          />
          <SharedDeleteButton
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(s.id);
            }}
            size="sm"
            aria-label="Delete sport entry"
            label="Delete"
          />
        </div>
      </li>
    ));
  }, [hasInitialized, sessionsLoading, user, sessions, router, handleDelete]);

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Sports & Activities"
      subtitle="Track your sports activities and games"
      icon={Goal}
      iconBgColor="bg-green-500/10"
      iconColor="text-green-500"
      maxWidth="max-w-4xl"
      data-testid="sports-activities-modal"
    >
      {/* Start Activity Button */}
      <div className="flex justify-center">
        {activeSportsId ? (
          <Button
            variant="success"
            size="lg"
            onClick={handleStartActivity}
            data-testid="sports-in-progress-button"
            className="flex items-center gap-2"
          >
            <Goal className="w-4 h-4" />
            Continue Activity
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleStartActivity}
            data-testid="start-activity-button"
            className="flex items-center gap-2"
          >
            <Goal className="w-4 h-4" />
            Start New Activity
          </Button>
        )}
      </div>

      {/* Sports History */}
      <div className="space-y-3 min-h-[300px] relative" data-testid="sports-list">
        {content}
      </div>
    </BaseModal>
  );
} 