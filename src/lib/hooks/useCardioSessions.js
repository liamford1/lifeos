import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';

export function useCardioSessions() {
  const { showSuccess, showError } = useToast();

  // Fetch all cardio sessions for a user
  const fetchCardioSessions = async (userId) => {
    const { data, error } = await supabase
      .from('fitness_cardio')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    if (error) {
      showError('Failed to fetch cardio sessions.');
      return null;
    }
    return data;
  };

  // Create a new cardio session
  const createCardioSession = async (data) => {
    const { data: inserted, error } = await supabase
      .from('fitness_cardio')
      .insert(data)
      .select()
      .single();
    if (error) {
      showError('Failed to create cardio session.');
      return null;
    }
    showSuccess('Cardio session created!');
    return inserted;
  };

  // Update a cardio session
  const updateCardioSession = async (id, updatedData) => {
    const { data, error } = await supabase
      .from('fitness_cardio')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      showError('Failed to update cardio session.');
      return null;
    }
    showSuccess('Cardio session updated!');
    return data;
  };

  // Delete a cardio session (and its calendar event)
  const deleteCardioSession = async (id, userId) => {
    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_cardio',
      id,
      user_id: userId,
      source: 'cardio',
    });
    if (error) {
      showError('Failed to delete cardio session.');
      return false;
    }
    showSuccess('Cardio session deleted!');
    return true;
  };

  return {
    fetchCardioSessions,
    createCardioSession,
    updateCardioSession,
    deleteCardioSession,
  };
} 