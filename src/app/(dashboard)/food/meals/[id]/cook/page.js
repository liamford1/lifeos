'use client';
// src/app/(dashboard)/food/meals/[id]/cook/page.js
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';
import { useCookingSession } from '@/context/CookingSessionContext';
import BackButton from '@/components/BackButton';
import SharedDeleteButton from '@/components/SharedDeleteButton';

export default function CookMealPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showSuccess, showError } = useToast();
  const [meal, setMeal] = useState(null);
  const [mealLoading, setMealLoading] = useState(true);

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

  useEffect(() => {
    async function fetchMeal() {
      setMealLoading(true);
      const { data, error } = await supabase.from('meals').select('*').eq('id', id).single();
      if (!error) setMeal(data);
      setMealLoading(false);
    }
    fetchMeal();
  }, [id, router]);

  if (mealLoading) return <LoadingSpinner />;
  if (!meal) return <div className="p-6"><p className="text-muted-foreground text-sm">Meal not found.</p></div>;

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
        <button
          type="button"
          onClick={() => router.push(`/food/meals/${meal.id}`)}
          className="bg-card text-base border border-default px-4 py-2 rounded hover:bg-[#4a4a4a] transition-colors duration-200 focus:outline-none focus:ring-0 mb-4"
        >
          ← Back to meal
        </button>
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