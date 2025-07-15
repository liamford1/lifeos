'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';
import BackButton from '@/components/BackButton';
import Button from '@/components/Button';

export default function CardioDashboard() {
  const [sessions, setSessions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('fitness_cardio')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setSessions(data);
      }
    };

    fetchSessions();
  }, []);

  const handleDelete = async (id) => {
    const confirm = window.confirm('Delete this session?');
    if (!confirm) return;

    const user = await supabase.auth.getUser();
    const user_id = user?.data?.user?.id;
    
    if (!user_id) {
      alert('You must be logged in.');
      return;
    }

    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_cardio',
      id: id,
      user_id: user_id,
      source: 'cardio',
    });

    if (error) {
      console.error(error);
      alert('Failed to delete session.');
    } else {
      setSessions((prev) => prev.filter((s) => s.id !== id));
    }
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <BackButton />
      <h1 className="text-2xl font-bold mb-4">🏃 Cardio</h1>

      <Link href="/fitness/cardio/add" className="text-blue-600 underline mb-6 inline-block">
        ➕ Add Cardio Session
      </Link>

      {sessions.length === 0 ? (
        <p>No cardio sessions logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              onClick={() => router.push(`/fitness/cardio/${s.id}`)}
              className="border p-3 rounded shadow-sm cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="font-semibold text-lg">{s.activity_type || 'Cardio'}</div>
              <div className="text-sm text-gray-600">{s.date}</div>
              <div className="text-sm text-gray-500">
                ⏱️ {s.duration_minutes ?? '-'} min
                {s.distance_miles && ` — 📏 ${s.distance_miles} mi`}
              </div>
              {s.location && <div className="text-sm text-gray-500">📍 {s.location}</div>}
              {s.notes && (
                <div className="text-sm text-gray-700 mt-1">
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
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.id);
                  }}
                  variant="link"
                  size="sm"
                  className="text-red-500 hover:text-red-700"
                >
                  🗑️ Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
