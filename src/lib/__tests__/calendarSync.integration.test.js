const dayjs = require('dayjs');

// Mock Supabase
jest.mock('../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        error: null
      }))
    }))
  }
}));

describe('Calendar Sync Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set default end time for planned meals', async () => {
    const { createCalendarEventForEntity } = require('../calendarSync');
    const { supabase } = require('../supabaseClient');
    
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    supabase.from = mockFrom;

    const entity = {
      id: 'test-id',
      user_id: 'test-user-id',
      meal_name: 'Test Meal',
      meal_time: 'dinner',
      planned_date: '2024-01-15'
    };

    // The function creates a local date at noon to avoid timezone issues
    const localDate = new Date(2024, 0, 15, 12, 0, 0); // January 15, 2024 at noon
    const expectedStartTime = localDate.toISOString();
    const expectedEndTime = dayjs(expectedStartTime).add(1, 'hour').toISOString();

    await createCalendarEventForEntity('planned_meal', entity);

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Dinner: Test Meal',
      description: '',
      start_time: expectedStartTime,
      end_time: expectedEndTime, // Should be set to 1 hour later
      source: 'planned_meal',
      source_id: 'test-id'
    }]);
  });

  it('should set default end time for workouts', async () => {
    const { createCalendarEventForEntity } = require('../calendarSync');
    const { supabase } = require('../supabaseClient');
    
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    supabase.from = mockFrom;

    const entity = {
      id: 'test-id',
      user_id: 'test-user-id',
      title: 'Test Workout',
      date: '2024-01-15',
      notes: 'Test notes'
    };

    // The function uses entity.date for start_time
    const expectedStartTime = new Date('2024-01-15').toISOString();
    const expectedEndTime = dayjs(expectedStartTime).add(1, 'hour').toISOString();

    await createCalendarEventForEntity('workout', entity);

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Workout: Test Workout',
      description: 'Test notes',
      start_time: expectedStartTime,
      end_time: expectedEndTime, // Should be set to 1 hour later
      source: 'workout',
      source_id: 'test-id'
    }]);
  });

  it('should use provided end time when available', async () => {
    const { createCalendarEventForEntity } = require('../calendarSync');
    const { supabase } = require('../supabaseClient');
    
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    supabase.from = mockFrom;

    const entity = {
      id: 'test-id',
      user_id: 'test-user-id',
      title: 'Test Workout',
      date: '2024-01-15',
      end_time: '2024-01-15T12:00:00.000Z',
      notes: 'Test notes'
    };

    // The function uses entity.date for start_time, not entity.start_time
    const expectedStartTime = new Date('2024-01-15').toISOString();

    await createCalendarEventForEntity('workout', entity);

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Workout: Test Workout',
      description: 'Test notes',
      start_time: expectedStartTime,
      end_time: '2024-01-15T12:00:00.000Z', // Should use provided end time
      source: 'workout',
      source_id: 'test-id'
    }]);
  });
});
