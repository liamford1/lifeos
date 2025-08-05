import handleMealSuggestions from '../mealSuggestions';

// Mock the AI module
jest.mock('@/lib/ai', () => ({
  getStructuredResponse: jest.fn(),
  isOpenAIAvailable: jest.fn().mockReturnValue(true),
}));

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

describe('handleMealSuggestions', () => {
  let mockSupabase;
  let mockGetStructuredResponse;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn(),
        refreshSession: jest.fn(),
      },
    };

    const { createRouteHandlerClient } = require('@supabase/auth-helpers-nextjs');
    createRouteHandlerClient.mockReturnValue(mockSupabase);

    // Mock AI response
    mockGetStructuredResponse = require('@/lib/ai').getStructuredResponse;
  });

  it('should return meal suggestions for valid request', async () => {
    // Mock authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock AI response
    const mockSuggestions = [
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
    ];

    mockGetStructuredResponse.mockResolvedValue(mockSuggestions);

    // Create mock request
    const request = createMockRequest({
      pantryItems: [
        { name: 'pasta', quantity: 500, unit: 'g' },
        { name: 'tomato sauce', quantity: 2, unit: 'cups' },
      ],
      preferences: { cuisine: 'italian' },
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].name).toBe('Pasta with Tomato Sauce');
    expect(data.pantryItems).toBe(2);
    expect(data.timestamp).toBeDefined();
  });

  it('should handle empty pantry gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockSuggestions = [
      {
        name: 'Simple Scrambled Eggs',
        description: 'Basic breakfast option',
        ingredients: [
          { name: 'eggs', quantity: 2, unit: 'pieces' },
          { name: 'butter', quantity: 1, unit: 'tbsp' },
        ],
        prepTime: 5,
        cookTime: 10,
        difficulty: 'easy',
        instructions: ['Crack eggs', 'Scramble', 'Serve'],
        estimatedServings: 1,
        missingIngredients: ['eggs', 'butter'],
      },
    ];

    mockGetStructuredResponse.mockResolvedValue(mockSuggestions);

    const request = createMockRequest({
      pantryItems: [],
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toHaveLength(1);
    expect(data.pantryItems).toBe(0);
  });

  it('should return 401 for unauthenticated user', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    });

    const request = createMockRequest({
      pantryItems: [],
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Not authenticated');
  });

  it('should return 400 for invalid pantryItems', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const request = createMockRequest({
      pantryItems: 'not an array',
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('pantryItems must be an array');
  });

  it('should handle AI service errors gracefully', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockGetStructuredResponse.mockRejectedValue(new Error('OPENAI_API_KEY environment variable is required'));

    const request = createMockRequest({
      pantryItems: [],
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.error).toBe('AI service not configured');
  });

  it('should handle rate limit errors', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    mockGetStructuredResponse.mockRejectedValue(new Error('Rate limit exceeded'));

    const request = createMockRequest({
      pantryItems: [],
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBe('AI service temporarily unavailable');
  });

  it('should validate and sanitize AI response', async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    // Mock incomplete AI response
    const incompleteSuggestions = [
      {
        name: 'Test Meal',
        // Missing other required fields
      },
    ];

    mockGetStructuredResponse.mockResolvedValue(incompleteSuggestions);

    const request = createMockRequest({
      pantryItems: [],
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].name).toBe('Test Meal');
    expect(data.suggestions[0].description).toBe('');
    expect(data.suggestions[0].ingredients).toEqual([]);
    expect(data.suggestions[0].prepTime).toBe(15);
    expect(data.suggestions[0].cookTime).toBe(30);
    expect(data.suggestions[0].difficulty).toBe('medium');
    expect(data.suggestions[0].instructions).toEqual([]);
    expect(data.suggestions[0].estimatedServings).toBe(2);
    expect(data.suggestions[0].missingIngredients).toEqual([]);
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

    const mockSuggestions = [
      {
        name: 'Refreshed Session Meal',
        description: 'Test meal after session refresh',
        ingredients: [],
        prepTime: 10,
        cookTime: 20,
        difficulty: 'easy',
        instructions: ['Test instruction'],
        estimatedServings: 1,
        missingIngredients: [],
      },
    ];

    mockGetStructuredResponse.mockResolvedValue(mockSuggestions);

    const request = createMockRequest({
      pantryItems: [],
      preferences: {},
      dietaryRestrictions: [],
    });

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].name).toBe('Refreshed Session Meal');
    expect(mockSupabase.auth.refreshSession).toHaveBeenCalled();
  });

  it('should authenticate using Bearer token when provided', async () => {
    // Mock authenticated user with Bearer token
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });

    const mockSuggestions = [
      {
        name: 'Bearer Token Meal',
        description: 'Test meal with Bearer token auth',
        ingredients: [],
        prepTime: 5,
        cookTime: 10,
        difficulty: 'easy',
        instructions: ['Test instruction'],
        estimatedServings: 1,
        missingIngredients: [],
      },
    ];

    mockGetStructuredResponse.mockResolvedValue(mockSuggestions);

    const request = createMockRequest(
      {
        pantryItems: [],
        preferences: {},
        dietaryRestrictions: [],
      },
      {
        'authorization': 'Bearer test-token-123'
      }
    );

    const response = await handleMealSuggestions(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.suggestions).toHaveLength(1);
    expect(data.suggestions[0].name).toBe('Bearer Token Meal');
    
    // Verify that getUser was called with the token
    expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('test-token-123');
  });
}); 