import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AddReceiptModal from '../AddReceiptModal';

// Mock the dependencies
jest.mock('@/context/UserContext', () => ({
  useUser: () => ({
    user: { id: 'test-user-id' },
    loading: false
  })
}));

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => Promise.resolve({
            data: [
              {
                id: '1',
                store_name: 'Test Store',
                scanned_at: '2024-01-01T00:00:00Z'
              }
            ],
            error: null
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: { id: 'new-receipt-id' },
            error: null
          }))
        }))
      }))
    }))
  }
}));

jest.mock('@/components/client/Toast', () => ({
  useToast: () => ({
    showSuccess: jest.fn(),
    showError: jest.fn()
  })
}));

describe('AddReceiptModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders nothing when isOpen is false', () => {
    render(<AddReceiptModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText('Add Receipt')).not.toBeInTheDocument();
  });

  test('renders modal when isOpen is true', async () => {
    render(<AddReceiptModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Receipt')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Add items from a receipt to your pantry inventory')).toBeInTheDocument();
    expect(screen.getByText('Store Name')).toBeInTheDocument();
    expect(screen.getByText('Add Items')).toBeInTheDocument();
    expect(screen.getByText('Past Receipts')).toBeInTheDocument();
  });

  test('closes modal when close button is clicked', async () => {
    render(<AddReceiptModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Receipt')).toBeInTheDocument();
    });
    
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('shows past receipts section', async () => {
    render(<AddReceiptModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Past Receipts')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Test Store')).toBeInTheDocument();
  });

  test('adds item to list when Add Item button is clicked', async () => {
    render(<AddReceiptModal isOpen={true} onClose={mockOnClose} />);
    
    await waitFor(() => {
      expect(screen.getByText('Add Receipt')).toBeInTheDocument();
    });
    
    // Fill in item details
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[1], { target: { value: 'Test Item' } }); // Item name
    fireEvent.change(inputs[2], { target: { value: '2' } }); // Qty
    fireEvent.change(inputs[3], { target: { value: 'pieces' } }); // Unit
    
    // Click Add Item button
    const addItemButton = screen.getByText('+ Add Item');
    fireEvent.click(addItemButton);
    
    // Check that item appears in the list
    await waitFor(() => {
      expect(screen.getByText('Test Item')).toBeInTheDocument();
    });
  });
}); 