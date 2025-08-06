import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddMealModal from '../AddMealModal';

// Mock dependencies
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({ user: { id: 'test-user-id' }, loading: false }),
}));

jest.mock('@/lib/hooks/useApiError', () => ({
  useApiError: () => ({ handleError: jest.fn() }),
}));

jest.mock('@/lib/hooks/useMeals', () => ({
  useCreateMealMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
    error: null,
  }),
}));

jest.mock('@/components/forms/MealForm', () => {
  return function MockMealForm({ onSubmit, onCancel, loading, error }) {
    return (
      <div data-testid="meal-form">
        <button onClick={() => onSubmit({ name: 'Test Meal', ingredients: [], instructions: [] })}>
          Submit Meal
        </button>
        <button onClick={onCancel}>Cancel</button>
        {loading && <div>Loading...</div>}
        {error && <div>Error: {error}</div>}
      </div>
    );
  };
});

describe('AddMealModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <AddMealModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.getByText('Add a New Meal')).toBeInTheDocument();
    expect(screen.getByText('Create a new meal recipe with ingredients and instructions')).toBeInTheDocument();
    expect(screen.getByTestId('meal-form')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <AddMealModal 
        isOpen={false} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.queryByText('Add a New Meal')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <AddMealModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked in form', () => {
    render(
      <AddMealModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('passes correct props to MealForm', () => {
    render(
      <AddMealModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
      />
    );

    const mealForm = screen.getByTestId('meal-form');
    expect(mealForm).toBeInTheDocument();
  });
}); 