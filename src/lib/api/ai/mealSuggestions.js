import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getStructuredResponse, isOpenAIAvailable } from '@/lib/ai';
import { mealPlannerPrompt, getMealPlanningSystemPrompt } from '@/lib/ai/prompts';

export default async function handleMealSuggestions(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check for Bearer token in Authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    let userError = null;

    if (process.env.NODE_ENV !== "production") {
      console.log('🔍 Auth header:', authHeader ? 'Present' : 'Missing');
    }

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use Bearer token authentication
      const token = authHeader.substring(7);
      if (process.env.NODE_ENV !== "production") {
        console.log('🔍 Using Bearer token authentication');
      }
      const { data: userData, error: error } = await supabase.auth.getUser(token);
      user = userData?.user;
      userError = error;
    } else {
      // Fall back to cookie-based authentication
      if (process.env.NODE_ENV !== "production") {
        console.log('🔍 Using cookie-based authentication');
      }
      const { data: userData, error: error } = await supabase.auth.getUser();
      user = userData?.user;
      userError = error;
      
      // If no user, try to refresh the session
      if (!user && userError?.message?.includes('Auth session missing')) {
        if (process.env.NODE_ENV !== "production") {
          console.log('🔍 Attempting session refresh');
        }
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshData?.user) {
          const { user: refreshUser } = refreshData;
          user = refreshUser;
        }
      }
    }
    
    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        console.error('🚫 Not authenticated:', userError);
        console.error('🚫 User data:', user);
        console.error('🚫 Auth header present:', !!authHeader);
      }
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    // Parse the request body
    const requestBody = await request.json();
    const { pantryItems = [], preferences = {}, dietaryRestrictions = [] } = requestBody;

    // Validate input
    if (!Array.isArray(pantryItems)) {
      return new Response(JSON.stringify({ error: 'pantryItems must be an array' }), { status: 400 });
    }

    // Check if OpenAI is available
    if (!isOpenAIAvailable()) {
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
        // Return mock suggestions for testing
        const mockSuggestions = [
          {
            id: 'mock-suggestion-1',
            name: 'Mock Pasta Dish',
            description: 'A simple mock pasta dish for testing',
            ingredients: pantryItems.length > 0 ? pantryItems.map(item => ({
              name: item.name,
              quantity: item.quantity || 1,
              unit: item.unit || 'piece'
            })) : [
              { name: 'pasta', quantity: 200, unit: 'g' },
              { name: 'sauce', quantity: 1, unit: 'cup' }
            ],
            prepTime: 10,
            cookTime: 15,
            difficulty: 'easy',
            instructions: ['Boil water', 'Cook pasta', 'Add sauce'],
            estimatedServings: 2,
            missingIngredients: []
          }
        ];
        
        return new Response(JSON.stringify({ suggestions: mockSuggestions }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({ error: 'AI service not available' }), { status: 503 });
    }

    // Build the prompt for AI using the template
    const prompt = mealPlannerPrompt(pantryItems, preferences, dietaryRestrictions);
    const systemPrompt = getMealPlanningSystemPrompt();

    // Debug logging
    if (process.env.NODE_ENV !== "production") {
      console.log('🔍 Prompt:', prompt);
      console.log('🔍 System Prompt:', systemPrompt);
    }

    // Call OpenAI for meal suggestions
    const suggestions = await getStructuredResponse(prompt, {
      systemPrompt,
      temperature: 0.3,
      maxTokens: 2000,
    });

    // Debug logging
    if (process.env.NODE_ENV !== "production") {
      console.log('🔍 AI Response:', JSON.stringify(suggestions, null, 2));
    }

    // Validate the response structure
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      if (process.env.NODE_ENV !== "production") {
        console.error('❌ Invalid AI response structure:', suggestions);
      }
      return new Response(JSON.stringify({ error: 'Invalid response from AI service' }), { status: 500 });
    }

    // Ensure each suggestion has the required fields
    const validatedSuggestions = suggestions.map((suggestion, index) => ({
      id: `suggestion-${index + 1}`,
      name: suggestion.name || `Meal ${index + 1}`,
      description: suggestion.description || '',
      ingredients: Array.isArray(suggestion.ingredients) ? suggestion.ingredients : [],
      prepTime: suggestion.prepTime || 15,
      cookTime: suggestion.cookTime || 30,
      difficulty: suggestion.difficulty || 'medium',
      instructions: Array.isArray(suggestion.instructions) ? suggestion.instructions : [],
      estimatedServings: suggestion.estimatedServings || 2,
      missingIngredients: Array.isArray(suggestion.missingIngredients) ? suggestion.missingIngredients : [],
    }));

    return new Response(JSON.stringify({ 
      suggestions: validatedSuggestions,
      pantryItems: pantryItems.length,
      timestamp: new Date().toISOString()
    }), { 
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    });

  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error('🔥 AI Meal Suggestions API error:', err);
      console.error('🔥 Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    }
    
    // Handle specific AI-related errors
    if (err.message.includes('OPENAI_API_KEY')) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), { status: 503 });
    }
    
    if (err.message.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: 'AI service temporarily unavailable' }), { status: 429 });
    }
    
    if (err.message.includes('Failed to parse JSON')) {
      return new Response(JSON.stringify({ error: 'AI service returned invalid format' }), { status: 500 });
    }
    
    return new Response(JSON.stringify({ 
      error: 'Failed to generate meal suggestions',
      details: process.env.NODE_ENV !== "production" ? err.message : undefined
    }), { status: 500 });
  }
} 