require('dotenv').config({ path: './.env.local' });
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.warn('⚠️ Failed to load Supabase env vars from .env.local — falling back to .env');
  require('dotenv').config(); // fallback
}

console.log('Supabase env config:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ loaded' : '❌ missing'
});

const { createClient } = require('@supabase/supabase-js');

module.exports = async () => {
  // Use your Supabase project URL and service role key (never expose this key to the frontend!)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set as environment variables.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // Try to get the test user ID from the auth.users table using schema option
  let user, userError;
  try {
    ({ data: user, error: userError } = await supabase
      .from('users', { schema: 'auth' })
      .select('id')
      .eq('email', 'test@example.com')
      .single());
  } catch (e) {
    userError = e;
  }

  // Fallback: try without schema option
  if (userError || !user) {
    console.warn('First attempt to fetch test user failed, trying fallback:', userError);
    try {
      ({ data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', 'test@example.com')
        .single());
    } catch (e) {
      userError = e;
    }
  }

  if (userError || !user) {
    console.warn('Test user not found or error occurred:', userError);
    return;
  }

  // End all in-progress workouts for the test user
  const { error: updateError } = await supabase
    .from('fitness_workouts')
    .update({ in_progress: false, end_time: new Date().toISOString() })
    .eq('user_id', user.id)
    .eq('in_progress', true);

  if (updateError) {
    console.warn('Error updating workouts:', updateError);
  } else {
    console.log('Cleared in-progress workouts for test user.');
  }
}; 