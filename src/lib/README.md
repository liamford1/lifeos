# Delete Utilities

## deleteEntityWithCalendarEvent

A shared utility function for deleting entities and their corresponding calendar events.

### Usage

```javascript
import { deleteEntityWithCalendarEvent } from '@/lib/deleteUtils';

const error = await deleteEntityWithCalendarEvent({
  table: "fitness_workouts",
  id: workoutId,
  user_id: userId,
  source: "workout",
});
```

### Parameters

- `table` (string): The table name to delete from (e.g., "fitness_workouts", "meals", "expenses")
- `id` (string|number): The ID of the entity to delete
- `user_id` (string): The user ID for the entity
- `source` (string): The source type for calendar events (e.g., "workout", "cardio", "meal", "expense")

### Return Value

- Returns `null` on success
- Returns the Supabase error object if an error occurs

### Behavior

1. First deletes the calendar event where `source = source` and `source_id = id`
2. Then deletes the entity from the specified table
3. Both operations include user_id checks for security

### Supported Entity Types

- **Workouts**: `table: "fitness_workouts"`, `source: "workout"`
- **Cardio**: `table: "fitness_cardio"`, `source: "cardio"`
- **Sports**: `table: "fitness_sports"`, `source: "sports"`
- **Meals**: `table: "meals"`, `source: "meal"`
- **Planned Meals**: `table: "planned_meals"`, `source: "planned_meal"`
- **Expenses**: `table: "expenses"`, `source: "expense"`

### Example Implementation

```javascript
const handleDelete = async (id) => {
  const confirm = window.confirm('Delete this workout?');
  if (!confirm) return;

  const user = await supabase.auth.getUser();
  const user_id = user?.data?.user?.id;
  
  if (!user_id) {
    alert('You must be logged in.');
    return;
  }

  const error = await deleteEntityWithCalendarEvent({
    table: 'fitness_workouts',
    id: id,
    user_id: user_id,
    source: 'workout',
  });

  if (error) {
    console.error(error);
    alert('Failed to delete workout.');
  } else {
    setWorkouts((prev) => prev.filter((w) => w.id !== id));
  }
};
``` 