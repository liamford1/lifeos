require('dotenv').config({ path: './.env.local' });
if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  require('dotenv').config(); // fallback
}

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
        user = await fetchUserByEmail(testEmail);
        if (!user) {
          throw new Error('Failed to fetch test user after email_exists');
        }
      } else {
        throw new Error(`Failed to create test user: ${res.status} ${text}`);
      }
    } else {
      const json = await res.json();
      user = { id: json.user.id };
    }
  }

  // Clean up ALL test data for the test user to ensure fresh state
  console.log('🧹 Cleaning up test data for user:', user.id);
  
  // Delete in order to respect foreign key constraints
  // Tables with direct user_id columns
  const tablesWithUserId = [
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
    'scratchpad_entries'
  ];

  // Tables that need to be cleaned via foreign key relationships
  const tablesWithForeignKeys = [
    'meal_ingredients', // linked via meal_id -> meals.user_id
    'receipt_items',    // linked via receipt_id -> receipts.user_id
    'fitness_exercises', // linked via workout_id -> fitness_workouts.user_id
    'fitness_sets'      // linked via exercise_id -> fitness_exercises.workout_id -> fitness_workouts.user_id
  ];

  // Clean up tables with direct user_id first
  for (const table of tablesWithUserId) {
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

  // Clean up tables with foreign key relationships
  try {
    // Clean up meal_ingredients via meals
    const { error: mealIngredientsError } = await supabase
      .from('meal_ingredients')
      .delete()
      .in('meal_id', 
        supabase.from('meals').select('id').eq('user_id', user.id)
      );
    if (mealIngredientsError) {
      console.warn('Warning: Could not clean up meal_ingredients:', mealIngredientsError.message);
    } else {
      console.log('✅ Cleaned up meal_ingredients');
    }
  } catch (err) {
    console.warn('Warning: Error cleaning up meal_ingredients:', err.message);
  }

  try {
    // Clean up receipt_items via receipts
    const { error: receiptItemsError } = await supabase
      .from('receipt_items')
      .delete()
      .in('receipt_id', 
        supabase.from('receipts').select('id').eq('user_id', user.id)
      );
    if (receiptItemsError) {
      console.warn('Warning: Could not clean up receipt_items:', receiptItemsError.message);
    } else {
      console.log('✅ Cleaned up receipt_items');
    }
  } catch (err) {
    console.warn('Warning: Error cleaning up receipt_items:', err.message);
  }

  try {
    // Clean up fitness_sets via fitness_exercises via fitness_workouts
    const { error: fitnessSetsError } = await supabase
      .from('fitness_sets')
      .delete()
      .in('exercise_id', 
        supabase.from('fitness_exercises')
          .select('id')
          .in('workout_id', 
            supabase.from('fitness_workouts').select('id').eq('user_id', user.id)
          )
      );
    if (fitnessSetsError) {
      console.warn('Warning: Could not clean up fitness_sets:', fitnessSetsError.message);
    } else {
      console.log('✅ Cleaned up fitness_sets');
    }
  } catch (err) {
    console.warn('Warning: Error cleaning up fitness_sets:', err.message);
  }

  try {
    // Clean up fitness_exercises via fitness_workouts
    const { error: fitnessExercisesError } = await supabase
      .from('fitness_exercises')
      .delete()
      .in('workout_id', 
        supabase.from('fitness_workouts').select('id').eq('user_id', user.id)
      );
    if (fitnessExercisesError) {
      console.warn('Warning: Could not clean up fitness_exercises:', fitnessExercisesError.message);
    } else {
      console.log('✅ Cleaned up fitness_exercises');
    }
  } catch (err) {
    console.warn('Warning: Error cleaning up fitness_exercises:', err.message);
  }

  // Clean up profile separately
  try {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('user_id', user.id);
    
    if (error) {
      console.warn('Warning: Could not clean up profiles:', error.message);
    } else {
      console.log('✅ Cleaned up profiles');
    }
  } catch (err) {
    console.warn('Warning: Error cleaning up profiles:', err.message);
  }

  console.log('🧹 Test data cleanup completed');

  // Add a small delay to ensure all cleanup operations are complete
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Return the user id for Playwright
  return user.id;
}; 