import { renderHook, act } from '@testing-library/react';
import { useCalendarDragAndDrop } from '../useCalendarDragAndDrop';

describe('useCalendarDragAndDrop', () => {
  const mockOnDrop = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useCalendarDragAndDrop({ onDrop: mockOnDrop }));

    expect(result.current.draggingId).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(typeof result.current.startDrag).toBe('function');
    expect(typeof result.current.moveDrag).toBe('function');
    expect(typeof result.current.endDrag).toBe('function');
  });

  it('should start drag when startDrag is called', () => {
    const { result } = renderHook(() => useCalendarDragAndDrop({ onDrop: mockOnDrop }));

    const mockEvent = {
      clientX: 100,
      clientY: 200
    };

    const dragState = {
      id: 'test-event-1',
      originalStart: '2024-01-01T10:00:00Z',
      originalEnd: '2024-01-01T11:00:00Z'
    };

    act(() => {
      result.current.startDrag(mockEvent, dragState);
    });

    expect(result.current.draggingId).toBe('test-event-1');
    expect(result.current.isDragging).toBe(true);
  });

  it('should not start drag if movement is less than threshold', () => {
    const { result } = renderHook(() => useCalendarDragAndDrop({ onDrop: mockOnDrop }));

    const mockEvent = {
      clientX: 100,
      clientY: 200
    };

    const dragState = {
      id: 'test-event-1',
      originalStart: '2024-01-01T10:00:00Z',
      originalEnd: '2024-01-01T11:00:00Z'
    };

    // Start drag
    act(() => {
      result.current.startDrag(mockEvent, dragState);
    });

    // Move very little (less than 5px threshold)
    const smallMoveEvent = {
      clientX: 102,
      clientY: 201
    };

    act(() => {
      result.current.moveDrag(smallMoveEvent);
    });

    // End drag
    const endEvent = {
      clientX: 102,
      clientY: 201
    };

    const computeTargetDate = jest.fn(() => '2024-01-02T00:00:00Z');

    act(() => {
      result.current.endDrag(endEvent, { computeTargetDate });
    });

    // Should not call onDrop because drag didn't start (movement was too small)
    expect(mockOnDrop).not.toHaveBeenCalled();
  });

  it('should call onDrop when drag completes successfully', () => {
    const { result } = renderHook(() => useCalendarDragAndDrop({ onDrop: mockOnDrop }));

    const mockEvent = {
      clientX: 100,
      clientY: 200
    };

    const dragState = {
      id: 'test-event-1',
      originalStart: '2024-01-01T10:00:00Z',
      originalEnd: '2024-01-01T11:00:00Z'
    };

    // Start drag
    act(() => {
      result.current.startDrag(mockEvent, dragState);
    });

    // Move enough to trigger drag start (more than 5px)
    const moveEvent = {
      clientX: 110,
      clientY: 210
    };

    act(() => {
      result.current.moveDrag(moveEvent);
    });

    // End drag
    const endEvent = {
      clientX: 110,
      clientY: 210
    };

    const computeTargetDate = jest.fn(() => '2024-01-02T00:00:00Z');

    act(() => {
      result.current.endDrag(endEvent, { computeTargetDate });
    });

    // Should call onDrop with correct parameters
    expect(mockOnDrop).toHaveBeenCalledWith({
      id: 'test-event-1',
      newStartISO: '2024-01-02T00:00:00Z',
      originalStart: '2024-01-01T10:00:00Z',
      originalEnd: '2024-01-01T11:00:00Z'
    });

    // Should reset dragging state
    expect(result.current.draggingId).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });

  it('should handle drag end without computeTargetDate', () => {
    const { result } = renderHook(() => useCalendarDragAndDrop({ onDrop: mockOnDrop }));

    const mockEvent = {
      clientX: 100,
      clientY: 200
    };

    const dragState = {
      id: 'test-event-1',
      originalStart: '2024-01-01T10:00:00Z',
      originalEnd: '2024-01-01T11:00:00Z'
    };

    // Start drag
    act(() => {
      result.current.startDrag(mockEvent, dragState);
    });

    // Move enough to trigger drag start
    const moveEvent = {
      clientX: 110,
      clientY: 210
    };

    act(() => {
      result.current.moveDrag(moveEvent);
    });

    // End drag without computeTargetDate
    const endEvent = {
      clientX: 110,
      clientY: 210
    };

    act(() => {
      result.current.endDrag(endEvent, {});
    });

    // Should not call onDrop because no target date was computed
    expect(mockOnDrop).not.toHaveBeenCalled();

    // Should still reset dragging state
    expect(result.current.draggingId).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });
});
