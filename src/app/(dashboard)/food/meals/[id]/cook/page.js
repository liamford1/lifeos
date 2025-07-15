// src/app/(dashboard)/food/meals/[id]/cook/page.js
'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import Button from '@/components/Button';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useToast } from '@/components/Toast';

export default function CookMealPage() {
  const router = useRouter();
  const { id } = useParams();
  const { showSuccess, showError } = useToast();
  const [meal, setMeal] = useState(null);
  const [mealLoading, setMealLoading] = useState(true);

  useEffect(() => {
    async function fetchMeal() {
      setMealLoading(true);
      const { data, error } = await supabase.from('meals').select('*').eq('id', id).single();
      if (!error) setMeal(data);
      setMealLoading(false);
    }
    fetchMeal();
  }, [id]);

  if (mealLoading) return <LoadingSpinner />;
  if (!meal) return <div className="p-6"><p className="text-muted-foreground text-sm">Meal not found.</p></div>;

  async function handleDoneCooking() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;
      if (!user) {
        showError('You must be logged in to record a cooked meal.');
        return;
      }
      
      console.log('Attempting to record cooked meal for:', {
        user_id: user.id,
        meal_id: meal.id,
      });
      
      // First, check if a record already exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('cooked_meals')
        .select('*')
        .eq('user_id', user.id)
        .eq('meal_id', meal.id)
        .single();
      
      console.log('Existing record check:', { existingRecord, checkError });
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 is "not found" error, which is expected if no record exists
        console.error('Error checking existing record:', checkError);
        showError(`Failed to check existing record: ${checkError.message}`);
        return;
      }
      
      let result;
      
      if (existingRecord) {
        // Update existing record
        console.log('Updating existing record with cook_count:', existingRecord.cook_count + 1);
        result = await supabase
          .from('cooked_meals')
          .update({
            last_cooked_at: new Date().toISOString(),
            cook_count: existingRecord.cook_count + 1
          })
          .eq('user_id', user.id)
          .eq('meal_id', meal.id)
          .select();
      } else {
        // Insert new record
        console.log('Inserting new record');
        result = await supabase
          .from('cooked_meals')
          .insert({
            user_id: user.id,
            meal_id: meal.id,
            last_cooked_at: new Date().toISOString(),
            cook_count: 1
          })
          .select();
      }
      
      if (result.error) {
        console.error('Database operation error:', result.error);
        console.error('Error details:', {
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        });
        showError(`Failed to record cooked meal: ${result.error.message}`);
        return;
      }
      
      console.log('Successfully recorded cooked meal:', result.data);
      showSuccess('Meal recorded as cooked successfully!');
      router.push('/food/meals');
    } catch (error) {
      console.error('Unexpected error:', error);
      showError('An unexpected error occurred while recording the cooked meal.');
    }
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-3xl font-bold">{meal.name}</h1>
      <p className="text-gray-600">{meal.description}</p>
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-2">Instructions</h2>
        {typeof meal.instructions === 'string' && meal.instructions.trim() ? (
          <ol className="list-decimal list-inside space-y-2">
            {meal.instructions.split('\n').map((step, idx) => (
              <li key={idx}>{step}</li>
            ))}
          </ol>
        ) : (
          <div className="text-muted-foreground text-sm italic">No entries yet. Add one above ⬆️</div>
        )}
      </div>
      <Button
        onClick={handleDoneCooking}
        variant="success"
      >
        Done Cooking
      </Button>
      <Button
        type="button"
        onClick={() => router.back()}
        variant="link"
        size="sm"
        className="block mt-2"
      >
        Cancel
      </Button>
    </div>
  );
} 