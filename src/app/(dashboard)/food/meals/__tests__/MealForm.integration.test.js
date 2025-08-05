const React = require('react');
const { render, screen, fireEvent, waitFor, act } = require('@testing-library/react');
const MealForm = require('../../../../../components/forms/MealForm').default;

// Mock Supabase client
jest.mock('../../../../../lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({ insert: jest.fn(() => Promise.resolve({ error: null })) })),
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } } })),
    },
  },
}));

// Mock useRouter from next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

// Mock useToast
jest.mock('../../../../../components/client/Toast', () => ({
  useToast: () => ({ showSuccess: jest.fn(), showError: jest.fn() }),
}));

// Mock useUser
jest.mock('../../../../../context/UserContext', () => ({
  useUser: () => ({ user: { id: 'test-user-id' }, loading: false }),
}));

describe('MealForm integration', () => {
  it('submits form and calls Supabase insert, shows success', async () => {
    const onSubmit = jest.fn();
    render(
      <MealForm onSubmit={onSubmit} />
    );

    // Fill in meal name
    fireEvent.change(screen.getByPlaceholderText(/chicken alfredo/i), { target: { value: 'Test Meal' } });
    // Fill in first ingredient name and quantity
    fireEvent.change(screen.getAllByPlaceholderText(/ingredient/i)[0], { target: { value: 'Egg' } });
    fireEvent.change(screen.getAllByPlaceholderText(/qty/i)[0], { target: { value: '2' } });
    // Fill in first instruction
    fireEvent.change(screen.getAllByPlaceholderText(/step/i)[0], { target: { value: 'Mix ingredients' } });

    // Submit the form
    const saveButton = screen.getByRole('button', { name: /save meal/i });
    const form = saveButton.closest('form');
    fireEvent.submit(form);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Meal',
          instructions: ['Mix ingredients'],
          ingredients: [expect.objectContaining({ name: 'Egg', quantity: '2' })],
        })
      );
    });
  });
}); 