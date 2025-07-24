'use client';
// src/app/(dashboard)/food/meals/[id]/cook/page.js
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { useCookingSession } from '@/context/CookingSessionContext';
import BackButton from '@/components/BackButton';
import SharedDeleteButton from '@/components/SharedDeleteButton';
import { useMealQuery } from '@/lib/hooks/useMeals';
import { useUser } from '@/context/UserContext';

export default function CookMealPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showSuccess, showError } = useToast();
  const { user, loading: userLoading } = useUser();
  const didHandleDeletedMeal = useRef(false);
  const [sessionStarted, setSessionStarted] = useState(0);

  // Use React Query for data fetching
  const { 
    data: meal, 
    isLoading: mealLoading, 
    error: mealError 
  } = useMealQuery(id, user?.id);

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

  // Parse instructions as string array (must be before any conditional returns)
  const parsedInstructions = Array.isArray(meal?.instructions)
    ? meal.instructions
    : (typeof meal?.instructions === 'string' && meal.instructions.trim()
        ? meal.instructions.split('\n').map(s => s.trim()).filter(Boolean)
        : []);

  const isThisMealActive = isCooking && cookingMealId === meal?.id;

  // TEMP DEBUG: Log context and parsedInstructions
  useEffect(() => {
    if (!meal) return;
    console.log('[CookPage] meal.id:', meal.id);
    console.log('[CookPage] parsedInstructions:', parsedInstructions);
    console.log('[CookPage] isCooking:', isCooking, 'cookingMealId:', cookingMealId, 'currentStep:', currentStep, 'instructions:', cookingInstructions);
  }, [meal?.id, parsedInstructions, isCooking, cookingMealId, currentStep, cookingInstructions]);

  // Handler for Cook Meal button
  const handleCookMeal = () => {
    if (!meal) return;
    console.log('[CookPage] Cook Meal button clicked');
    console.log('[CookPage] Calling startCooking with:', meal.id, parsedInstructions);
    startCooking(meal.id, parsedInstructions);
    setSessionStarted((n) => n + 1); // force re-render
    // Log context after
    setTimeout(() => {
      console.log('[CookPage] After startCooking: isCooking:', isCooking, 'cookingMealId:', cookingMealId, 'currentStep:', currentStep, 'instructions:', cookingInstructions);
    }, 100);
  };

  // Handle the case where the meal being cooked is deleted
  useEffect(() => {
    // Only run if a cooking session is active for this meal and the meal is missing
    if (!meal && isCooking && cookingMealId === id && !didHandleDeletedMeal.current) {
      didHandleDeletedMeal.current = true;
      endCooking();
      showError("The meal you're cooking was deleted.");
      router.replace('/food/meals');
      router.refresh(); // Force context consumers like AppBar to update
    }
  }, [meal, isCooking, cookingMealId, id, endCooking, showError, router]);

  // If a session is active for a different meal, redirect to that meal's cook page
  useEffect(() => {
    if (
      isCooking &&
      cookingMealId &&
      meal?.id &&
      cookingMealId !== meal.id
    ) {
      router.replace(`/food/meals/${cookingMealId}/cook`);
    }
  }, [isCooking, cookingMealId, meal?.id, router]);

  // Show loading spinner if session context is loading
  if (userLoading || sessionLoading || (!user && !userLoading)) {
    return <LoadingSpinner />;
  }

  // Don't render anything if user is not authenticated
  if (!user) {
    return null;
  }

  // Show loading state while fetching meal data
  if (mealLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show error state
  if (mealError) {
    return (
      <div className="p-6">
        <div className="text-red-400 text-center py-8">
          <h1 className="text-xl font-bold mb-4">Error Loading Meal</h1>
          <p>{mealError.message}</p>
          <Button 
            onClick={() => router.push('/food/meals')}
            variant="primary"
            className="mt-4"
          >
            Back to Meals
          </Button>
        </div>
      </div>
    );
  }

  // Show not found state
  if (!meal) {
    // If a session was just ended, the effect above will redirect
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <h1 className="text-xl font-bold mb-4">Meal Not Found</h1>
          <p>The meal you&rsquo;re looking for doesn&rsquo;t exist or you don&rsquo;t have permission to view it.</p>
          <Button 
            onClick={() => router.push('/food/meals')}
            variant="primary"
            className="mt-4"
          >
            Back to Meals
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* Back button or link at the top */}
      {!isThisMealActive && (
        <Button
          type="button"
          onClick={() => router.push(`/food/meals/${meal.id}`)}
          variant="secondary"
          className="mb-4"
        >
          ← Back to meal
        </Button>
      )}
      <h1 className="text-3xl font-bold">{meal.name}</h1>
      <p className="text-base">{meal.description}</p>
      <div className="bg-surface p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        {parsedInstructions.length > 0 ? (
          <ol className="list-decimal list-inside space-y-2">
            {parsedInstructions.map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        ) : (
          <div className="text-muted-foreground text-sm italic">No entries yet. Add one above ⬆️</div>
        )}
      </div>

      {/* Start Cooking button if not already in session for this meal */}
      {!isCooking && parsedInstructions.length > 0 && (
        <Button onClick={handleCookMeal} variant="primary">
          Start Cooking
        </Button>
      )}

      {/* Cooking session controls */}
      {isThisMealActive ? (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Step {currentStep}</h2>
          <p className="text-base mb-4" data-testid="current-step">{cookingInstructions[currentStep - 1] || "No step found."}</p>
          <div className="flex gap-4 mt-4">
            {currentStep > 1 && (
              <Button onClick={previousStep}>
                Previous Step
              </Button>
            )}
            {currentStep < cookingInstructions.length ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button onClick={endCooking} variant="success">
                Finish Cooking
              </Button>
            )}
          </div>
          <SharedDeleteButton
            onClick={() => {
              cancelCooking();
              router.push(`/food/meals/${meal.id}`);
            }}
            label="Cancel Cooking"
            icon={false}
            size="sm"
            className="block mt-2"
          />
        </div>
      ) : null}
    </div>
  );
} 