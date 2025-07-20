'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { Goal } from 'lucide-react';

export default function SportsDashboard() {
  const { showSuccess, showError } = useToast();
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      setSessionsLoading(true);
      const { data, error } = await supabase
        .from('fitness_sports')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setSessions(data);
      }
      setSessionsLoading(false);
    };

    fetchSessions();
  }, []);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;

    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      showError('You must be logged in.');
      return;
    }

    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_sports',
      id: id,
      user_id: user_id,
      source: 'sports',
    });

    if (error) {
      console.error(error);
      showError('Failed to delete session.');
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      showSuccess('Sport session deleted successfully!');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <Goal className="w-5 h-5 text-base mr-2 inline-block" />
        Sports
      </h1>
      <p className="text-base">Track your sports activities and games.</p>

      <Link href="/fitness/sports/add" className="text-blue-600 underline mb-6 inline-block">
        ➕ Add Sports Session
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
              {s.notes && (
                <div className="text-sm text-base mt-1">
                  {s.notes}
                </div>
              )}

              <div className="flex gap-4 mt-2 text-sm">
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/fitness/sports/${s.id}?edit=true`);
                  }}
                  variant="link"
                  size="sm"
                  className="text-blue-500 hover:text-blue-700"
                >
                  ✏️ Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(s.id)}
                  aria-label="Delete sport entry"
                  loading={false} // Placeholder for loading state if needed, currently not used in this component
                >
                  🗑️ Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
