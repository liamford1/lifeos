'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

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
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Your Saved Meals</h1>

      {loading ? (
        <p>Loading...</p>
      ) : meals.length === 0 ? (
        <p>No meals saved yet. <Link href="/addmeal" className="text-blue-600 underline">Add one</Link></p>
      ) : (
        <ul className="space-y-4">
          {meals.map((meal) => (
            <li key={meal.id} className="border p-4 rounded shadow-sm hover:shadow transition">
              <Link href={`/meals/${meal.id}`}>
                <div>
                  <h2 className="text-xl font-semibold">{meal.name}</h2>
                  {meal.description && (
                    <p className="text-gray-600 mt-1">{meal.description}</p>
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
    </div>
  );
}
