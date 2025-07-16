'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/BackButton';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { FaUtensils } from 'react-icons/fa';

export default function PlannedMealDetailPage() {
  const { id } = useParams();
  const [plannedMeal, setPlannedMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchPlannedMeal() {

      const { data, error } = await supabase
        .from('planned_meals')
        .select(`
          *,
          meals (*)
        `)
        .eq('id', id)
        .single();

      // Add detailed logging for debugging
      console.log('Supabase fetch result:', { id, data, error });

      if (error) {
        console.error('Error fetching planned meal:', error);
        setError('Failed to load planned meal. Please try again.');
        setLoading(false);
        return;
      }

      setPlannedMeal(data);
      setLoading(false);
    }

    fetchPlannedMeal();
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (error) return (
    <div className="p-6 text-white">
      <BackButton />
      <div className="bg-red-900 border border-red-700 rounded-lg p-4 text-white">
        <h2 className="text-xl font-semibold mb-2">Error</h2>
        <p>{error}</p>
      </div>
    </div>
  );
  if (!plannedMeal) return (
    <div className="p-6 text-white">
      <BackButton />
      <div className="bg-yellow-900 border border-yellow-700 rounded-lg p-4 text-white">
        <h2 className="text-xl font-semibold mb-2">Not Found</h2>
        <p className="text-muted-foreground text-sm">Planned meal not found.</p>
      </div>
    </div>
  );

  const meal = plannedMeal.meals;
  const plannedDate = new Date(plannedMeal.planned_date);
  const formattedDate = plannedDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      <BackButton />
      <div className="p-6">
        <div className="bg-surface rounded-lg p-6 shadow-lg">
          <h1 className="text-3xl font-bold mb-4 text-white">{meal.name}</h1>
          
          {meal.description && (
            <p className="text-base mb-6">{meal.description}</p>
          )}

          <div className="bg-surface rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">
              <MdOutlineCalendarToday className="inline w-5 h-5 text-base align-text-bottom mr-2" />
              Planned Details
            </h2>
            <div className="space-y-2">
              <p className="text-base">
                <span className="font-medium">Date:</span> {formattedDate}
              </p>
              <p className="text-base">
                <span className="font-medium">Meal Time:</span> {plannedMeal.meal_time}
              </p>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-3 text-white">
              <FaUtensils className="inline w-5 h-5 text-base align-text-bottom mr-2" />
              Meal Information
            </h2>
            <div className="space-y-2">
              <p className="text-base">
                <span className="font-medium">Prep Time:</span> {meal.prep_time || 0} minutes
              </p>
              <p className="text-base">
                <span className="font-medium">Cook Time:</span> {meal.cook_time || 0} minutes
              </p>
              <p className="text-base">
                <span className="font-medium">Servings:</span> {meal.servings || 1}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 