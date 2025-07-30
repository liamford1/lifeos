import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';
import { deleteEntityWithCalendarEvent } from '@/lib/utils/deleteUtils';

export function useSportsSessions() {
  const { handleError, handleSuccess } = useApiError();

  // Fetch all sports sessions for a user
  const fetchSportsSessions = async (userId, options = {}) => {
    if (!userId) {
      console.warn('fetchSportsSessions called without userId');
      return null;
    }
    
    const { data, error } = await supabase
      .from('fitness_sports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching sports sessions:', error);
      handleError(error, { 
        customMessage: 'Failed to fetch sports sessions.',
        ...options 
      });
      return null;
    }
    
    return data;
  };

  // Create a new sports session
  const createSportsSession = async (data, options = {}) => {
    const { data: inserted, error } = await supabase
      .from('fitness_sports')
      .insert(data)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to create sports session.',
        ...options 
      });
      return null;
    }
    handleSuccess('Sports session created!', options);
    return inserted;
  };

  // Update a sports session
  const updateSportsSession = async (id, updatedData, options = {}) => {
    const { data, error } = await supabase
      .from('fitness_sports')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to update sports session.',
        ...options 
      });
      return null;
    }
    handleSuccess('Sports session updated!', options);
    return data;
  };

  // Delete a sports session (and its calendar event)
  const deleteSportsSession = async (id, userId, options = {}) => {
    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_sports',
      id,
      user_id: userId,
      source: 'sports',
    });
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to delete sports session.',
        ...options 
      });
      return false;
    }
    handleSuccess('Sports session deleted!', options);
    return true;
  };

  return {
    fetchSportsSessions,
    createSportsSession,
    updateSportsSession,
    deleteSportsSession,
  };
} 