import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MealsModal from '../MealsModal';

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
      }))
    }))
  }
}));

// Mock dependencies
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({ user: { id: 'test-user-id' }, loading: false }),
}));

jest.mock('@/lib/hooks/useMeals', () => ({
  useMealsQuery: () => ({
    data: [
      {
        id: '1',
        name: 'Test Meal 1',
        description: 'A test meal',
        prep_time: 15,
        cook_time: 30,
        servings: 2
      },
      {
        id: '2',
        name: 'Test Meal 2',
        description: 'Another test meal',
        prep_time: 10,
        cook_time: 20,
        servings: 1
      }
    ],
    isLoading: false,
    error: null,
    refetch: jest.fn(),
  }),
  useDeleteMealMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
    variables: null,
  }),
}));

jest.mock('@/components/modals/AddMealModal', () => {
  return function MockAddMealModal({ isOpen, onClose, onSuccess }) {
    if (!isOpen) return null;
    return (
      <div data-testid="add-meal-modal">
        <button onClick={onClose}>Close Add Meal</button>
        <button onClick={() => onSuccess && onSuccess()}>Success</button>
      </div>
    );
  };
});

jest.mock('@/components/modals/MealDetailsModal', () => {
  return function MockMealDetailsModal({ isOpen, onClose, mealId }) {
    if (!isOpen) return null;
    return (
      <div data-testid="meal-details-modal">
        <button onClick={onClose}>Close Meal Details</button>
        <span>Meal ID: {mealId}</span>
      </div>
    );
  };
});

describe('MealsModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    render(
      <MealsModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('Meals')).toBeInTheDocument();
    expect(screen.getByText('Browse and manage your saved meal recipes')).toBeInTheDocument();
    expect(screen.getByText('Add Meal')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(
      <MealsModal 
        isOpen={false} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.queryByText('Meals')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <MealsModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays meal list correctly', () => {
    render(
      <MealsModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('Test Meal 1')).toBeInTheDocument();
    expect(screen.getByText('Test Meal 2')).toBeInTheDocument();
    expect(screen.getByText('A test meal')).toBeInTheDocument();
    expect(screen.getByText('Another test meal')).toBeInTheDocument();
    expect(screen.getByText('Prep: 15 min • Cook: 30 min • Servings: 2')).toBeInTheDocument();
  });

  it('opens AddMealModal when Add Meal button is clicked', () => {
    render(
      <MealsModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );

    const addMealButton = screen.getByText('Add Meal');
    fireEvent.click(addMealButton);

    expect(screen.getByTestId('add-meal-modal')).toBeInTheDocument();
  });

  it('has delete buttons for each meal', () => {
    render(
      <MealsModal 
        isOpen={true} 
        onClose={mockOnClose} 
      />
    );

    // Check that there are meal items with delete functionality
    const mealItems = screen.getAllByText(/Test Meal/);
    expect(mealItems).toHaveLength(2);
    
    // Check that delete buttons are present (they have trash icons)
    const allButtons = screen.getAllByRole('button');
    const deleteButtons = allButtons.filter(button => 
      button.querySelector('svg') && 
      button.querySelector('svg').innerHTML.includes('M3 6h18')
    );
    expect(deleteButtons).toHaveLength(2);
  });
}); 