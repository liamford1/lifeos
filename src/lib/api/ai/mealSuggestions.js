import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getStructuredResponse } from '@/lib/ai';
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
          user = refreshData.user;
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
    const { pantryItems = [], preferences = {}, dietaryRestrictions = [] } = await request.json();

    // Validate input
    if (!Array.isArray(pantryItems)) {
      return new Response(JSON.stringify({ error: 'pantryItems must be an array' }), { status: 400 });
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