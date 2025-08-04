import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AIMealSuggestionsModal from '../AIMealSuggestionsModal';

// Mock dependencies
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    loading: false,
  }),
}));

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [
              { id: '1', name: 'Pasta', quantity: 500, unit: 'g' },
              { id: '2', name: 'Tomato Sauce', quantity: 2, unit: 'cups' },
            ],
            error: null,
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'new-meal-id' },
            error: null,
          })),
        })),
      })),
    })),
  },
}));

jest.mock('@/lib/api/ai/mealSuggestionsClient', () => ({
  getMealSuggestions: jest.fn(() => Promise.resolve({
    suggestions: [
      {
        name: 'Pasta with Tomato Sauce',
        description: 'Simple and delicious pasta dish',
        ingredients: [
          { name: 'pasta', quantity: 200, unit: 'g' },
          { name: 'tomato sauce', quantity: 1, unit: 'cup' },
        ],
        prepTime: 10,
        cookTime: 15,
        difficulty: 'easy',
        instructions: ['Boil pasta', 'Heat sauce', 'Combine'],
        estimatedServings: 2,
        missingIngredients: [],
      },
    ],
  })),
}));

jest.mock('@/components/client/Toast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: jest.fn(),
    isPending: false,
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('@/lib/calendarSync', () => ({
  createCalendarEventForEntity: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@/lib/utils/calendarUtils', () => ({
  CALENDAR_SOURCES: {
    PLANNED_MEAL: 'planned_meal',
  },
}));

describe('AIMealSuggestionsModal', () => {
  const mockOnClose = jest.fn();
  const mockOnMealAdded = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the modal with pantry summary', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    // Wait for pantry items to load
    await waitFor(() => {
      expect(screen.getByText('AI Meal Suggestions')).toBeInTheDocument();
      expect(screen.getByText('Current Pantry (2 items)')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Pasta (500 g)')).toBeInTheDocument();
    expect(screen.getByText('Tomato Sauce (2 cups)')).toBeInTheDocument();
  });

  it('shows get suggestions button', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Get AI Meal Suggestions')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      fireEvent.click(closeButton);
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('displays suggestions after clicking get suggestions button', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Get AI Meal Suggestions')).toBeInTheDocument();
    });

    const getSuggestionsButton = screen.getByText('Get AI Meal Suggestions');
    fireEvent.click(getSuggestionsButton);

    await waitFor(() => {
      expect(screen.getByText('Suggested Meals')).toBeInTheDocument();
      expect(screen.getByText('Pasta with Tomato Sauce')).toBeInTheDocument();
      expect(screen.getByText('Simple and delicious pasta dish')).toBeInTheDocument();
    });
  });

  it('shows date and time selection when suggestions are displayed', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Get AI Meal Suggestions')).toBeInTheDocument();
    });

    const getSuggestionsButton = screen.getByText('Get AI Meal Suggestions');
    fireEvent.click(getSuggestionsButton);

    await waitFor(() => {
      expect(screen.getByLabelText('Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Meal Time')).toBeInTheDocument();
    });
  });

  it('shows add to planner button for each suggestion', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Get AI Meal Suggestions')).toBeInTheDocument();
    });

    const getSuggestionsButton = screen.getByText('Get AI Meal Suggestions');
    fireEvent.click(getSuggestionsButton);

    await waitFor(() => {
      const addButtons = screen.getAllByText('Add to Planner');
      expect(addButtons).toHaveLength(1);
    });
  });

  it('displays meal details correctly', async () => {
    render(
      <AIMealSuggestionsModal
        onClose={mockOnClose}
        onMealAdded={mockOnMealAdded}
      />
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('Get AI Meal Suggestions')).toBeInTheDocument();
    });

    const getSuggestionsButton = screen.getByText('Get AI Meal Suggestions');
    fireEvent.click(getSuggestionsButton);

    await waitFor(() => {
      expect(screen.getByText('Prep: 10 min')).toBeInTheDocument();
      expect(screen.getByText('Cook: 15 min')).toBeInTheDocument();
      expect(screen.getByText('easy')).toBeInTheDocument();
      expect(screen.getByText('Ingredients:')).toBeInTheDocument();
      expect(screen.getByText('pasta (200 g)')).toBeInTheDocument();
      expect(screen.getByText('tomato sauce (1 cup)')).toBeInTheDocument();
    });
  });
}); 