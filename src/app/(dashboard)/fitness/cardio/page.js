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
const HeartPulse = dynamic(() => import("lucide-react/dist/esm/icons/heart-pulse"), { ssr: false });
import { format } from 'date-fns';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import { useCardioSessions } from '@/lib/hooks/useCardioSessions';

// Skeleton component for cardio items
function CardioSkeleton() {
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

export default function CardioDashboard() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  const { fetchCardioSessions, deleteCardioSession } = useCardioSessions();
  
  // Memoize fetchCardioSessions to avoid unnecessary effect reruns
  const memoizedFetchCardioSessions = useCallback(fetchCardioSessions, []);

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
        const data = await memoizedFetchCardioSessions(userId);
        if (isMounted) {
          setSessions(data || []);
          setSessionsLoading(false);
          setHasInitialized(true);
        }
      } catch (error) {
        console.error('Error loading cardio sessions:', error);
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
  }, [userId, memoizedFetchCardioSessions]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;
    if (!user) return;
    const success = await deleteCardioSession(id, user.id);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Determine what to render - memoized to prevent unnecessary re-renders
  const content = useMemo(() => {
    // Don't render anything until we've initialized
    if (!hasInitialized) {
      return Array.from({ length: 3 }).map((_, index) => (
        <CardioSkeleton key={`skeleton-${index}`} />
      ));
    }
    
    if (sessionsLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <CardioSkeleton key={`skeleton-${index}`} />
      ));
    }
    
    if (!user) {
      return null;
    }
    
    if (sessions.length === 0) {
      return (
        <div className="border p-8 rounded shadow-sm text-center">
          <p className="text-muted-foreground text-sm">
            No cardio sessions yet. Click &quot;Start Cardio&quot; to begin tracking your first session.
          </p>
        </div>
      );
    }
    
    return sessions.map((s) => (
      <li
        key={s.id}
        onClick={() => router.push(`/fitness/cardio/${s.id}`)}
        className="border p-3 rounded shadow-sm cursor-pointer hover:bg-[#2e2e2e] transition"
      >
        <div className="font-semibold text-lg">{s.activity_type || 'Cardio'}</div>
        <div className="text-sm text-base">{s.date}</div>
        <div className="text-sm text-base">
          ⏱️ {s.duration_minutes ?? '-'} min
          {s.distance_miles && ` — 📏 ${s.distance_miles} mi`}
        </div>
        {s.location && <div className="text-sm text-base">📍 {s.location}</div>}
        {s.notes && (
          <div className="text-sm text-base mt-1">
            {s.notes}
          </div>
        )}

        <div className="flex gap-4 mt-2 text-sm">
          <EditButton
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/fitness/cardio/${s.id}/edit`);
            }}
          />
          <SharedDeleteButton
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(s.id);
            }}
            size="sm"
            aria-label="Delete cardio session"
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
        <HeartPulse className="w-5 h-5 text-base mr-2 inline-block" />
        Cardio
      </h1>
      <p className="text-base">Track your running, cycling, and other cardio activities.</p>

      <h2 className="text-xl font-semibold mb-2">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Cardio History
      </h2>

      {/* Stable container with consistent height */}
      <div className="space-y-3 min-h-[300px] relative">
        {content}
      </div>
    </div>
  );
}
