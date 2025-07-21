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
  const testEmail = 'test@example.com';
  const testPassword = 'password123';

  // Helper to fetch user by email using Supabase Admin API
  async function fetchUserByEmail(email) {
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users?email=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch user by email: ${res.status} ${await res.text()}`);
    }
    const json = await res.json();
    if (!json.users || !json.users.length) return null;
    return { id: json.users[0].id };
  }

  // Try to get the test user ID from the auth.users table using Admin API
  let user = await fetchUserByEmail(testEmail);

  // If user does not exist, insert into auth.users using the admin API
  if (!user) {
    console.warn('Test user not found, creating test user in auth.users...');
    // Use the Supabase Auth Admin API to create a user
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apiKey': supabaseServiceRoleKey,
        'Authorization': `Bearer ${supabaseServiceRoleKey}`
      },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })
    });
    if (!res.ok) {
      const text = await res.text();
      if (res.status === 422 && text.includes('email_exists')) {
        console.warn('Test user already exists according to Supabase admin API. Attempting to fetch user again...');
        user = await fetchUserByEmail(testEmail);
        if (!user) {
          throw new Error('Failed to fetch test user after email_exists');
        }
        console.log('Fetched existing test user after email_exists:', user.id);
      } else {
        throw new Error(`Failed to create test user: ${res.status} ${text}`);
      }
    } else {
      const json = await res.json();
      user = { id: json.user.id };
      console.log('Created test user:', user.id);
    }
  } else {
    console.log('Found test user:', user.id);
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

  // Return the user id for Playwright
  return user.id;
}; 