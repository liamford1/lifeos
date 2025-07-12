'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import AppBar from '@/components/AppBar';
import BackButton from '@/components/BackButton';

export default function MealsPage() {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMeals() {
      const user = await supabase.auth.getUser();
      const userId = user?.data?.user?.id;

      if (!userId) return;

      const { data, error } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(error);
      } else {
        setMeals(data);
      }

      setLoading(false);
    }

    fetchMeals();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <AppBar />

      <main className="flex flex-grow overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-800 p-6 overflow-auto">
          <nav className="flex flex-col gap-4">
            <a href="/food" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🍽️ Food / Diet</a>
            <a href="/fitness" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🏋️ Fitness</a>
            <a href="/finances" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">💸 Finances</a>
            <a href="/scratchpad" className="block p-4 bg-gray-700 rounded shadow hover:bg-gray-600 text-center font-semibold">🧠 Scratchpad</a>
          </nav>
        </aside>

        {/* Page Content */}
        <section className="flex-grow p-8 overflow-auto">
          <BackButton />
          <h1 className="text-2xl font-bold mb-6">📖 Your Saved Meals</h1>

          {loading ? (
            <p>Loading...</p>
          ) : meals.length === 0 ? (
            <p className="text-gray-400">
              No meals saved yet.{' '}
              <Link href="/food/addmeal" className="text-blue-400 underline hover:text-blue-300">
                Add one
              </Link>
            </p>
          ) : (
            <ul className="space-y-4">
              {meals.map((meal) => (
                <li key={meal.id}>
                  <Link href={`/food/meals/${meal.id}`}>
                    <div className="bg-gray-800 hover:bg-gray-700 transition p-4 rounded shadow cursor-pointer">
                      <h2 className="text-xl font-semibold text-white">{meal.name}</h2>
                      {meal.description && (
                        <p className="text-gray-300 mt-1">{meal.description}</p>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        Prep: {meal.prep_time || 0} min • Cook: {meal.cook_time || 0} min • Servings: {meal.servings || 1}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
