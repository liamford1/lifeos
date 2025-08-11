'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import Button from '@/components/shared/Button';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { useToast } from '@/components/client/Toast';
import { useCookingSession } from '@/context/CookingSessionContext';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealQuery } from '@/lib/hooks/useMeals';
import { useUser } from '@/context/UserContext';
import EnhancedModal, { ModalFormActions } from '@/components/shared/EnhancedModal';
import { UtensilsCrossed } from 'lucide-react';

export default function CookingSessionModal({ isOpen, onClose, mealId }) {
  const { showSuccess, showError } = useToast();
  const { user, loading: userLoading } = useUser();
  const didHandleDeletedMeal = useRef(false);
  const [sessionStarted, setSessionStarted] = useState(0);

  // Use React Query for data fetching
  const { 
    data: meal, 
    isLoading: mealLoading, 
    error: mealError 
  } = useMealQuery(mealId, user?.id);

  const {
    mealId: cookingMealId,
    currentStep,
    instructions: cookingInstructions,
    startCooking,
    nextStep,
    previousStep,
    endCooking,
    cancelCooking,
    isCooking,
    loading: sessionLoading,
  } = useCookingSession();

  // Parse instructions as string array
  const parsedInstructions = useMemo(() => {
    return Array.isArray(meal?.instructions)
      ? meal.instructions
      : (typeof meal?.instructions === 'string' && meal.instructions.trim()
          ? meal.instructions.split('\n').map(s => s.trim()).filter(Boolean)
          : []);
  }, [meal?.instructions]);

  const isThisMealActive = isCooking && cookingMealId === meal?.id;

  // Handler for Start Cooking button
  const handleCookMeal = () => {
    if (!meal) return;
    startCooking(meal.id, parsedInstructions);
    setSessionStarted((n) => n + 1);
  };

  // Handle the case where the meal being cooked is deleted
  useEffect(() => {
    if (!meal && isCooking && cookingMealId === mealId && !didHandleDeletedMeal.current) {
      didHandleDeletedMeal.current = true;
      endCooking();
      showError("The meal you're cooking was deleted.");
      onClose();
    }
  }, [meal, isCooking, cookingMealId, mealId, endCooking, showError, onClose]);

  // Show error state for missing meal
  if (!meal && !mealLoading && !userLoading) {
    return (
      <EnhancedModal
        isOpen={isOpen}
        onClose={onClose}
        title="Meal Not Found"
        subtitle="The meal you're looking for doesn't exist or you don't have permission to view it."
        icon={UtensilsCrossed}
        iconBgColor="bg-red-500/10"
        iconColor="text-red-500"
        maxWidth="max-w-2xl"
        empty={true}
        emptyTitle="Meal Not Found"
        emptyMessage="The meal you're looking for doesn't exist or you don't have permission to view it."
        emptyIcon={UtensilsCrossed}
      />
    );
  }

  return (
    <EnhancedModal
      isOpen={isOpen}
      onClose={onClose}
      title={meal?.name || "Cooking Session"}
      subtitle={meal?.description}
      icon={UtensilsCrossed}
      iconBgColor="bg-orange-500/10"
      iconColor="text-orange-500"
      maxWidth="max-w-2xl"
      loading={userLoading || sessionLoading || mealLoading}
      loadingTitle="Loading Meal"
      loadingSubtitle="Preparing cooking session..."
      error={mealError}
      errorTitle="Error Loading Meal"
      errorMessage={mealError?.message}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-surface p-4 rounded-lg border border-border">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          {parsedInstructions.length > 0 ? (
            <ol className="list-decimal list-inside space-y-2 text-base">
              {parsedInstructions.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          ) : (
            <div className="text-muted-foreground text-sm italic">No instructions provided.</div>
          )}
        </div>

        {/* Start Cooking button if not already in session for this meal */}
        {!isCooking && parsedInstructions.length > 0 && (
          <Button onClick={handleCookMeal} variant="primary" className="w-full">
            Start Cooking
          </Button>
        )}

        {/* Cooking session controls */}
        {isThisMealActive ? (
          <div className="space-y-4">
            <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
              <h2 className="text-xl font-semibold mb-2">Step {currentStep}</h2>
              <p className="text-base" data-testid="current-step">
                {cookingInstructions[currentStep - 1] || "No step found."}
              </p>
            </div>
            
            <div className="flex gap-4">
              {currentStep > 1 && (
                <Button onClick={previousStep} variant="secondary">
                  Previous Step
                </Button>
              )}
              {currentStep < cookingInstructions.length ? (
                <Button onClick={nextStep} variant="primary">
                  Next Step
                </Button>
              ) : (
                <Button 
                  onClick={() => {
                    endCooking();
                    showSuccess('Cooking session completed!');
                    onClose();
                  }} 
                  variant="success"
                >
                  Finish Cooking
                </Button>
              )}
            </div>
            
            <Button 
              onClick={() => {
                cancelCooking();
                onClose();
              }} 
              variant="danger"
              className="w-full"
            >
              Cancel Cooking Session
            </Button>
          </div>
        ) : null}

        {/* Close button when not cooking */}
        {!isThisMealActive && (
          <Button onClick={onClose} variant="secondary" className="w-full">
            Close
          </Button>
        )}
      </div>
    </EnhancedModal>
  );
}
