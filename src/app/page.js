'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function HomePage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if a user is already logged in
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Optional: reload or redirect
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
      <ul className="space-y-2">
        <li><a href="/food/inventory" className="text-blue-500 underline">🧺 View Pantry</a></li>
        <li><a href="/food/addreceipt" className="text-blue-500 underline">➕ Add Pantry Item</a></li>
        <li><a href="/food/meals" className="text-blue-500 underline">📖 View Meals</a></li>
        <li><a href="/food/addmeal" className="text-blue-500 underline">➕ Add a Meal</a></li>
        <li><a href="/food/planner" className="text-blue-500 underline">🗓️ Plan Meals</a></li>
      </ul>
    </main>
  );
}
