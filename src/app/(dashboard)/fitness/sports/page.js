"use client";

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MdOutlineCalendarToday } from 'react-icons/md';
import dynamic from "next/dynamic";
const Goal = dynamic(() => import("lucide-react/dist/esm/icons/goal"), { ssr: false });
import SharedDeleteButton from '@/components/SharedDeleteButton';
import EditButton from '@/components/EditButton';
import { useSportsSessions } from '@/lib/hooks/useSportsSessions';
import { useSportsSession } from '@/context/SportsSessionContext';

export default function SportsDashboard() {
  const { user, loading } = useUser();
  const router = useRouter();
  const { activeSportsId } = useSportsSession();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const { fetchSportsSessions, deleteSportsSession } = useSportsSessions();
  // Memoize fetchSportsSessions to avoid unnecessary effect reruns
  const memoizedFetchSportsSessions = useCallback(fetchSportsSessions, []);

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
      const data = await memoizedFetchSportsSessions(user.id);
      if (isMounted) {
        setSessions(data || []);
        setSessionsLoading(false);
      }
    }
    loadSessions();
    return () => { isMounted = false; };
  }, [user, memoizedFetchSportsSessions]);

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

      {/* Simplified loading logic */}
      {(loading || sessionsLoading) ? (
        <LoadingSpinner />
      ) : !user ? (
        null
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
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
          ))}
        </ul>
      )}
    </div>
  );
}
