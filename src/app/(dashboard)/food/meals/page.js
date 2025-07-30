"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import BackButton from '@/components/BackButton';
import dynamic from "next/dynamic";
const UtensilsCrossed = dynamic(() => import("lucide-react/dist/esm/icons/utensils-crossed"), { ssr: false });
import Button from '@/components/Button';
import { useMealsQuery, useDeleteMealMutation } from '@/lib/hooks/useMeals';

export default function MealsPage() {
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  
  // Use React Query for data fetching
  const { data: meals = [], isLoading: mealsLoading, error } = useMealsQuery(user?.id);
  const deleteMealMutation = useDeleteMealMutation();

  useEffect(() => {
    if (!userLoading && !user) {
      router.push('/auth');
    }
  }, [userLoading, user, router]);

  // Handle delete with optimistic updates
  const handleDelete = async (mealId) => {
    deleteMealMutation.mutate({ 
      id: mealId, 
      options: {
        onSuccess: () => {
          // The mutation will handle the success toast
        },
        onError: (error) => {
          // The mutation will handle the error toast
        }
      }
    });
  };

  // Show loading spinner only when user is loading or when we don't have user data yet
  if (userLoading || (!user && !userLoading)) {
    return <LoadingSpinner />;
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      <BackButton />
      <h1 className="text-2xl font-bold flex items-center">
        <UtensilsCrossed className="w-5 h-5 text-base mr-2 inline-block" />
        Meals
      </h1>
      <p className="text-base">Browse and manage your saved meal recipes.</p>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500">Error loading meals: {error.message}</p>
        </div>
      )}

      {/* Loading state - only show when meals are loading and we have a user */}
      {mealsLoading && user ? (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
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
                loading={deleteMealMutation.isPending && deleteMealMutation.variables === meal.id}
                disabled={deleteMealMutation.isPending}
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
