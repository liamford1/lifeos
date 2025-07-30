import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';
import { deleteEntityWithCalendarEvent } from '@/lib/utils/deleteUtils';

export function useCardioSessions() {
  const { handleError, handleSuccess } = useApiError();

  // Fetch all cardio sessions for a user (excluding in-progress sessions)
  const fetchCardioSessions = async (userId, options = {}) => {
    if (!userId) {
      console.warn('fetchCardioSessions called without userId');
      return null;
    }
    
    const { data, error } = await supabase
      .from('fitness_cardio')
      .select('*')
      .eq('user_id', userId)
      .eq('in_progress', false)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching cardio sessions:', error);
      handleError(error, { 
        customMessage: 'Failed to fetch cardio sessions.',
        ...options 
      });
      return null;
    }
    
    return data;
  };

  // Create a new cardio session
  const createCardioSession = async (data, options = {}) => {
    const { data: inserted, error } = await supabase
      .from('fitness_cardio')
      .insert(data)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to create cardio session.',
        ...options 
      });
      return null;
    }
    handleSuccess('Cardio session created!', options);
    return inserted;
  };

  // Update a cardio session
  const updateCardioSession = async (id, updatedData, options = {}) => {
    const { data, error } = await supabase
      .from('fitness_cardio')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to update cardio session.',
        ...options 
      });
      return null;
    }
    handleSuccess('Cardio session updated!', options);
    return data;
  };

  // Delete a cardio session (and its calendar event)
  const deleteCardioSession = async (id, userId, options = {}) => {
    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_cardio',
      id,
      user_id: userId,
      source: 'cardio',
    });
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to delete cardio session.',
        ...options 
      });
      return false;
    }
    handleSuccess('Cardio session deleted!', options);
    return true;
  };

  return {
    fetchCardioSessions,
    createCardioSession,
    updateCardioSession,
    deleteCardioSession,
  };
} 