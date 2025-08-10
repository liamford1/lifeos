import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CalendarView from '../CalendarView';

// Mock the dependencies
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' }
  })
}));

jest.mock('@/components/client/CalendarClient', () => {
  return function MockCalendar({ onChange, value, tileClassName, tileProps, tileContent }) {
    const today = new Date();
    const days = [];
    
    // Generate some test days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }

    return (
      <div data-testid="calendar">
        {days.map((date, index) => {
          const isSelected = value && date.toDateString() === value.toDateString();
          const className = tileClassName ? tileClassName({ date, view: 'month' }) : '';
          const props = tileProps ? tileProps({ date, view: 'month' }) : {};
          
          return (
            <div
              key={index}
              data-testid={`calendar-day-${date.toISOString().split('T')[0]}`}
              className={`calendar-day ${className}`}
              data-selected={isSelected}
              {...props}
              onClick={() => onChange && onChange(date)}
            >
              <div className="day-number">{date.getDate()}</div>
              {tileContent && tileContent({ date, view: 'month' })}
            </div>
          );
        })}
      </div>
    );
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: () => ({
    data: [],
    isLoading: false
  }),
  useQueryClient: () => ({
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn()
  })
}));

jest.mock('@/lib/hooks/useApiError', () => ({
  useApiError: () => ({
    handleError: jest.fn(),
    handleSuccess: jest.fn()
  })
}));

jest.mock('@/components/client/Toast', () => ({
  useToast: () => ({
    showSuccess: jest.fn()
  })
}));

jest.mock('@/lib/hooks/useCalendarDragAndDrop', () => ({
  useCalendarDragAndDrop: () => ({
    draggingId: null,
    startDrag: jest.fn(),
    moveDrag: jest.fn(),
    endDrag: jest.fn(),
    isDragging: false
  })
}));

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}));

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null
          }))
        }))
      }))
    }))
  }
}));

jest.mock('@/lib/utils/deleteUtils', () => ({
  deleteEntityWithCalendarEvent: jest.fn(),
  deleteWorkoutCascade: jest.fn()
}));

jest.mock('@/lib/utils/calendarUtils', () => ({
  CALENDAR_SOURCES: {
    MEAL: 'meal',
    PLANNED_MEAL: 'planned_meal',
    EXPENSE: 'expense',
    WORKOUT: 'workout',
    CARDIO: 'cardio',
    SPORT: 'sport'
  },
  getCalendarEventRoute: jest.fn()
}));

jest.mock('@/lib/utils/eventStyleMap', () => ({
  getEventStyle: jest.fn(() => ({
    colorClass: 'bg-blue-500',
    Icon: null
  }))
}));

jest.mock('@/lib/date', () => ({
  toYMD: jest.fn((date) => date.toISOString().split('T')[0])
}));

jest.mock('@/components/modals/PlanMealModal', () => {
  return function MockPlanMealModal({ isOpen, onClose, onSuccess, selectedDate }) {
    if (!isOpen) return null;
    return (
      <div data-testid="plan-meal-modal">
        <div>Plan Meal Modal</div>
        <button onClick={onClose}>Close</button>
        <button onClick={onSuccess}>Success</button>
        <div>Selected Date: {selectedDate}</div>
      </div>
    );
  };
});

jest.mock('@/components/SharedDeleteButton', () => {
  return function MockSharedDeleteButton({ onClick, size, 'aria-label': ariaLabel, label }) {
    return (
      <button 
        onClick={onClick} 
        aria-label={ariaLabel}
        data-testid="delete-button"
      >
        {label || 'Delete'}
      </button>
    );
  };
});

describe('CalendarView', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should render calendar with selected day styling', () => {
    render(<CalendarView />);
    
    const calendar = screen.getByTestId('calendar');
    expect(calendar).toBeInTheDocument();
  });

  it('should apply selected-day class to the selected date', () => {
    render(<CalendarView />);
    
    // Find today's date element
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayElement = screen.getByTestId(`calendar-day-${todayString}`);
    
    // Check that the selected-day class is applied
    expect(todayElement).toHaveClass('selected-day');
    expect(todayElement).toHaveAttribute('data-selected', 'true');
  });

  it('should update selected date when clicking on a different day', () => {
    render(<CalendarView />);
    
    // Find tomorrow's date element
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowString = tomorrow.toISOString().split('T')[0];
    const tomorrowElement = screen.getByTestId(`calendar-day-${tomorrowString}`);
    
    // Click on tomorrow's date
    fireEvent.click(tomorrowElement);
    
    // Check that tomorrow now has the selected styling
    expect(tomorrowElement).toHaveClass('selected-day');
    expect(tomorrowElement).toHaveAttribute('data-selected', 'true');
  });

  it('should show + button on selected day', () => {
    render(<CalendarView />);
    
    // Find today's date element
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const todayElement = screen.getByTestId(`calendar-day-${todayString}`);
    
    // Check that the + button is present (it should be in the tileContent)
    const addButton = todayElement.querySelector('[aria-label="Add event for this day"]');
    expect(addButton).toBeInTheDocument();
  });
});
