"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import Link from 'next/link';
import dynamic from "next/dynamic";
const UtensilsCrossed = dynamic(() => import("lucide-react/dist/esm/icons/utensils-crossed"), { ssr: false });
const CirclePlus = dynamic(() => import("lucide-react/dist/esm/icons/circle-plus"), { ssr: false });
import Button from '@/components/shared/Button';
import { useMealsQuery, useDeleteMealMutation } from '@/lib/hooks/useMeals';
import AddMealModal from '@/components/modals/AddMealModal';
import { MdClose } from 'react-icons/md';

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
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6">
        <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative">
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        </div>
      </div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-6 transition-opacity duration-200">
      <div className="bg-surface rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] md:max-h-[85vh] overflow-y-auto relative transform transition-all duration-200 ease-out">
        {/* Header */}
        <div className="sticky top-0 bg-surface border-b border-border/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500/10 rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Meals</h2>
                <p className="text-sm text-gray-400">Browse and manage your saved meal recipes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
              aria-label="Close modal"
            >
              <MdClose className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Add Meal Button */}
          <div className="flex justify-center">
            <Button
              onClick={() => setShowAddMealModal(true)}
              variant="primary"
              size="lg"
              className="flex items-center gap-2"
            >
              <CirclePlus className="w-5 h-5" />
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
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(meal.id)}
                    aria-label="Delete meal"
                    loading={deleteMealMutation.isPending && deleteMealMutation.variables === meal.id}
                    disabled={deleteMealMutation.isPending}
                    className="ml-4"
                  >
                    🗑️ Delete
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add Meal Modal */}
        <AddMealModal 
          isOpen={showAddMealModal}
          onClose={() => setShowAddMealModal(false)}
          onSuccess={() => {
            refetch();
          }}
        />
      </div>
    </div>
  );
} 