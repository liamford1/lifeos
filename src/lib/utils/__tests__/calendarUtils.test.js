import { addCalendarEvent } from '../calendarUtils';
import { CALENDAR_SOURCES } from '../calendarUtils';
import dayjs from 'dayjs';

// Mock Supabase
jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        error: null
      }))
    }))
  }
}));

describe('addCalendarEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should set default end time to 1 hour after start time when end time is not provided', async () => {
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    
    // Mock the supabase client
    const { supabase } = require('../../supabaseClient');
    supabase.from = mockFrom;

    const startTime = '2024-01-15T10:00:00.000Z';
    const expectedEndTime = dayjs(startTime).add(1, 'hour').toISOString();

    await addCalendarEvent({
      userId: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      startTime,
      endTime: null, // No end time provided
      source: CALENDAR_SOURCES.MEAL,
      sourceId: 'test-source-id'
    });

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      start_time: startTime,
      end_time: expectedEndTime,
      source: CALENDAR_SOURCES.MEAL,
      source_id: 'test-source-id'
    }]);
  });

  it('should use provided end time when available', async () => {
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    
    // Mock the supabase client
    const { supabase } = require('../../supabaseClient');
    supabase.from = mockFrom;

    const startTime = '2024-01-15T10:00:00.000Z';
    const providedEndTime = '2024-01-15T12:00:00.000Z';

    await addCalendarEvent({
      userId: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      startTime,
      endTime: providedEndTime, // End time provided
      source: CALENDAR_SOURCES.MEAL,
      sourceId: 'test-source-id'
    });

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      start_time: startTime,
      end_time: providedEndTime, // Should use provided end time
      source: CALENDAR_SOURCES.MEAL,
      source_id: 'test-source-id'
    }]);
  });

  it('should handle empty string end time as null', async () => {
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    
    // Mock the supabase client
    const { supabase } = require('../../supabaseClient');
    supabase.from = mockFrom;

    const startTime = '2024-01-15T10:00:00.000Z';
    const expectedEndTime = dayjs(startTime).add(1, 'hour').toISOString();

    await addCalendarEvent({
      userId: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      startTime,
      endTime: '', // Empty string should be treated as null
      source: CALENDAR_SOURCES.MEAL,
      sourceId: 'test-source-id'
    });

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      start_time: startTime,
      end_time: expectedEndTime,
      source: CALENDAR_SOURCES.MEAL,
      source_id: 'test-source-id'
    }]);
  });

  it('should handle undefined end time as null', async () => {
    const mockInsert = jest.fn(() => ({ error: null }));
    const mockFrom = jest.fn(() => ({ insert: mockInsert }));
    
    // Mock the supabase client
    const { supabase } = require('../../supabaseClient');
    supabase.from = mockFrom;

    const startTime = '2024-01-15T10:00:00.000Z';
    const expectedEndTime = dayjs(startTime).add(1, 'hour').toISOString();

    await addCalendarEvent({
      userId: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      startTime,
      endTime: undefined, // Undefined should be treated as null
      source: CALENDAR_SOURCES.MEAL,
      sourceId: 'test-source-id'
    });

    expect(mockFrom).toHaveBeenCalledWith('calendar_events');
    expect(mockInsert).toHaveBeenCalledWith([{
      user_id: 'test-user-id',
      title: 'Test Event',
      description: 'Test Description',
      start_time: startTime,
      end_time: expectedEndTime,
      source: CALENDAR_SOURCES.MEAL,
      source_id: 'test-source-id'
    }]);
  });
});
