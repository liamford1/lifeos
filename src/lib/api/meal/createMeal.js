import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export default async function handleCreateMeal(request) {
  try {
    const supabase = createRouteHandlerClient({ cookies }); // ✅ correct now

    // Parse and log the incoming payload
    const payload = await request.json();
    console.log('🍲 Incoming meal payload:', payload);

    // Get the authenticated user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.error('🚫 Not authenticated:', userError);
      return new Response(JSON.stringify({ error: 'Not authenticated' }), { status: 401 });
    }
    console.log('✅ Authenticated user ID:', user.id);

    // Insert the meal with user_id and created_at
    const mealPayload = {
      ...payload,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('meals').insert([mealPayload]).select('id');
    console.log('🍲 Supabase insert result:', { data, error });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ mealId: data[0].id }), { status: 200 });
  } catch (err) {
    console.error('🔥 Unexpected API error:', err);
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 500 });
  }
} 