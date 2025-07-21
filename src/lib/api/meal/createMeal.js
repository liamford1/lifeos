import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handleCreateMeal(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies }); // ✅ correct now

    // Parse and log the incoming payload
    const payload = await request.json();

    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
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