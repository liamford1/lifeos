/**
 * AI Prompt Templates for Life Management Platform
 * 
 * This file contains reusable prompt template functions for various AI features.
 * Each function takes specific parameters and returns a formatted prompt string.
 */

// ============================================================================
// MEAL PLANNING PROMPTS
// ============================================================================

/**
 * Generate meal suggestions based on pantry inventory
 * @param {Array} pantryItems - Array of pantry items with name, quantity, unit
 * @param {Object} preferences - User preferences (cuisine, maxPrepTime, etc.)
 * @param {Array} dietaryRestrictions - Array of dietary restrictions
 * @returns {string} Formatted prompt for meal suggestions
 */
export const mealPlannerPrompt = (pantryItems, preferences = {}, dietaryRestrictions = []) => {
  const pantryList = (pantryItems && pantryItems.length > 0) 
    ? pantryItems.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ')
    : 'empty pantry';

  const preferencesText = (preferences && Object.keys(preferences).length > 0)
    ? `Preferences: ${Object.entries(preferences).map(([key, value]) => `${key}: ${value}`).join(', ')}`
    : '';

  const dietaryText = (dietaryRestrictions && dietaryRestrictions.length > 0)
    ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}`
    : '';

  return `
Given the following pantry inventory: ${pantryList}
${preferencesText}
${dietaryText}

Suggest 3 realistic meals the user can cook today. Respond with a JSON array containing exactly 3 meal objects. Each meal object must have this exact structure:

{
  "name": "A descriptive meal name",
  "description": "Brief description of the meal",
  "ingredients": [
    {
      "name": "ingredient name",
      "quantity": 1,
      "unit": "cup"
    }
  ],
  "prepTime": 15,
  "cookTime": 30,
  "difficulty": "easy",
  "instructions": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "estimatedServings": 2,
  "missingIngredients": []
}

Focus on meals that use the available ingredients efficiently. If the pantry is empty or limited, suggest simple meals with common ingredients that are easy to find.

Return ONLY the JSON array, no additional text or formatting.
`;
};

/**
 * Generate meal planning prompt for a specific week
 * @param {Array} pantryItems - Current pantry inventory
 * @param {number} days - Number of days to plan for
 * @param {Object} preferences - User preferences
 * @returns {string} Formatted prompt for weekly meal planning
 */
export const weeklyMealPlannerPrompt = (pantryItems, days = 7, preferences = {}) => {
  const pantryList = (pantryItems && pantryItems.length > 0) 
    ? pantryItems.map(item => `${item.name} (${item.quantity} ${item.unit})`).join(', ')
    : 'no pantry items';
  
  return `
Create a ${days}-day meal plan using these pantry items: ${pantryList}

User preferences: ${Object.entries(preferences).map(([key, value]) => `${key}: ${value}`).join(', ')}

For each day, provide:
- breakfast: Quick breakfast option
- lunch: Lunch meal
- dinner: Main dinner meal
- snack: Optional snack suggestion

Consider:
- Variety in meals throughout the week
- Using pantry items efficiently
- Realistic cooking times
- Leftover utilization
- Balanced nutrition

Format as JSON with days as keys and meal objects as values.
`;
};

/**
 * Generate recipe scaling prompt
 * @param {Object} recipe - Original recipe object
 * @param {number} targetServings - Target number of servings
 * @returns {string} Formatted prompt for recipe scaling
 */
export const recipeScalingPrompt = (recipe, targetServings) => {
  return `
Scale this recipe from ${recipe.originalServings || recipe.servings} servings to ${targetServings} servings:

Original Recipe:
- Name: ${recipe.name}
- Ingredients: ${JSON.stringify(recipe.ingredients)}
- Instructions: ${JSON.stringify(recipe.instructions)}
- Prep Time: ${recipe.prepTime} minutes
- Cook Time: ${recipe.cookTime} minutes

Provide the scaled recipe with:
- scaledIngredients: Array of ingredients with adjusted quantities
- adjustedPrepTime: Updated prep time if needed
- adjustedCookTime: Updated cook time if needed
- notes: Any important scaling notes or tips

Maintain the recipe's flavor balance and texture while accurately scaling all measurements.
`;
};

// ============================================================================
// FITNESS & WORKOUT PROMPTS
// ============================================================================

/**
 * Generate workout recommendations based on user profile
 * @param {string} fitnessLevel - User's fitness level (beginner, intermediate, advanced)
 * @param {number} availableTime - Available time in minutes
 * @param {Array} targetMuscleGroups - Target muscle groups
 * @param {Array} equipment - Available equipment
 * @returns {string} Formatted prompt for workout recommendations
 */
export const workoutRecommendationPrompt = (fitnessLevel, availableTime, targetMuscleGroups, equipment = []) => {
  const equipmentList = equipment.length > 0 ? equipment.join(', ') : 'Bodyweight only';
  
  return `
Create a ${availableTime}-minute workout for a ${fitnessLevel} fitness level.

Target areas: ${targetMuscleGroups.join(', ')}
Available equipment: ${equipmentList}

Provide a complete workout plan with:
- warmup: 5-10 minute warm-up exercises
- mainWorkout: Array of exercises with sets, reps, and rest periods
- cooldown: 5-10 minute cool-down exercises
- estimatedCalories: Estimated calorie burn
- difficulty: "beginner", "intermediate", or "advanced"
- notes: Form cues and progression options

Focus on:
- Safe, effective exercises appropriate for the fitness level
- Proper form instructions
- Progressive overload options
- Time-efficient compound movements
- Balanced muscle group targeting
`;
};

/**
 * Generate fitness progress analysis prompt
 * @param {Array} workoutHistory - Array of past workouts
 * @param {Object} goals - User's fitness goals
 * @returns {string} Formatted prompt for progress analysis
 */
export const fitnessProgressPrompt = (workoutHistory, goals) => {
  return `
Analyze this fitness progress data:

Workout History: ${JSON.stringify(workoutHistory)}
Fitness Goals: ${JSON.stringify(goals)}

Provide a comprehensive analysis including:
- progressSummary: Overall progress assessment
- goalProgress: Progress toward specific goals
- strengths: Areas of improvement and success
- weaknesses: Areas needing attention
- recommendations: Specific recommendations for improvement
- motivation: Encouraging feedback and next steps
- adjustments: Suggested program modifications

Focus on:
- Objective, data-driven analysis
- Constructive, encouraging feedback
- Actionable recommendations
- Sustainable progress patterns
- Long-term success strategies
`;
};

// ============================================================================
// FINANCIAL PROMPTS
// ============================================================================

/**
 * Generate expense categorization prompt
 * @param {string} expenseDescription - Description of the expense
 * @param {number} amount - Expense amount
 * @returns {string} Formatted prompt for expense categorization
 */
export const expenseCategorizationPrompt = (expenseDescription, amount) => {
  return `
Categorize this expense: "${expenseDescription}" - $${amount}

Available categories:
- Food & Dining
- Transportation
- Entertainment
- Shopping
- Health & Fitness
- Bills & Utilities
- Travel
- Education
- Other

Respond with only the most appropriate category name. Consider the context and amount when categorizing.
`;
};

/**
 * Generate budget analysis and recommendations prompt
 * @param {number} income - Monthly income
 * @param {Array} expenses - Array of monthly expenses
 * @param {Object} goals - Financial goals
 * @returns {string} Formatted prompt for budget analysis
 */
export const budgetAnalysisPrompt = (income, expenses, goals) => {
  return `
Analyze this financial situation:

Monthly Income: $${income}
Monthly Expenses: ${JSON.stringify(expenses)}
Financial Goals: ${JSON.stringify(goals)}

Provide budget analysis and recommendations:
- spendingAnalysis: Analysis of current spending patterns
- savingsRate: Current savings rate calculation
- goalProgress: Progress toward financial goals
- recommendations: Specific budget adjustments
- savingsOpportunities: Areas to reduce spending
- investmentSuggestions: Investment recommendations if applicable
- emergencyFund: Emergency fund status and recommendations

Focus on:
- Practical, actionable advice
- Realistic budget adjustments
- Balance between saving and quality of life
- Long-term financial health
- Emergency preparedness
`;
};

// ============================================================================
// CALENDAR & SCHEDULING PROMPTS
// ============================================================================

/**
 * Generate schedule optimization prompt
 * @param {Array} events - Array of events to schedule
 * @param {Object} preferences - User preferences and constraints
 * @returns {string} Formatted prompt for schedule optimization
 */
export const scheduleOptimizationPrompt = (events, preferences) => {
  return `
Optimize this schedule:

Events to Schedule: ${JSON.stringify(events, null, 2)}
Preferences & Constraints: ${JSON.stringify(preferences, null, 2)}

Suggest optimal schedule considering:
- Energy levels throughout the day
- Travel time between activities
- Meal timing and preparation
- Workout recovery and timing
- Sleep schedule and quality
- Work-life balance
- Priority levels of activities

Provide:
- optimizedSchedule: Suggested schedule with timing
- reasoning: Explanation of scheduling decisions
- efficiencyTips: Tips for better time management
- flexibilityNotes: Areas where schedule can be flexible
- stressReduction: Suggestions to reduce schedule stress
`;
};

/**
 * Generate calendar event description prompt
 * @param {string} eventType - Type of event (workout, meal, etc.)
 * @param {Object} eventData - Event details
 * @returns {string} Formatted prompt for event description
 */
export const calendarEventDescriptionPrompt = (eventType, eventData) => {
  return `
Create a calendar event description for a ${eventType}:

Event Details: ${JSON.stringify(eventData)}

Generate a concise, informative description that includes:
- Key details about the event
- Any preparation needed
- Important reminders
- Related notes or context

Keep it brief but informative for calendar viewing.
`;
};

// ============================================================================
// GENERAL LIFE MANAGEMENT PROMPTS
// ============================================================================

/**
 * Generate daily planning prompt
 * @param {Array} tasks - List of tasks to prioritize
 * @param {Object} context - Daily context (energy, time, etc.)
 * @returns {string} Formatted prompt for daily planning
 */
export const dailyPlanningPrompt = (tasks, context) => {
  return `
Help plan this day:

Tasks: ${JSON.stringify(tasks, null, 2)}
Context: ${JSON.stringify(context, null, 2)}

Provide daily planning advice:
- priorityOrder: Suggested task priority order
- timeAllocation: Recommended time allocation
- energyManagement: Energy level considerations
- productivityTips: Tips for maximum productivity
- flexibilityNotes: Areas where plans can be adjusted
- successMetrics: How to measure a successful day

Focus on:
- Realistic planning
- Energy and time optimization
- Stress reduction
- Achievement of key priorities
- Work-life balance
`;
};

/**
 * Generate habit formation prompt
 * @param {string} habit - Habit to develop
 * @param {Object} userProfile - User's current habits and lifestyle
 * @returns {string} Formatted prompt for habit formation
 */
export const habitFormationPrompt = (habit, userProfile) => {
  return `
Help develop the habit: "${habit}"

User Profile: ${JSON.stringify(userProfile)}

Provide habit formation guidance:
- implementationPlan: Step-by-step implementation plan
- triggerStrategies: Strategies to create habit triggers
- rewardSystem: Suggested reward system
- trackingMethods: How to track progress
- commonObstacles: Potential obstacles and solutions
- timeline: Realistic timeline for habit formation
- motivationTips: Tips to stay motivated

Focus on:
- Small, sustainable steps
- Evidence-based strategies
- Personalization to user's lifestyle
- Long-term success
- Overcoming common barriers
`;
};

/**
 * Generate goal setting prompt
 * @param {string} area - Life area (fitness, nutrition, finance, etc.)
 * @param {Object} currentState - Current state in that area
 * @returns {string} Formatted prompt for goal setting
 */
export const goalSettingPrompt = (area, currentState) => {
  return `
Help set goals for: ${area}

Current State: ${JSON.stringify(currentState)}

Provide goal-setting guidance:
- shortTermGoals: 1-3 month goals
- mediumTermGoals: 3-12 month goals
- longTermGoals: 1+ year goals
- actionSteps: Specific action steps for each goal
- measurementCriteria: How to measure progress
- timeline: Realistic timelines
- motivationFactors: What will keep you motivated

Focus on:
- SMART goal principles
- Realistic and achievable targets
- Clear measurement criteria
- Sustainable progress
- Personal motivation factors
`;
};

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

/**
 * Get system prompt for meal planning
 * @returns {string} System prompt for meal planning AI
 */
export const getMealPlanningSystemPrompt = () => {
  return `You are a professional chef and meal planning expert. Provide practical, 
easy-to-follow meal suggestions that are realistic for home cooking. Consider the user's 
available ingredients, preferences, and dietary restrictions. Focus on healthy, balanced meals 
that are achievable with the given constraints. 

IMPORTANT: When asked for meal suggestions, respond with ONLY a valid JSON array. Do not include 
any explanatory text, markdown formatting, or additional content. The response must be parseable 
JSON that can be directly used by the application.`;
};

/**
 * Get system prompt for fitness coaching
 * @returns {string} System prompt for fitness coaching AI
 */
export const getFitnessSystemPrompt = () => {
  return `You are a certified personal trainer and fitness coach. Create safe, effective 
workout plans appropriate for the user's fitness level. Include proper form cues and 
progression options. Focus on sustainable progress and long-term success. Provide 
constructive, encouraging feedback.`;
};

/**
 * Get system prompt for financial advice
 * @returns {string} System prompt for financial advice AI
 */
export const getFinancialSystemPrompt = () => {
  return `You are a financial advisor. Provide practical, actionable budget advice that 
balances between financial goals and quality of life. Be realistic and consider the user's current 
situation. Focus on sustainable financial habits and long-term wealth building.`;
};

/**
 * Get system prompt for productivity coaching
 * @returns {string} System prompt for productivity coaching AI
 */
export const getProductivitySystemPrompt = () => {
  return `You are a productivity expert and life coach. Help optimize the user's schedule 
for maximum productivity and well-being. Consider energy management, realistic time estimates, 
and work-life balance. Focus on sustainable habits and systems.`;
}; 