"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import dynamic from "next/dynamic";
const UtensilsCrossed = dynamic(() => import("lucide-react/dist/esm/icons/utensils-crossed"), { ssr: false });
import Button from '@/components/Button';
import { useMeals } from '@/lib/hooks/useMeals';

export default function MealsPage() {
  const { user, loading } = useUser();
  const router = useRouter();
  const [meals, setMeals] = useState([]);
  const [mealsLoading, setMealsLoading] = useState(true);
  const [loadingId, setLoadingId] = useState(null);
  const { fetchMeals, deleteMeal } = useMeals();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [loading, user, router]);

  useEffect(() => {
    async function loadMeals() {
      if (!user) return;
      setMealsLoading(true);
      const data = await fetchMeals(user.id);
      if (data) setMeals(data);
      setMealsLoading(false);
    }
    if (user) loadMeals();
  }, [user, fetchMeals, router]);

  // --- DELETE HANDLER ---
  const handleDelete = async (mealId) => {
    setLoadingId(mealId);
    const success = await deleteMeal(mealId);
    if (success) {
      setMeals((prev) => prev.filter((meal) => meal.id !== mealId));
    }
    setLoadingId(null);
  };

  if (loading) return <LoadingSpinner />;
  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <UtensilsCrossed className="w-5 h-5 text-base mr-2 inline-block" />
        Meals
      </h1>
      <p className="text-base">Browse and manage your saved meal recipes.</p>

      {mealsLoading ? (
        <LoadingSpinner />
      ) : meals.length === 0 ? (
        <p className="text-muted-foreground text-sm">No entries yet. Add one above ⬆️</p>
      ) : (
        <ul className="space-y-4">
          {meals.map((meal) => (
            <li key={meal.id} className="flex items-center justify-between">
              <Link href={`/food/meals/${meal.id}`} className="flex-1 min-w-0">
                <div className="bg-surface hover:bg-[#2e2e2e] transition p-4 rounded shadow cursor-pointer">
                  <h2 className="text-xl font-semibold text-white truncate">{meal.name}</h2>
                  {meal.description && (
                    <p className="text-base mt-1">{meal.description}</p>
                  )}
                  <p className="text-sm text-base mt-2">
                    Prep: {meal.prep_time || 0} min • Cook: {meal.cook_time || 0} min • Servings: {meal.servings || 1}
                  </p>
                </div>
              </Link>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(meal.id)}
                aria-label="Delete meal"
                loading={loadingId === meal.id}
              >
                🗑️ Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
