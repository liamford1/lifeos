"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import dynamic from "next/dynamic";
const UtensilsCrossed = dynamic(() => import("lucide-react/dist/esm/icons/utensils-crossed"), { ssr: false });
const CirclePlus = dynamic(() => import("lucide-react/dist/esm/icons/circle-plus"), { ssr: false });
import Button from '@/components/shared/Button';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealsQuery, useDeleteMealMutation } from '@/lib/hooks/useMeals';
import AddMealModal from '@/components/modals/AddMealModal';
import BaseModal from '@/components/shared/BaseModal';

export default function MealsModal({ isOpen, onClose }) {
  const { user, loading: userLoading } = useUser();
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  
  // Use React Query for data fetching
  const { data: meals = [], isLoading: mealsLoading, error, refetch } = useMealsQuery(user?.id);
  const deleteMealMutation = useDeleteMealMutation();

  // Don't render if not open
  if (!isOpen) return null;

  // Show loading spinner when user is loading
  if (userLoading) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Loading..."
        subtitle="Please wait"
        icon={UtensilsCrossed}
        iconBgColor="bg-purple-500/10"
        iconColor="text-purple-500"
      >
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </BaseModal>
    );
  }

  // Don't render if user is not authenticated
  if (!user) {
    return null;
  }

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

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Meals"
      subtitle="Browse and manage your saved meal recipes"
      icon={UtensilsCrossed}
      iconBgColor="bg-purple-500/10"
      iconColor="text-purple-500"
    >
          {/* Add Meal Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAddMealModal(true)}
              variant="secondary"
              size="lg"
              className="w-full max-w-md"
            >
              <CirclePlus className="w-5 h-5 mr-2" />
              Add Meal
            </Button>
          </div>

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
            <div className="text-center py-8 space-y-3">
              <div className="w-12 h-12 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                <UtensilsCrossed className="w-6 h-6 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium">No meals yet</h3>
                <p className="text-sm text-gray-400">Add one above to get started</p>
              </div>
            </div>
          ) : (
            <ul className="space-y-4">
              {meals.map((meal) => (
                <li key={meal.id} className="flex items-center justify-between">
                  <Link href={`/food/meals/${meal.id}`} className="flex-1 min-w-0">
                    <div className="bg-card hover:bg-[#2e2e2e] transition p-4 rounded shadow cursor-pointer border border-border">
                      <h2 className="text-xl font-semibold text-white truncate">{meal.name}</h2>
                      {meal.description && (
                        <p className="text-base mt-1">{meal.description}</p>
                      )}
                      <p className="text-sm text-gray-400 mt-2">
                        Prep: {meal.prep_time || 0} min • Cook: {meal.cook_time || 0} min • Servings: {meal.servings || 1}
                      </p>
                    </div>
                  </Link>
                  <SharedDeleteButton
                    onClick={() => handleDelete(meal.id)}
                    size="sm"
                    disabled={deleteMealMutation.isPending}
                    className="ml-4"
                  />
                </li>
              ))}
            </ul>
          )}

        {/* Add Meal Modal */}
        <AddMealModal 
          isOpen={showAddMealModal}
          onClose={() => setShowAddMealModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
    </BaseModal>
  );
} 