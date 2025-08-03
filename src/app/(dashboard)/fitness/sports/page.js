"use client";

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/utils/deleteUtils';
import BackButton from '@/components/shared/BackButton';
import Button from '@/components/shared/Button';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import dynamic from "next/dynamic";
const Goal = dynamic(() => import("lucide-react/dist/esm/icons/goal"), { ssr: false });
import { format } from 'date-fns';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';
import { useSportsSession } from '@/context/SportsSessionContext';

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

export default function SportsDashboard() {
  const { user, loading: userLoading } = useUser();
  const { activeSportsId } = useSportsSession();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { fetchSportsSessions, deleteSportsSession } = useSportsSessions();
  
  // Memoize fetchSportsSessions to avoid unnecessary effect reruns
  const memoizedFetchSportsSessions = useCallback(fetchSportsSessions, []);

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  useEffect(() => {
    let isMounted = true;
    
    async function loadSessions() {
      if (!userId) {
        if (isMounted) {
          setSessionsLoading(false);
          setHasInitialized(true);
        }
        return;
      }
      
      if (isMounted) {
        setSessionsLoading(true);
      }
      
      try {
        const data = await memoizedFetchSportsSessions(userId);
        if (isMounted) {
          setSessions(data || []);
          setSessionsLoading(false);
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('Error loading sports sessions:', error);
        if (isMounted) {
          setSessionsLoading(false);
          setHasInitialized(true);
        }
      }
    }
    
    loadSessions();
    
    return () => { 
      isMounted = false; 
    };
  }, [userId, memoizedFetchSportsSessions]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;
    if (!user) return;
    const success = await deleteSportsSession(id, user.id);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  const handleStartActivity = () => {
    if (!user) return router.push('/auth');
    router.push('/fitness/sports/live');
  };

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
  }, [hasInitialized, sessionsLoading, user, sessions, router]);

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <Goal className="w-5 h-5 text-base mr-2 inline-block" />
        Sports
      </h1>
      <p className="text-base">Track your sports activities and games.</p>

      <div className="flex gap-4 mb-4">
        {activeSportsId ? (
          <Button
            variant="success"
            onClick={handleStartActivity}
            data-testid="sports-in-progress-button"
          >
            Continue Activity
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleStartActivity}
            data-testid="start-activity-button"
          >
            Start Activity
          </Button>
        )}
      </div>

      <h2 className="text-xl font-semibold mb-2">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Sports History
      </h2>

      {/* Stable container with consistent height */}
      <div className="space-y-3 min-h-[300px] relative" data-testid="sports-list">
        {content}
      </div>
    </div>
  );
}
