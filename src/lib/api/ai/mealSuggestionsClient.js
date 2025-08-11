import { supabase } from '@/lib/supabaseClient';

/**
 * Client-side function to get AI meal suggestions
 * @param {Array} pantryItems - Array of pantry items with name, quantity, unit
 * @param {Object} preferences - User preferences (cuisine, cooking time, etc.)
 * @param {Array} dietaryRestrictions - Array of dietary restrictions
 * @returns {Promise<Object>} - Response with suggestions
 */
export async function getMealSuggestions(pantryItems = [], preferences = {}, dietaryRestrictions = []) {
  try {
    // Get the current session to extract the access token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      throw new Error(`Failed to get session: ${sessionError.message}`);
    }
    
    if (!session) {
      throw new Error('No active session found. Please log in to use AI meal suggestions.');
    }
    
    const response = await fetch(`/api/ai/meal-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        pantryItems,
        preferences,
        dietaryRestrictions,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        throw new Error('Please log in to use AI meal suggestions');
      }
      throw new Error(errorData.error || 'Failed to get meal suggestions');
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

/**
 * Example usage:
 * 
 * const suggestions = await getMealSuggestions(
 *   [
 *     { name: 'pasta', quantity: 500, unit: 'g' },
 *     { name: 'tomato sauce', quantity: 2, unit: 'cups' },
 *     { name: 'onion', quantity: 1, unit: 'piece' },
 *   ],
 *   { cuisine: 'italian', maxPrepTime: 30 },
 *   ['vegetarian']
 * );
 * 
 * // suggestions.suggestions contains the meal suggestions
 */ 