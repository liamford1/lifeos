'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import BackButton from '@/components/BackButton';

export default function MealsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user]);

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

      setMealsLoading(false);
    }

    fetchMeals();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <>
      <BackButton />
      <h1 className="text-2xl font-bold mb-6">📖 Your Saved Meals</h1>

      {mealsLoading ? (
        <LoadingSpinner />
      ) : meals.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
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
    </>
  );
}
