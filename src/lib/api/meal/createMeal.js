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
      const { user: userFromData } = userData || {};
      user = userFromData;
      userError = error;
    } else {
      // Fall back to cookie-based authentication
      const { data: userData, error } = await supabase.auth.getUser();
      const { user: userFromData } = userData || {};
      user = userFromData;
      userError = error;
      
      // If no user, try to refresh the session
      if (!user && userError?.message?.includes('Auth session missing')) {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (refreshData?.user) {
          const { user: refreshUser } = refreshData;
          user = refreshUser;
        }
      }
    }
    
    if (!user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }

    // Insert the meal with user_id and created_at
    const { id: userId } = user;
    const mealPayload = {
      ...payload,
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('meals').insert([mealPayload]).select('id');

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    const [firstData] = data;
    const { id: mealId } = firstData;
    return new Response(JSON.stringify({ mealId }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 500 });
  }
} 