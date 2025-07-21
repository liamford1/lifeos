"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import dynamic from "next/dynamic";
const HeartPulse = dynamic(() => import("lucide-react/dist/esm/icons/heart-pulse"), { ssr: false });
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useCardioSessions } from '@/lib/hooks/useCardioSessions';

export default function CardioDashboard() {
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const router = useRouter();
  const { fetchCardioSessions, deleteCardioSession } = useCardioSessions();

  useEffect(() => {
    const fetchData = async () => {
      setSessionsLoading(true);
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;
      if (!userId) {
        setSessions([]);
        setSessionsLoading(false);
        return;
      }
      const data = await fetchCardioSessions(userId);
      setSessions(data || []);
      setSessionsLoading(false);
    };
    fetchData();
  }, [fetchCardioSessions]);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;
    const user = await supabase.auth.getUser();
    const userId = user?.data?.user?.id;
    if (!userId) return;
    const success = await deleteCardioSession(id, userId);
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

      <Link href="/fitness/cardio/add" className="text-blue-600 underline mb-6 inline-block">
        ➕ Add Cardio Session
      </Link>

      {sessionsLoading ? (
        <LoadingSpinner />
      ) : sessions.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
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
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/fitness/cardio/${s.id}?edit=true`);
                  }}
                  variant="link"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700"
                >
                  ✏️ Edit
                </Button>
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
