'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';

export default function SportsDashboard() {
  const [sessions, setSessions] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('fitness_sports')
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

    const { error } = await supabase.from('fitness_sports').delete().eq('id', id);
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
      <h1 className="text-2xl font-bold mb-4">🏀 Sports & Activities</h1>

      <Link href="/fitness/sports/add" className="text-blue-600 underline mb-6 inline-block">
        ➕ Add Sport Session
      </Link>

      {sessions.length === 0 ? (
        <p>No sports sessions logged yet.</p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              onClick={() => router.push(`/fitness/sports/${s.id}`)}
              className="border p-3 rounded shadow-sm cursor-pointer hover:bg-gray-50 transition"
            >
              <div className="font-semibold text-lg">{s.activity_type || 'Sport'}</div>
              <div className="text-sm text-gray-600">{s.date}</div>
              <div className="text-sm text-gray-500">
                ⏱️ {s.duration_minutes ?? '-'} min — 💥 {s.intensity_level || 'N/A'}
              </div>
              {s.score && <div className="text-sm text-gray-500">🏆 Score: {s.score}</div>}
              {s.location && <div className="text-sm text-gray-500">📍 {s.location}</div>}
              {s.performance_notes && (
                <div className="text-sm text-gray-700 mt-1">
                  {s.performance_notes}
                </div>
              )}

              <div className="flex gap-4 mt-2 text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/fitness/sports/${s.id}?edit=true`);
                  }}
                  className="text-blue-500 hover:underline"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(s.id);
                  }}
                  className="text-red-500 hover:underline"
                >
                  🗑️ Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
