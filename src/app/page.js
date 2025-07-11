'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    window.location.reload();
  };

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome to Your Life Planner</h1>

      {user ? (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Signed in as <strong>{user.email}</strong>
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Log Out
          </button>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Not signed in</p>
          <a
            href="/auth"
            className="mt-2 inline-block px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log In
          </a>
        </div>
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">🍽️ Food / Diet</h2>
      <ul className="space-y-2 mb-6">
        <li><a href="/food" className="text-blue-500 underline">🍽️ Open Food Dashboard</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">💸 Finances</h2>
      <ul className="space-y-2 mb-6">
        <li><a href="/finances" className="text-blue-500 underline">💸 Open Finances Dashboard</a></li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">🧠 Thoughts / Scratchpad</h2>
      <ul className="space-y-2">
        <li><a href="/scratchpad" className="text-blue-500 underline">💡 Open Scratchpad</a></li>
      </ul>
    </main>
  );
}
