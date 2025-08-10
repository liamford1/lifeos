import handleCreateMeal from '@/lib/api/meal/createMeal';

// Mock Supabase
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: jest.fn(),
}));

// Mock Next.js cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// Mock Response constructor
global.Response = jest.fn().mockImplementation((body, options) => ({
  status: options?.status || 200,
  json: jest.fn().mockResolvedValue(typeof body === 'string' ? JSON.parse(body) : body),
  headers: options?.headers || {},
}));

// Helper function to create mock request
function createMockRequest(body, headers = {}) {
  return {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((name) => headers[name] || null),
    },
  };
}

describe('handleCreateMeal', () => {
  let mockSupabase;
  let mockInsert;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock insert function
    mockInsert = jest.fn(() => ({
      select: jest.fn(),
    }));

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        refreshSession: jest.fn(),
      },
      from: jest.fn(() => ({
        insert: mockInsert,
      })),
    };

    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    createRouteHandlerClient.mockReturnValue(mockSupabase);
  });

  it('should create a meal successfully for authenticated user', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful meal insertion
    const mockSelect = jest.fn().mockResolvedValue({
      data: [{ id: 'meal-456' }],
      error: null,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    // Create mock request with meal data
    const mealData = {
      name: 'Test Chicken Parmesan',
      description: 'A classic Italian-American dish',
      servings: 4,
      prep_time: 15,
      cook_time: 25,
      instructions: [
        'Pound chicken breasts, season, and marinate.',
        'Coat with breadcrumbs and fry until golden.'
      ],
      ingredients: [
        { name: 'Chicken Breast', quantity: 2, unit: 'pieces' },
        { name: 'Parmesan Cheese', quantity: 100, unit: 'grams' }
      ],
      notes: 'Serve with pasta and marinara sauce'
    };

    const request = createMockRequest(mealData);

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mealId).toBe('meal-456');
    
    // Verify the meal was inserted with user_id and created_at
    expect(mockSupabase.from).toHaveBeenCalledWith('meals');
    expect(mockInsert).toHaveBeenCalledWith([{
      ...mealData,
      user_id: 'user-123',
      created_at: expect.any(String),
    }]);
    expect(mockSelect).toHaveBeenCalledWith('id');
  });

  it('should return 401 for unauthenticated user', async () => {
    // Mock unauthenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest({
      name: 'Test Meal',
      description: 'Test description',
    });

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should handle database errors gracefully', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock database error
    const mockSelect = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database constraint violation' },
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    const request = createMockRequest({
      name: 'Test Meal',
      description: 'Test description',
    });

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Database constraint violation');
  });

  it('should authenticate using Bearer token when provided', async () => {
    // Mock authenticated user with Bearer token
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful meal insertion
    const mockSelect = jest.fn().mockResolvedValue({
      data: [{ id: 'meal-789' }],
      error: null,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    const request = createMockRequest(
      {
        name: 'Bearer Token Meal',
        description: 'Test meal with Bearer token auth',
      },
      {
        'authorization': 'Bearer test-token-123'
      }
    );

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mealId).toBe('meal-789');
    
    // Verify that getUser was called with the token
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('test-token-123');
  });

  it('should attempt session refresh when auth session is missing', async () => {
    // Mock initial auth failure with session missing error
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Auth session missing!' },
    });

    // Mock successful session refresh
    mockSupabase.auth.refreshSession.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful second getUser call after refresh
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful meal insertion
    const mockSelect = jest.fn().mockResolvedValue({
      data: [{ id: 'meal-refresh-123' }],
      error: null,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    const request = createMockRequest({
      name: 'Session Refresh Meal',
      description: 'Test meal after session refresh',
    });

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mealId).toBe('meal-refresh-123');
    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
  });

  it('should handle invalid JSON payload gracefully', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Create request with invalid JSON
    const request = {
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON')),
      headers: {
        get: jest.fn(() => null),
      },
    };

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Invalid request');
  });

  it('should handle missing required fields gracefully', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock successful meal insertion (even with minimal data)
    const mockSelect = jest.fn().mockResolvedValue({
      data: [{ id: 'meal-minimal-123' }],
      error: null,
    });
    mockInsert.mockReturnValue({
      select: mockSelect,
    });

    // Create request with minimal data
    const request = createMockRequest({
      name: 'Minimal Meal',
      // Missing other fields
    });

    const response = await handleCreateMeal(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.mealId).toBe('meal-minimal-123');
    
    // Verify the meal was inserted with user_id and created_at
    expect(mockSupabase.from).toHaveBeenCalledWith('meals');
    expect(mockInsert).toHaveBeenCalledWith([{
      name: 'Minimal Meal',
      user_id: 'user-123',
      created_at: expect.any(String),
    }]);
  });
});
