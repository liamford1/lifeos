import {
  mealPlannerPrompt,
  weeklyMealPlannerPrompt,
  recipeScalingPrompt,
  workoutRecommendationPrompt,
  expenseCategorizationPrompt,
  scheduleOptimizationPrompt,
  dailyPlanningPrompt,
  getMealPlanningSystemPrompt,
  getFitnessSystemPrompt,
  getFinancialSystemPrompt,
  getProductivitySystemPrompt,
} from '../prompts';

describe('AI Prompt Templates', () => {
  describe('mealPlannerPrompt', () => {
    it('should generate prompt with pantry items', () => {
      const pantryItems = [
        { name: 'pasta', quantity: 500, unit: 'g' },
        { name: 'tomato sauce', quantity: 2, unit: 'cups' },
      ];
      const preferences = { cuisine: 'italian', maxPrepTime: 30 };
      const dietaryRestrictions = ['vegetarian'];

      const prompt = mealPlannerPrompt(pantryItems, preferences, dietaryRestrictions);

      expect(prompt).toContain('pasta (500 g)');
      expect(prompt).toContain('tomato sauce (2 cups)');
      expect(prompt).toContain('cuisine: italian');
      expect(prompt).toContain('maxPrepTime: 30');
      expect(prompt).toContain('vegetarian');
      expect(prompt).toContain('Suggest 3 realistic meals');
    });

    it('should handle empty pantry', () => {
      const prompt = mealPlannerPrompt([], {}, []);

      expect(prompt).toContain('empty pantry');
      expect(prompt).toContain('suggest simple meals with common ingredients');
    });

    it('should handle no preferences or restrictions', () => {
      const pantryItems = [{ name: 'rice', quantity: 1, unit: 'kg' }];
      const prompt = mealPlannerPrompt(pantryItems);

      expect(prompt).toContain('rice (1 kg)');
      expect(prompt).not.toContain('Preferences:');
      expect(prompt).not.toContain('Dietary restrictions:');
    });
  });

  describe('weeklyMealPlannerPrompt', () => {
    it('should generate weekly meal planning prompt', () => {
      const pantryItems = [
        { name: 'chicken', quantity: 1, unit: 'kg' },
        { name: 'rice', quantity: 2, unit: 'kg' },
      ];
      const preferences = { cuisine: 'asian' };

      const prompt = weeklyMealPlannerPrompt(pantryItems, 7, preferences);

      expect(prompt).toContain('7-day meal plan');
      expect(prompt).toContain('chicken (1 kg)');
      expect(prompt).toContain('rice (2 kg)');
      expect(prompt).toContain('cuisine: asian');
      expect(prompt).toContain('breakfast: Quick breakfast option');
      expect(prompt).toContain('Format as JSON');
    });
  });

  describe('recipeScalingPrompt', () => {
    it('should generate recipe scaling prompt', () => {
      const recipe = {
        name: 'Pasta Carbonara',
        ingredients: [
          { name: 'pasta', quantity: 200, unit: 'g' },
          { name: 'eggs', quantity: 2, unit: 'pieces' },
        ],
        instructions: ['Boil pasta', 'Mix eggs'],
        prepTime: 10,
        cookTime: 15,
        servings: 2,
      };

      const prompt = recipeScalingPrompt(recipe, 4);

      expect(prompt).toContain('Scale this recipe from 2 servings to 4 servings');
      expect(prompt).toContain('Pasta Carbonara');
      expect(prompt).toContain('pasta');
      expect(prompt).toContain('eggs');
      expect(prompt).toContain('scaledIngredients');
      expect(prompt).toContain('adjustedPrepTime');
    });
  });

  describe('workoutRecommendationPrompt', () => {
    it('should generate workout recommendation prompt', () => {
      const fitnessLevel = 'intermediate';
      const availableTime = 45;
      const targetMuscleGroups = ['chest', 'back'];
      const equipment = ['dumbbells', 'bench'];

      const prompt = workoutRecommendationPrompt(
        fitnessLevel,
        availableTime,
        targetMuscleGroups,
        equipment
      );

      expect(prompt).toContain('45-minute workout');
      expect(prompt).toContain('intermediate fitness level');
      expect(prompt).toContain('chest, back');
      expect(prompt).toContain('dumbbells, bench');
      expect(prompt).toContain('warmup: 5-10 minute warm-up exercises');
      expect(prompt).toContain('mainWorkout: Array of exercises');
    });

    it('should handle bodyweight only workouts', () => {
      const prompt = workoutRecommendationPrompt('beginner', 30, ['legs'], []);

      expect(prompt).toContain('Bodyweight only');
      expect(prompt).toContain('beginner fitness level');
    });
  });

  describe('expenseCategorizationPrompt', () => {
    it('should generate expense categorization prompt', () => {
      const description = 'Grocery shopping at Walmart';
      const amount = 85.50;

      const prompt = expenseCategorizationPrompt(description, amount);

      expect(prompt).toContain('Grocery shopping at Walmart');
      expect(prompt).toContain('$85.5');
      expect(prompt).toContain('Food & Dining');
      expect(prompt).toContain('Transportation');
      expect(prompt).toContain('Other');
      expect(prompt).toContain('Respond with only the most appropriate category name');
    });
  });

  describe('scheduleOptimizationPrompt', () => {
    it('should generate schedule optimization prompt', () => {
      const events = [
        { name: 'Workout', duration: 60, priority: 'high' },
        { name: 'Meeting', duration: 30, priority: 'medium' },
      ];
      const preferences = { startTime: '9:00 AM', endTime: '6:00 PM' };

      const prompt = scheduleOptimizationPrompt(events, preferences);

      expect(prompt).toContain('Workout');
      expect(prompt).toContain('Meeting');
      expect(prompt).toContain('"startTime": "9:00 AM"');
      expect(prompt).toContain('Energy levels throughout the day');
      expect(prompt).toContain('optimizedSchedule');
      expect(prompt).toContain('reasoning');
    });
  });

  describe('dailyPlanningPrompt', () => {
    it('should generate daily planning prompt', () => {
      const tasks = [
        { name: 'Complete project', priority: 'high' },
        { name: 'Exercise', priority: 'medium' },
      ];
      const context = { energy: 'high', availableTime: 480 };

      const prompt = dailyPlanningPrompt(tasks, context);

      expect(prompt).toContain('Complete project');
      expect(prompt).toContain('Exercise');
      expect(prompt).toContain('"energy": "high"');
      expect(prompt).toContain('"availableTime": 480');
      expect(prompt).toContain('priorityOrder');
      expect(prompt).toContain('timeAllocation');
      expect(prompt).toContain('energyManagement');
    });
  });

  describe('System Prompts', () => {
    it('should return meal planning system prompt', () => {
      const prompt = getMealPlanningSystemPrompt();

      expect(prompt).toContain('professional chef');
      expect(prompt).toContain('meal planning expert');
      expect(prompt).toContain('realistic for home cooking');
      expect(prompt).toContain('valid JSON');
    });

    it('should return fitness system prompt', () => {
      const prompt = getFitnessSystemPrompt();

      expect(prompt).toContain('certified personal trainer');
      expect(prompt).toContain('fitness coach');
      expect(prompt).toContain('safe, effective');
      expect(prompt).toContain('sustainable progress');
    });

    it('should return financial system prompt', () => {
      const prompt = getFinancialSystemPrompt();

      expect(prompt).toContain('financial advisor');
      expect(prompt).toContain('practical, actionable');
      expect(prompt).toContain('balances between financial goals and quality of life');
      expect(prompt).toContain('sustainable financial habits');
    });

    it('should return productivity system prompt', () => {
      const prompt = getProductivitySystemPrompt();

      expect(prompt).toContain('productivity expert');
      expect(prompt).toContain('life coach');
      expect(prompt).toContain('energy management');
      expect(prompt).toContain('work-life balance');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty arrays gracefully', () => {
      const prompt = mealPlannerPrompt([], {}, []);
      expect(prompt).toContain('empty pantry');
    });

    it('should handle null/undefined values', () => {
      const prompt = mealPlannerPrompt(null, undefined, null);
      expect(prompt).toContain('empty pantry');
    });

    it('should handle special characters in text', () => {
      const pantryItems = [{ name: 'Tomato Sauce (Spicy)', quantity: 1, unit: 'bottle' }];
      const prompt = mealPlannerPrompt(pantryItems);
      expect(prompt).toContain('Tomato Sauce (Spicy)');
    });
  });
}); 