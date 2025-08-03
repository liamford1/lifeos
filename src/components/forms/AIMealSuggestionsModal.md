# AI Meal Suggestions Modal

This component provides an AI-powered meal suggestion feature that helps users discover what they can cook with their current pantry inventory.

## Features

### 🧠 AI-Powered Suggestions
- Analyzes user's current pantry inventory
- Generates realistic meal suggestions based on available ingredients
- Considers cooking time, difficulty, and missing ingredients
- Provides complete recipes with instructions

### 📋 Pantry Integration
- Automatically fetches user's current pantry items
- Displays pantry summary in the modal
- Shows ingredient quantities and units
- Handles empty pantry gracefully

### 🗓️ One-Click Planning
- Add suggested meals directly to the meal planner
- Select date and meal time (breakfast, lunch, dinner, snack)
- Automatically creates calendar events
- Updates the planner view immediately

## Usage

### In the Food Planner Page
```javascript
import AIMealSuggestionsModal from '@/components/forms/AIMealSuggestionsModal';

// Add state for modal visibility
const [showAIModal, setShowAIModal] = useState(false);

// Add button to open modal
<Button onClick={() => setShowAIModal(true)}>
  <MdLightbulb className="w-4 h-4 mr-2" />
  AI Suggest Meals
</Button>

// Add modal component
{showAIModal && (
  <AIMealSuggestionsModal
    onClose={() => setShowAIModal(false)}
    onMealAdded={handleMealAdded}
  />
)}
```

### Modal Props
- `onClose`: Function called when modal is closed
- `onMealAdded`: Function called when a meal is successfully added to planner

## User Flow

1. **Open Modal**: User clicks "AI Suggest Meals" button
2. **Pantry Analysis**: Modal fetches and displays current pantry items
3. **Get Suggestions**: User clicks "Get AI Meal Suggestions" button
4. **AI Processing**: Modal calls `/api/ai/meal-suggestions` with pantry data
5. **Display Results**: Shows 3 meal suggestions with full details
6. **Select Date/Time**: User chooses when to plan the meal
7. **Add to Planner**: One-click adds meal to planner with calendar event

## Meal Suggestion Structure

Each AI-generated meal includes:
- **Name**: Descriptive meal title
- **Description**: Brief overview
- **Ingredients**: List with quantities and units
- **Prep Time**: Estimated preparation time
- **Cook Time**: Estimated cooking time
- **Difficulty**: Easy, medium, or hard
- **Instructions**: Step-by-step cooking directions
- **Servings**: Number of people it serves
- **Missing Ingredients**: Items not in pantry (if any)

## Error Handling

- **Empty Pantry**: Shows helpful message to add items first
- **AI Service Errors**: Displays user-friendly error messages
- **Network Issues**: Graceful fallback with retry options
- **Invalid Data**: Validates and sanitizes AI responses

## Integration Points

- **Database**: Creates meals in `meals` table with `ai_generated: true`
- **Calendar**: Automatically creates calendar events for planned meals
- **Planner**: Updates the meal planner view immediately
- **Pantry**: Reads current inventory for suggestions

## Technical Details

### API Integration
- Uses `getMealSuggestions()` client function
- Calls `/api/ai/meal-suggestions` endpoint
- Handles authentication and error states

### State Management
- Uses React Query for mutations
- Manages loading states and error handling
- Updates parent component when meals are added

### UI/UX
- Responsive modal design
- Loading indicators and progress feedback
- Accessible form controls
- Consistent with app's design system

## Example Response

```javascript
{
  suggestions: [
    {
      name: "Pasta with Tomato Sauce",
      description: "Simple and delicious pasta dish",
      ingredients: [
        { name: "pasta", quantity: 200, unit: "g" },
        { name: "tomato sauce", quantity: 1, unit: "cup" }
      ],
      prepTime: 10,
      cookTime: 15,
      difficulty: "easy",
      instructions: ["Boil pasta", "Heat sauce", "Combine"],
      estimatedServings: 2,
      missingIngredients: []
    }
  ]
}
```

## Future Enhancements

- **Dietary Preferences**: Filter suggestions by dietary restrictions
- **Cuisine Preferences**: Prioritize certain cuisines
- **Cooking Time Filters**: Limit suggestions by available time
- **Ingredient Substitutions**: Suggest alternatives for missing items
- **Nutritional Information**: Include calorie and macro data
- **User Feedback**: Rate and improve suggestions over time 