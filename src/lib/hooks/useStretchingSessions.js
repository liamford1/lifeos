import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useApiError } from '@/lib/hooks/useApiError';
import { deleteEntityWithCalendarEvent } from '@/lib/utils/deleteUtils';

export function useStretchingSessions() {
  const { handleError, handleSuccess } = useApiError();

  // Fetch all stretching sessions for a user (excluding in-progress sessions)
  const fetchStretchingSessions = useCallback(async (userId, options = {}) => {
    if (!userId) {
      console.warn('fetchStretchingSessions called without userId');
      return null;
    }
    
    const { data, error } = await supabase
      .from('fitness_stretching')
      .select('*')
      .eq('user_id', userId)
      .eq('in_progress', false)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching stretching sessions:', error);
      handleError(error, { 
        customMessage: 'Failed to fetch stretching sessions.',
        ...options 
      });
      return null;
    }
    
    return data;
  }, [handleError]);

  // Create a new stretching session
  const createStretchingSession = useCallback(async (data, options = {}) => {
    const { data: inserted, error } = await supabase
      .from('fitness_stretching')
      .insert(data)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to create stretching session.',
        ...options 
      });
      return null;
    }
    handleSuccess('Stretching session created!', options);
    return inserted;
  }, [handleError, handleSuccess]);

  // Update a stretching session
  const updateStretchingSession = useCallback(async (id, updatedData, options = {}) => {
    const { data, error } = await supabase
      .from('fitness_stretching')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to update stretching session.',
        ...options 
      });
      return null;
    }
    handleSuccess('Stretching session updated!', options);
    return data;
  }, [handleError, handleSuccess]);

  // Delete a stretching session (and its calendar event)
  const deleteStretchingSession = useCallback(async (id, userId, options = {}) => {
    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_stretching',
      id,
      user_id: userId,
      source: 'stretching',
    });
    if (error) {
      handleError(error, { 
        customMessage: 'Failed to delete stretching session.',
        ...options 
      });
      return false;
    }
    handleSuccess('Stretching session deleted!', options);
    return true;
  }, [handleError, handleSuccess]);

  return {
    fetchStretchingSessions,
    createStretchingSession,
    updateStretchingSession,
    deleteStretchingSession,
  };
}
