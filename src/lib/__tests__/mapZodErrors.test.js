const { mapZodErrors } = require('../utils/validationHelpers');

describe('mapZodErrors', () => {
  it('maps a typical Zod error object with two fields', () => {
    const zodError = {
      errors: [
        { path: ['email'], message: 'Invalid email' },
        { path: ['password'], message: 'Password too short' },
      ],
    };
    expect(mapZodErrors(zodError)).toEqual({
      email: 'Invalid email',
      password: 'Password too short',
    });
  });

  it('handles empty or null error input gracefully', () => {
    expect(mapZodErrors()).toEqual({});
    expect(mapZodErrors(null)).toEqual({});
    expect(mapZodErrors({})).toEqual({});
  });

  it('ignores errors with missing or invalid path fields', () => {
    const zodError = {
      errors: [
        { path: [], message: 'No path' },
        { path: null, message: 'Null path' },
        { message: 'Missing path' },
      ],
    };
    expect(mapZodErrors(zodError)).toEqual({});
  });
}); 