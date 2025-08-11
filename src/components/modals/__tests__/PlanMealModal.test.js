import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PlanMealModal from '../PlanMealModal';

// Mock the dependencies
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => Promise.resolve({ data: [], error: null }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: { id: 'test-id' }, error: null }))
        }))
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null }))
      }))
    }))
  }
}));

jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    loading: false
  })
}));

jest.mock('@/components/client/Toast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: () => ({
    mutate: jest.fn(),
    isPending: false
  }),
  useQueryClient: () => ({
    invalidateQueries: jest.fn()
  })
}));

jest.mock('@/lib/calendarSync', () => ({
  createCalendarEventForEntity: jest.fn(() => Promise.resolve(null)),
  deleteCalendarEventForEntity: jest.fn(() => Promise.resolve(null))
}));

jest.mock('@/components/forms/AIMealSuggestionsModal', () => {
  return function MockAIMealSuggestionsModal({ isOpen, onClose, onMealAdded }) {
    if (!isOpen) return null;
    return (
      <div data-testid="ai-meal-suggestions-modal">
        <button onClick={onClose}>Close AI Modal</button>
        <button onClick={() => onMealAdded && onMealAdded()}>Add Meal</button>
      </div>
    );
  };
});

describe('PlanMealModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onSuccess: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders when isOpen is true', async () => {
    render(<PlanMealModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Plan a Meal')).toBeInTheDocument();
    });
    expect(screen.getByText('Schedule meals for the week ahead')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<PlanMealModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Plan a Meal')).not.toBeInTheDocument();
  });

  it('displays the meal selection form', async () => {
    render(<PlanMealModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByTestId('meal-select')).toBeInTheDocument();
    });
    expect(screen.getByTestId('meal-time-select')).toBeInTheDocument();
    // Check that the dinner option exists in the select
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('shows AI suggestions button', async () => {
    render(<PlanMealModal {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('AI Suggest Meals')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', async () => {
    render(<PlanMealModal {...defaultProps} />);
    
    await waitFor(() => {
      const closeButton = screen.getByRole('button', { name: /close modal/i });
      closeButton.click();
    });
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('sets default date to today when no selectedDate is provided', async () => {
    render(<PlanMealModal {...defaultProps} />);
    
    await waitFor(() => {
      // Find the date input and check that it has a value
      const dateInput = screen.getByDisplayValue(/^\d{4}-\d{2}-\d{2}$/);
      expect(dateInput).toBeInTheDocument();
      expect(dateInput).toHaveAttribute('type', 'date');
    });
  });

  it('sets date to selectedDate when provided', async () => {
    const selectedDate = '2024-01-15';
    render(<PlanMealModal {...defaultProps} selectedDate={selectedDate} />);
    
    await waitFor(() => {
      const dateInput = screen.getByDisplayValue(selectedDate);
      expect(dateInput).toBeInTheDocument();
    });
  });
}); 