'use client';
// src/app/(dashboard)/food/meals/[id]/cook/page.js
import { useEffect } from 'react';
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
    isCooking
  } = useCookingSession();

  // Show loading spinner only when user is loading or when we don't have user data yet
  if (userLoading || (!user && !userLoading)) {
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

  // Parse instructions as string array
  const parsedInstructions = Array.isArray(meal.instructions)
    ? meal.instructions
    : (typeof meal.instructions === 'string' && meal.instructions.trim()
        ? meal.instructions.split('\n').map(s => s.trim()).filter(Boolean)
        : []);

  const isThisMealActive = isCooking && cookingMealId === meal.id;

  return (
    <div className="p-6 space-y-4">
      {/* Back button or link at the top */}
      {!isCooking && (
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

      {/* Cooking session controls */}
      {!isCooking && parsedInstructions.length > 0 && (
        <Button onClick={() => startCooking(meal.id, parsedInstructions)}>
          Cook Meal
        </Button>
      )}
      {isCooking && !isThisMealActive && (
        <div className="text-orange-600 text-sm font-medium">
          Finish your current meal before starting another.
        </div>
      )}
      {isThisMealActive && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Step {currentStep + 1}</h2>
          <p className="text-base mb-4">{cookingInstructions[currentStep]}</p>
          <div className="flex gap-4 mt-4">
            {currentStep > 0 && (
              <Button onClick={previousStep}>
                Previous Step
              </Button>
            )}
            {currentStep < cookingInstructions.length - 1 ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button onClick={endCooking} variant="success">
                Finish Cooking
              </Button>
            )}
          </div>
          {/* Cancel Cooking button only during active session for this meal */}
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
      )}
    </div>
  );
} 