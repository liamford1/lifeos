# API Error Handling & Toast System

This directory contains centralized hooks for handling API errors and toast notifications consistently across the application.

## useApiError Hook

The `useApiError` hook provides centralized error handling for Supabase operations with optional toast notifications.

### Usage

```javascript
import { useApiError } from '@/lib/hooks/useApiError';

function MyComponent() {
  const { handleError, handleSuccess, withErrorHandling } = useApiError();

  // Basic error handling with toast
  const handleBasicError = async () => {
    try {
      const { data, error } = await supabase.from('table').select('*');
      if (error) {
        handleError(error, { 
          customMessage: 'Failed to fetch data' 
        });
        return;
      }
      handleSuccess('Data fetched successfully!');
    } catch (error) {
      handleError(error, { 
        customMessage: 'An unexpected error occurred' 
      });
    }
  };

  // Error handling without toast
  const handleSilentError = async () => {
    try {
      const { data, error } = await supabase.from('table').select('*');
      if (error) {
        const errorObj = handleError(error, { 
          showToast: false,
          customMessage: 'Failed to fetch data' 
        });
        // Handle error programmatically
        console.error(errorObj);
        return;
      }
      handleSuccess('Data fetched successfully!', { showToast: false });
    } catch (error) {
      handleError(error, { showToast: false });
    }
  };

  // Using the wrapper function
  const handleWithWrapper = async () => {
    const result = await withErrorHandling(
      () => supabase.from('table').select('*'),
      { customMessage: 'Failed to fetch data' }
    );
    
    if (result.error) {
      // Handle error
      return;
    }
    
    // Use result.data
  };
}
```

### Options

The error handling functions accept an options object with:

- `customMessage`: Custom error message to show instead of the original error message
- `showToast`: Whether to show a toast notification (default: true)
- `onError`: Custom error handler function
- `onSuccess`: Custom success handler function

## Updated CRUD Hooks

All CRUD hooks now support optional toast notifications:

### useSupabaseCrud

```javascript
import { useInsertEntity, useUpdateEntity, useDeleteEntity } from '@/lib/useSupabaseCrud';

function MyComponent() {
  const { insert } = useInsertEntity('my_table');
  const { update } = useUpdateEntity('my_table');
  const { deleteByFilters } = useDeleteEntity('my_table');

  // With toast (default)
  const handleInsert = async () => {
    const result = await insert(data);
  };

  // Without toast
  const handleSilentInsert = async () => {
    const result = await insert(data, { showToast: false });
  };
}
```

### useMeals, useCardioSessions, useSportsSessions, useWorkouts

All these hooks now accept an optional `options` parameter:

```javascript
import { useMeals } from '@/lib/hooks/useMeals';

function MyComponent() {
  const { createMeal } = useMeals();

  // With toast (default)
  const handleCreateMeal = async () => {
    const meal = await createMeal(mealData);
  };

  // Without toast
  const handleSilentCreateMeal = async () => {
    const meal = await createMeal(mealData, { showToast: false });
  };
}
```

## Migration Guide

### Before (Old System)
```javascript
import { useToast } from '@/components/Toast';

function MyComponent() {
  const { showSuccess, showError } = useToast();

  const handleOperation = async () => {
    try {
      const { data, error } = await supabase.from('table').select('*');
      if (error) {
        showError(error.message || 'Failed to fetch data');
        return;
      }
      showSuccess('Data fetched successfully!');
    } catch (error) {
      showError('An unexpected error occurred');
    }
  };
}
```

### After (New System)
```javascript
import { useApiError } from '@/lib/hooks/useApiError';

function MyComponent() {
  const { handleError, handleSuccess } = useApiError();

  const handleOperation = async () => {
    try {
      const { data, error } = await supabase.from('table').select('*');
      if (error) {
        handleError(error, { 
          customMessage: 'Failed to fetch data' 
        });
        return;
      }
      handleSuccess('Data fetched successfully!');
    } catch (error) {
      handleError(error, { 
        customMessage: 'An unexpected error occurred' 
      });
    }
  };
}
```

## Benefits

1. **Consistent Error Handling**: All API errors are handled the same way across the app
2. **Optional Toasts**: CRUD operations can be silent when needed (e.g., background updates)
3. **Better Error Objects**: Standardized error objects with additional context
4. **Custom Error Messages**: Ability to provide user-friendly error messages
5. **Flexible Success Handling**: Optional success toasts and custom success handlers
6. **Maintainability**: Centralized logic makes it easier to update error handling behavior 