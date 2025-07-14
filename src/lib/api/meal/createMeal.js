import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function handleCreateMeal(req) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    const {
      name,
      description,
      prep_time,
      cook_time,
      servings,
      instructions,
      notes,
      calories,
      date
    } = await req.json();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error('🚫 No user in session:', userError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data, error } = await supabase.from('meals').insert([
      {
        user_id: user.id,
        name,
        description,
        prep_time,
        cook_time,
        servings,
        instructions,
        notes,
        calories,
        date,
        created_at: new Date().toISOString()
      }
    ]).select('id');

    if (error) {
      console.error('❌ Supabase insert error:', error);
      // 🧠 Still return mealId if available
      return new Response(JSON.stringify({ mealId: data?.[0]?.id ?? null }), { status: 200 });
    }

    return new Response(JSON.stringify({ mealId: data[0].id }), { status: 200 });
  } catch (err) {
    console.error('🔥 Unexpected API error:', err);
    return new Response(JSON.stringify({ error: 'Invalid request' }), { status: 500 });
  }
}

export default handleCreateMeal; 