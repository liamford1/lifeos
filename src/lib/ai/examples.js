import { callOpenAI, completeText, getStructuredResponse } from './index';

/**
 * Example: AI-powered meal planning based on available ingredients
 */
export async function suggestMealsFromIngredients(ingredients, dietaryRestrictions = []) {
  const prompt = `
    I have these ingredients available: ${ingredients.join(', ')}
    ${dietaryRestrictions.length > 0 ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}
    
    Suggest 3 meals I can make with these ingredients. For each meal, provide:
    - Name
    - Required additional ingredients (if any)
    - Estimated prep time
    - Difficulty level (easy/medium/hard)
    - Brief cooking instructions
  `;

  const systemPrompt = `You are a professional chef and nutritionist. Provide practical, 
    easy-to-follow meal suggestions that use the available ingredients efficiently. 
    Focus on healthy, balanced meals.`;

  return await getStructuredResponse(prompt, {
    systemPrompt,
    temperature: 0.3,
    maxTokens: 1500,
  });
}

/**
 * Example: AI-powered workout recommendations
 */
export async function suggestWorkout(fitnessLevel, availableTime, targetMuscleGroups, equipment = []) {
  const prompt = `
    I'm a ${fitnessLevel} fitness level and have ${availableTime} minutes available.
    I want to work on: ${targetMuscleGroups.join(', ')}
    Available equipment: ${equipment.length > 0 ? equipment.join(', ') : 'Bodyweight only'}
    
    Create a workout plan with:
    - Warm-up exercises
    - Main exercises with sets, reps, and rest periods
    - Cool-down exercises
    - Estimated calorie burn
  `;

  const systemPrompt = `You are a certified personal trainer. Create safe, effective 
    workout plans appropriate for the user's fitness level. Include proper form cues 
    and progression options.`;

  return await getStructuredResponse(prompt, {
    systemPrompt,
    temperature: 0.2,
    maxTokens: 1200,
  });
}

/**
 * Example: AI-powered expense categorization
 */
export async function categorizeExpense(expenseDescription, amount) {
  const prompt = `Categorize this expense: "${expenseDescription}" - $${amount}`;

  const systemPrompt = `You are a financial advisor. Categorize expenses into one of these categories:
    - Food & Dining
    - Transportation
    - Entertainment
    - Shopping
    - Health & Fitness
    - Bills & Utilities
    - Travel
    - Education
    - Other
    
    Respond with only the category name.`;

  return await completeText(prompt, {
    systemPrompt,
    temperature: 0.1,
    maxTokens: 50,
  });
}

/**
 * Example: AI-powered calendar optimization
 */
export async function optimizeSchedule(events, preferences) {
  const prompt = `
    I have these events to schedule: ${JSON.stringify(events)}
    My preferences: ${JSON.stringify(preferences)}
    
    Suggest the optimal schedule considering:
    - Energy levels throughout the day
    - Travel time between activities
    - Meal timing
    - Workout recovery
    - Sleep schedule
  `;

  const systemPrompt = `You are a productivity expert and life coach. Help optimize 
    the user's schedule for maximum productivity and well-being. Consider energy 
    management, realistic time estimates, and work-life balance.`;

  return await getStructuredResponse(prompt, {
    systemPrompt,
    temperature: 0.4,
    maxTokens: 1000,
  });
}

/**
 * Example: AI-powered recipe scaling
 */
export async function scaleRecipe(recipe, servings) {
  const prompt = `
    Scale this recipe from ${recipe.originalServings} servings to ${servings} servings:
    ${JSON.stringify(recipe.ingredients)}
    
    Provide the scaled ingredient amounts and adjust cooking time if needed.
  `;

  const systemPrompt = `You are a professional chef. Accurately scale recipe 
    ingredients and adjust cooking times as needed. Maintain the recipe's 
    flavor balance and texture.`;

  return await getStructuredResponse(prompt, {
    systemPrompt,
    temperature: 0.1,
    maxTokens: 800,
  });
}

/**
 * Example: AI-powered grocery list generation
 */
export async function generateGroceryList(mealPlan, pantryItems) {
  const prompt = `
    I'm planning to make these meals: ${JSON.stringify(mealPlan)}
    I already have these items: ${pantryItems.join(', ')}
    
    Generate a grocery list with:
    - Items needed
    - Estimated quantities
    - Organized by store section (produce, dairy, etc.)
    - Estimated total cost
  `;

  const systemPrompt = `You are a meal planning expert. Create efficient grocery 
    lists that avoid waste and save money. Consider ingredient overlap between 
    meals and what's already available.`;

  return await getStructuredResponse(prompt, {
    systemPrompt,
    temperature: 0.2,
    maxTokens: 1000,
  });
}

/**
 * Example: AI-powered fitness progress analysis
 */
export async function analyzeFitnessProgress(workoutHistory, goals) {
  const prompt = `
    Analyze my fitness progress:
    Workout history: ${JSON.stringify(workoutHistory)}
    Goals: ${JSON.stringify(goals)}
    
    Provide insights on:
    - Progress toward goals
    - Areas for improvement
    - Recommended adjustments
    - Motivation tips
  `;

  const systemPrompt = `You are a fitness coach and motivational expert. Analyze 
    the user's progress objectively and provide constructive, encouraging feedback. 
    Focus on sustainable progress and long-term success.`;

  return await callOpenAI(prompt, {
    systemPrompt,
    temperature: 0.3,
    maxTokens: 800,
  });
}

/**
 * Example: AI-powered budget recommendations
 */
export async function suggestBudgetAdjustments(expenses, income, goals) {
  const prompt = `
    My monthly income: $${income}
    My expenses: ${JSON.stringify(expenses)}
    My financial goals: ${JSON.stringify(goals)}
    
    Suggest budget adjustments to help me reach my goals while maintaining 
    a good quality of life.
  `;

  const systemPrompt = `You are a financial advisor. Provide practical, 
    actionable budget advice that balances financial goals with quality of life. 
    Be realistic and consider the user's current situation.`;

  return await getStructuredResponse(prompt, {
    systemPrompt,
    temperature: 0.2,
    maxTokens: 1000,
  });
} 