require('dotenv').config({ path: './.env.local' });
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config(); // fallback
}

// Check if we have real Supabase credentials
const hasRealCredentials = process.env.SUPABASE_SERVICE_ROLE_KEY && 
                          process.env.NEXT_PUBLIC_SUPABASE_URL && 
                          process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here' &&
                          process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_project_url_here';

if (!hasRealCredentials) {
  console.log('🧹 Using mock environment - no cleanup needed');
  module.exports = async () => {
    // No cleanup needed for mock environment
  };
} else {
  const { createClient } = require('@supabase/supabase-js');

  module.exports = async () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.log('⚠️  No Supabase credentials found, skipping cleanup');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: false,
      },
    });

    const testEmail = 'test@example.com';

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
        return null;
      }
      const json = await res.json();
      if (!json.users || !json.users.length) return null;
      return { id: json.users[0].id };
    }

    const user = await fetchUserByEmail(testEmail);
    
    if (!user) {
      console.log('🧹 No test user found, skipping cleanup');
      return;
    }

    console.log('🧹 Running global teardown...');
    console.log('🧹 Cleaning up test data for user:', user.id);

    // Clean up ALL test data for the test user
    const tablesToClean = [
      'calendar_events',
      'cooking_sessions', 
      'cooked_meals',
      'planned_meals',
      'meals',
      'receipts',
      'food_items',
      'fitness_workouts',
      'fitness_cardio',
      'fitness_sports',
      'expenses',
      'scratchpad_entries',
      'profiles'
    ];

    for (const table of tablesToClean) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('user_id', user.id);
        
        if (error) {
          console.warn(`Warning: Could not clean up ${table}:`, error.message);
        } else {
          console.log(`✅ Cleaned up ${table}`);
        }
      } catch (err) {
        console.warn(`Warning: Error cleaning up ${table}:`, err.message);
      }
    }

    console.log('✅ Global teardown completed');
  };
} 