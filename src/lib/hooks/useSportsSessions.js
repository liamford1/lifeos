import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/Toast';
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';

export function useSportsSessions() {
  const { showSuccess, showError } = useToast();

  // Fetch all sports sessions for a user
  const fetchSportsSessions = async (userId) => {
    if (!userId) {
      console.warn('fetchSportsSessions called without userId');
      return null;
    }
    
    console.log('Fetching sports sessions for user:', userId);
    const { data, error } = await supabase
      .from('fitness_sports')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) {
      console.error('Error fetching sports sessions:', error);
      showError('Failed to fetch sports sessions.');
      return null;
    }
    
    console.log('Fetched sports sessions:', data?.length || 0);
    return data;
  };

  // Create a new sports session
  const createSportsSession = async (data) => {
    const { data: inserted, error } = await supabase
      .from('fitness_sports')
      .insert(data)
      .select()
      .single();
    if (error) {
      showError('Failed to create sports session.');
      return null;
    }
    showSuccess('Sports session created!');
    return inserted;
  };

  // Update a sports session
  const updateSportsSession = async (id, updatedData) => {
    const { data, error } = await supabase
      .from('fitness_sports')
      .update(updatedData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      showError('Failed to update sports session.');
      return null;
    }
    showSuccess('Sports session updated!');
    return data;
  };

  // Delete a sports session (and its calendar event)
  const deleteSportsSession = async (id, userId) => {
    const error = await deleteEntityWithCalendarEvent({
      table: 'fitness_sports',
      id,
      user_id: userId,
      source: 'sports',
    });
    if (error) {
      showError('Failed to delete sports session.');
      return false;
    }
    showSuccess('Sports session deleted!');
    return true;
  };

  return {
    fetchSportsSessions,
    createSportsSession,
    updateSportsSession,
    deleteSportsSession,
  };
} 