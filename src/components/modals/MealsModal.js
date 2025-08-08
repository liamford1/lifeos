"use client";

import { useEffect, useState } from 'react';
import { useUser } from '@/context/UserContext';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import dynamic from "next/dynamic";
const UtensilsCrossed = dynamic(() => import("lucide-react/dist/esm/icons/utensils-crossed"), { ssr: false });
const CirclePlus = dynamic(() => import("lucide-react/dist/esm/icons/circle-plus"), { ssr: false });
import Button from '@/components/shared/Button';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealsQuery, useDeleteMealMutation } from '@/lib/hooks/useMeals';
import AddMealModal from '@/components/modals/AddMealModal';
import AIMealSuggestionsModal from '@/components/forms/AIMealSuggestionsModal';
import MealDetailsModal from '@/components/modals/MealDetailsModal';
import BaseModal from '@/components/shared/BaseModal';
import { MdLightbulb } from 'react-icons/md';

export default function MealsModal({ isOpen, onClose }) {
  const { user, loading: userLoading } = useUser();
  const [showAddMealModal, setShowAddMealModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showMealDetailsModal, setShowMealDetailsModal] = useState(false);
  const [selectedMealId, setSelectedMealId] = useState(null);
  
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

  // Handle AI meal added
  const handleAIMealAdded = () => {
    refetch();
  };

  // Handle meal click to show details
  const handleMealClick = (mealId) => {
    setSelectedMealId(mealId);
    setShowMealDetailsModal(true);
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
      <div className="space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-between">
          <Button
            onClick={() => setShowAIModal(true)}
            variant="secondary"
            size="md"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <MdLightbulb className="w-4 h-4 text-yellow-300" />
            AI Suggestions
          </Button>
          
          <Button
            onClick={() => setShowAddMealModal(true)}
            variant="secondary"
            size="md"
            className="flex items-center justify-center gap-2"
          >
            <CirclePlus className="w-4 h-4" />
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
              <li key={meal.id} className="group relative">
                <div 
                  onClick={() => handleMealClick(meal.id)}
                  className="bg-card hover:bg-[#2e2e2e] transition p-4 rounded shadow cursor-pointer border border-border pr-12"
                >
                  <h2 className="text-xl font-semibold text-white truncate">{meal.name}</h2>
                  {meal.description && (
                    <p className="text-base mt-1">{meal.description}</p>
                  )}
                  <p className="text-sm text-gray-400 mt-2">
                    Prep: {meal.prep_time || 0} min • Cook: {meal.cook_time || 0} min • Servings: {meal.servings || 1}
                  </p>
                </div>
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <SharedDeleteButton
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(meal.id);
                    }}
                    label=""
                    size="sm"
                    disabled={deleteMealMutation.isPending}
                    className="w-8 h-8 p-0 flex items-center justify-center"
                  />
                </div>
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

      {/* AI Meal Suggestions Modal */}
      {showAIModal && (
        <AIMealSuggestionsModal
          onClose={() => setShowAIModal(false)}
          onMealAdded={handleAIMealAdded}
        />
      )}

      {/* Meal Details Modal */}
      <MealDetailsModal
        isOpen={showMealDetailsModal}
        onClose={() => setShowMealDetailsModal(false)}
        mealId={selectedMealId}
      />
    </BaseModal>
  );
} 