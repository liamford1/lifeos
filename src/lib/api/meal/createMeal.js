import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handleCreateMeal(request) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Parse and log the incoming payload
    const payload = await request.json();

    // Check for Bearer token in Authorization header
    const authHeader = request.headers.get('authorization');
    let user = null;
    let userError = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use Bearer token authentication
      const token = authHeader.substring(7);
      const { data: userData, error } = await supabase.auth.getUser(token);
      user = userData?.user;
      userError = error;
    } else {
      // Fall back to cookie-based authentication
      const { data: userData, error } = await supabase.auth.getUser();
      user = userData?.user;
      userError = error;
      
      // If no user, try to refresh the session
      if (!user && userError?.message?.includes('Auth session missing')) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshData?.user) {
          user = refreshData.user;
        }
      }
    }
    
    if (!user) {
      if (process.env.NODE_ENV !== "production") {
        console.error('🚫 Not authenticated:', userError);
      }
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    // Insert the meal with user_id and created_at
    const mealPayload = {
      ...payload,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('meals').insert([mealPayload]).select('id');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ mealId: data[0].id }), { status: 200 });
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error('🔥 Unexpected API error:', err);
    }
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 500 });
  }
} 