"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/shared/BackButton';
import Button from '@/components/shared/Button';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/components/client/Toast';
import { MdOutlineCalendarToday } from 'react-icons/md';
import dynamic from "next/dynamic";
const HeartPulse = dynamic(() => import("lucide-react/dist/esm/icons/heart-pulse"), { ssr: false });
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import { useCardioSessions } from '@/lib/hooks/useCardioSessions';

export default function CardioDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { fetchCardioSessions, deleteCardioSession } = useCardioSessions();
  // Memoize fetchCardioSessions to avoid unnecessary effect reruns
  const memoizedFetchCardioSessions = useCallback(fetchCardioSessions, []);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    let isMounted = true;
    async function loadSessions() {
      if (!user) {
        if (isMounted) setSessionsLoading(false);
        return;
      }
      setSessionsLoading(true);
      const data = await memoizedFetchCardioSessions(user.id);
      if (isMounted) {
        setSessions(data || []);
        setSessionsLoading(false);
      }
    }
    loadSessions();
    return () => { isMounted = false; };
  }, [user, memoizedFetchCardioSessions]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;
    if (!user) return;
    const success = await deleteCardioSession(id, user.id);
    if (success) {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <HeartPulse className="w-5 h-5 text-base mr-2 inline-block" />
        Cardio
      </h1>
      <p className="text-base">Track your running, cycling, and other cardio activities.</p>

      <div className="flex gap-4 mb-4">
        <Button
          variant="primary"
          onClick={() => router.push('/fitness/cardio/live')}
          data-testid="start-cardio-button"
        >
          Start Cardio
        </Button>
      </div>

      <h2 className="text-xl font-semibold mb-2">
        <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
        Cardio History
      </h2>

      {/* Simplified loading logic */}
      {(loading || sessionsLoading) ? (
        <LoadingSpinner />
      ) : !user ? (
        null
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No cardio sessions yet. Click &quot;Start Cardio&quot; to begin tracking your first session.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
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
          ))}
        </ul>
      )}
    </div>
  );
}
