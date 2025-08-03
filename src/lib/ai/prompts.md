# AI Prompt Templates

This module provides reusable prompt template functions for various AI features in the life management platform. Each function takes specific parameters and returns a formatted prompt string optimized for different use cases.

## 📋 Table of Contents

- [Meal Planning Prompts](#meal-planning-prompts)
- [Fitness & Workout Prompts](#fitness--workout-prompts)
- [Financial Prompts](#financial-prompts)
- [Calendar & Scheduling Prompts](#calendar--scheduling-prompts)
- [General Life Management Prompts](#general-life-management-prompts)
- [System Prompts](#system-prompts)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

## 🍽️ Meal Planning Prompts

### `mealPlannerPrompt(pantryItems, preferences, dietaryRestrictions)`

Generates meal suggestions based on pantry inventory.

**Parameters:**
- `pantryItems` (Array): Array of pantry items with `{name, quantity, unit}`
- `preferences` (Object): User preferences (cuisine, maxPrepTime, etc.)
- `dietaryRestrictions` (Array): Array of dietary restrictions

**Returns:** Formatted prompt for meal suggestions

**Example:**
```javascript
import { mealPlannerPrompt } from '@/lib/ai/prompts';

const prompt = mealPlannerPrompt(
  [
    { name: 'pasta', quantity: 500, unit: 'g' },
    { name: 'tomato sauce', quantity: 2, unit: 'cups' }
  ],
  { cuisine: 'italian', maxPrepTime: 30 },
  ['vegetarian']
);
```

### `weeklyMealPlannerPrompt(pantryItems, days, preferences)`

Generates a weekly meal plan using pantry items.

**Parameters:**
- `pantryItems` (Array): Current pantry inventory
- `days` (number): Number of days to plan for (default: 7)
- `preferences` (Object): User preferences

**Returns:** Formatted prompt for weekly meal planning

### `recipeScalingPrompt(recipe, targetServings)`

Scales a recipe to a different number of servings.

**Parameters:**
- `recipe` (Object): Original recipe object
- `targetServings` (number): Target number of servings

**Returns:** Formatted prompt for recipe scaling

## 💪 Fitness & Workout Prompts

### `workoutRecommendationPrompt(fitnessLevel, availableTime, targetMuscleGroups, equipment)`

Generates personalized workout recommendations.

**Parameters:**
- `fitnessLevel` (string): 'beginner', 'intermediate', or 'advanced'
- `availableTime` (number): Available time in minutes
- `targetMuscleGroups` (Array): Target muscle groups
- `equipment` (Array): Available equipment (default: [])

**Returns:** Formatted prompt for workout recommendations

**Example:**
```javascript
import { workoutRecommendationPrompt } from '@/lib/ai/prompts';

const prompt = workoutRecommendationPrompt(
  'intermediate',
  45,
  ['chest', 'back'],
  ['dumbbells', 'bench']
);
```

### `fitnessProgressPrompt(workoutHistory, goals)`

Analyzes fitness progress and provides recommendations.

**Parameters:**
- `workoutHistory` (Array): Array of past workouts
- `goals` (Object): User's fitness goals

**Returns:** Formatted prompt for progress analysis

## 💰 Financial Prompts

### `expenseCategorizationPrompt(expenseDescription, amount)`

Categorizes expenses automatically.

**Parameters:**
- `expenseDescription` (string): Description of the expense
- `amount` (number): Expense amount

**Returns:** Formatted prompt for expense categorization

**Available Categories:**
- Food & Dining
- Transportation
- Entertainment
- Shopping
- Health & Fitness
- Bills & Utilities
- Travel
- Education
- Other

### `budgetAnalysisPrompt(income, expenses, goals)`

Provides budget analysis and recommendations.

**Parameters:**
- `income` (number): Monthly income
- `expenses` (Array): Array of monthly expenses
- `goals` (Object): Financial goals

**Returns:** Formatted prompt for budget analysis

## 📅 Calendar & Scheduling Prompts

### `scheduleOptimizationPrompt(events, preferences)`

Optimizes daily schedule for maximum productivity.

**Parameters:**
- `events` (Array): Array of events to schedule
- `preferences` (Object): User preferences and constraints

**Returns:** Formatted prompt for schedule optimization

### `calendarEventDescriptionPrompt(eventType, eventData)`

Generates calendar event descriptions.

**Parameters:**
- `eventType` (string): Type of event (workout, meal, etc.)
- `eventData` (Object): Event details

**Returns:** Formatted prompt for event description

## 🎯 General Life Management Prompts

### `dailyPlanningPrompt(tasks, context)`

Helps prioritize and plan daily tasks.

**Parameters:**
- `tasks` (Array): List of tasks to prioritize
- `context` (Object): Daily context (energy, time, etc.)

**Returns:** Formatted prompt for daily planning

### `habitFormationPrompt(habit, userProfile)`

Provides guidance for habit formation.

**Parameters:**
- `habit` (string): Habit to develop
- `userProfile` (Object): User's current habits and lifestyle

**Returns:** Formatted prompt for habit formation

### `goalSettingPrompt(area, currentState)`

Helps set SMART goals for different life areas.

**Parameters:**
- `area` (string): Life area (fitness, nutrition, finance, etc.)
- `currentState` (Object): Current state in that area

**Returns:** Formatted prompt for goal setting

## 🤖 System Prompts

### `getMealPlanningSystemPrompt()`

Returns system prompt for meal planning AI.

### `getFitnessSystemPrompt()`

Returns system prompt for fitness coaching AI.

### `getFinancialSystemPrompt()`

Returns system prompt for financial advice AI.

### `getProductivitySystemPrompt()`

Returns system prompt for productivity coaching AI.

## 📝 Usage Examples

### Basic Meal Planning

```javascript
import { mealPlannerPrompt, getMealPlanningSystemPrompt } from '@/lib/ai/prompts';
import { getStructuredResponse } from '@/lib/ai';

const pantryItems = [
  { name: 'chicken', quantity: 1, unit: 'kg' },
  { name: 'rice', quantity: 2, unit: 'kg' },
  { name: 'vegetables', quantity: 500, unit: 'g' }
];

const prompt = mealPlannerPrompt(pantryItems, { cuisine: 'asian' }, []);
const systemPrompt = getMealPlanningSystemPrompt();

const response = await getStructuredResponse(prompt, {
  systemPrompt,
  temperature: 0.3,
  maxTokens: 2000
});
```

### Workout Recommendations

```javascript
import { workoutRecommendationPrompt, getFitnessSystemPrompt } from '@/lib/ai/prompts';

const prompt = workoutRecommendationPrompt(
  'beginner',
  30,
  ['legs', 'core'],
  ['bodyweight']
);

const systemPrompt = getFitnessSystemPrompt();
```

### Expense Categorization

```javascript
import { expenseCategorizationPrompt } from '@/lib/ai/prompts';
import { callOpenAI } from '@/lib/ai';

const prompt = expenseCategorizationPrompt('Grocery shopping at Walmart', 85.50);

const category = await callOpenAI(prompt, {
  temperature: 0.1,
  maxTokens: 50
});
```

### Schedule Optimization

```javascript
import { scheduleOptimizationPrompt } from '@/lib/ai/prompts';

const events = [
  { name: 'Workout', duration: 60, priority: 'high' },
  { name: 'Meeting', duration: 30, priority: 'medium' },
  { name: 'Lunch', duration: 45, priority: 'low' }
];

const preferences = {
  startTime: '9:00 AM',
  endTime: '6:00 PM',
  energyPeak: 'morning'
};

const prompt = scheduleOptimizationPrompt(events, preferences);
```

## 🛡️ Error Handling

All prompt functions include robust error handling:

- **Null/Undefined Values**: Functions handle null or undefined parameters gracefully
- **Empty Arrays**: Proper handling of empty input arrays
- **Special Characters**: Safe handling of special characters in text
- **JSON Formatting**: Proper JSON stringification with formatting

## 🎨 Best Practices

### 1. **Consistent Parameter Structure**
Always pass parameters in the expected format:
```javascript
// ✅ Good
const pantryItems = [
  { name: 'pasta', quantity: 500, unit: 'g' }
];

// ❌ Bad
const pantryItems = ['pasta', '500g'];
```

### 2. **Use System Prompts**
Always pair user prompts with appropriate system prompts:
```javascript
const userPrompt = mealPlannerPrompt(pantryItems, preferences);
const systemPrompt = getMealPlanningSystemPrompt();

const response = await getStructuredResponse(userPrompt, {
  systemPrompt,
  temperature: 0.3
});
```

### 3. **Handle Edge Cases**
Consider edge cases when using prompts:
```javascript
// Handle empty pantry
if (pantryItems.length === 0) {
  // Provide helpful message or default suggestions
}

// Handle missing preferences
const preferences = userPreferences || {};
```

### 4. **Validate AI Responses**
Always validate and sanitize AI responses:
```javascript
const response = await getStructuredResponse(prompt, options);

// Validate response structure
if (!response.suggestions || !Array.isArray(response.suggestions)) {
  throw new Error('Invalid response format');
}
```

## 🔧 Integration with AI Module

These prompts are designed to work seamlessly with the AI module:

```javascript
import { mealPlannerPrompt, getMealPlanningSystemPrompt } from '@/lib/ai/prompts';
import { getStructuredResponse } from '@/lib/ai';

// Generate prompt
const prompt = mealPlannerPrompt(pantryItems, preferences, restrictions);
const systemPrompt = getMealPlanningSystemPrompt();

// Get AI response
const suggestions = await getStructuredResponse(prompt, {
  systemPrompt,
  temperature: 0.3,
  maxTokens: 2000
});
```

## 🚀 Future Enhancements

The prompt system is designed to be extensible:

- **Custom Prompt Templates**: Easy to add new prompt types
- **Parameter Validation**: Built-in validation for prompt parameters
- **Localization**: Support for multiple languages
- **Personalization**: User-specific prompt customization
- **A/B Testing**: Different prompt variations for optimization

## 📊 Testing

All prompts are thoroughly tested:

```bash
npm test src/lib/ai/__tests__/prompts.test.js
```

Tests cover:
- ✅ Parameter handling
- ✅ Edge cases
- ✅ Output formatting
- ✅ System prompts
- ✅ Error scenarios 