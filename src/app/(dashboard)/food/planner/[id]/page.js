'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import BackButton from '@/components/shared/BackButton';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { MdOutlineCalendarToday } from 'react-icons/md';
import { FaUtensils } from 'react-icons/fa';
import { CALENDAR_SOURCES, updateCalendarEventFromSource } from '@/lib/utils/calendarUtils';
import Button from '@/components/shared/Button';
import Toast from '@/components/client/Toast';

export default function PlannedMealDetailPage() {
  const { id } = useParams();
  const [plannedMeal, setPlannedMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editData, setEditData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

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

      if (error) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Error fetching planned meal:', error);
        }
        setError('Failed to load planned meal. Please try again.');
        setLoading(false);
        return;
      }

      setPlannedMeal(data);
      setEditData({
        meal_time: data.meal_time || '',
        planned_date: data.planned_date || '',
      });
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

  // Edit form handlers
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Ensure planned_date is in YYYY-MM-DD format
      let plannedDate = editData.planned_date;
      if (plannedDate instanceof Date) {
        plannedDate = plannedDate.toISOString().slice(0, 10);
      }
      // Update planned_meals
      const { error: updateError } = await supabase
        .from('planned_meals')
        .update({
          meal_time: editData.meal_time,
          planned_date: plannedDate,
          user_id: plannedMeal.user_id,
          meal_id: plannedMeal.meal_id,
        })
        .eq('id', id);
      if (updateError) {
        if (process.env.NODE_ENV !== "production") {
          console.error('Supabase update error:', updateError);
        }
        setError(updateError.message || 'Failed to update planned meal.');
        return;
      }
      // Sync calendar event
      const calendarError = await updateCalendarEventFromSource(
        CALENDAR_SOURCES.PLANNED_MEAL,
        id,
        {
          meal_time: editData.meal_time,
          planned_date: plannedDate,
          user_id: plannedMeal.user_id,
          meal_id: plannedMeal.meal_id,
        }
      );
      if (calendarError) {
        setToastMsg('Meal updated, but failed to update calendar event.');
      } else {
        setToastMsg('Meal updated successfully!');
      }
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
        window.location.href = '/food/planner';
      }, 1500);
    } catch (err) {
      setError('Failed to update planned meal.');
    } finally {
      setSaving(false);
    }
  };

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

          <div className="bg-surface rounded-lg p-4 mb-6">
            <h2 className="text-xl font-semibold mb-3 text-white">Edit Planned Meal</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block mb-1 font-medium">Meal Time</label>
                <select
                  name="meal_time"
                  value={editData?.meal_time || ''}
                  onChange={handleChange}
                  className="bg-[#232323] text-white border border-[#232323] rounded px-3 py-2 w-full"
                  required
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Planned Date</label>
                <input
                  type="date"
                  name="planned_date"
                  value={editData?.planned_date || ''}
                  onChange={handleChange}
                  className="bg-[#232323] text-white border border-[#232323] rounded px-3 py-2 w-full"
                  required
                />
              </div>
              {error && <div className="text-red-400 text-sm">{error}</div>}
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
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
      {showToast && <Toast message={toastMsg} />}
    </>
  );
} 