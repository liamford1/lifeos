import React from 'react';
import { render, screen } from '@testing-library/react';
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
  return function MockAIMealSuggestionsModal({ onClose }) {
    return (
      <div data-testid="ai-meal-suggestions-modal">
        <button onClick={onClose}>Close AI Modal</button>
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

  it('renders when isOpen is true', () => {
    render(<PlanMealModal {...defaultProps} />);
    
    expect(screen.getByText('Plan a Meal')).toBeInTheDocument();
    expect(screen.getByText('Schedule meals for the week ahead')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<PlanMealModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Plan a Meal')).not.toBeInTheDocument();
  });

  it('displays the meal selection form', () => {
    render(<PlanMealModal {...defaultProps} />);
    
    expect(screen.getByTestId('meal-select')).toBeInTheDocument();
    expect(screen.getByTestId('meal-time-select')).toBeInTheDocument();
    // Check that the dinner option exists in the select
    expect(screen.getByText('Dinner')).toBeInTheDocument();
  });

  it('shows AI suggestions button', () => {
    render(<PlanMealModal {...defaultProps} />);
    
    expect(screen.getByText('AI Suggest Meals')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(<PlanMealModal {...defaultProps} />);
    
    // Find the close button by its position (first button in header)
    const closeButton = screen.getAllByRole('button')[0];
    closeButton.click();
    
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('sets default date to today when no selectedDate is provided', () => {
    render(<PlanMealModal {...defaultProps} />);
    
    const today = new Date().toISOString().split('T')[0];
    const dateInput = screen.getByDisplayValue(today);
    expect(dateInput).toBeInTheDocument();
  });

  it('sets date to selectedDate when provided', () => {
    const selectedDate = '2024-01-15';
    render(<PlanMealModal {...defaultProps} selectedDate={selectedDate} />);
    
    const dateInput = screen.getByDisplayValue(selectedDate);
    expect(dateInput).toBeInTheDocument();
  });
}); 