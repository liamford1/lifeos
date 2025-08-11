'use client';

import React from 'react';
import { MdDragIndicator } from 'react-icons/md';
import { getEventStyle } from '@/lib/utils/eventStyleMap';
import dayjs from 'dayjs';
import { EventItemProps, DragState } from '@/types/calendar';

/**
 * EventItem Component
 * 
 * Displays individual calendar events with:
 * - Event content (title, description, time)
 * - Drag handle for rescheduling
 * - Delete functionality
 * - Compact and full view modes
 * 
 * @param event - The calendar event to display
 * @param isBeingDragged - Whether this event is currently being dragged
 * @param onEventClick - Callback function when event is clicked
 * @param onDelete - Callback function to delete the event
 * @param onStartDrag - Callback function when drag operation starts
 * @param isCompact - Whether to display in compact mode
 */
const EventItem: React.FC<EventItemProps> = React.memo(({ 
  event, 
  isBeingDragged = false, 
  onEventClick, 
  onDelete, 
  onStartDrag,
  isCompact = false 
}) => {
  const { colorClass, Icon } = getEventStyle(event.source);
  
  const handleStartDrag = (e: React.PointerEvent | React.KeyboardEvent, dragState: DragState) => {
    e.stopPropagation();
    onStartDrag(e as React.PointerEvent, dragState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      e.stopPropagation();
      handleStartDrag(e, { 
        id: event.id, 
        originalStart: event.start_time, 
        originalEnd: event.end_time || event.start_time
      });
    }
  };
  
  if (isCompact) {
    return (
      <div
        data-testid={`calendar-event-${event.id}`}
        className={`w-[85%] h-4 text-xs truncate whitespace-nowrap overflow-hidden text-ellipsis rounded px-0.5 py-0.25 text-left ${colorClass} relative group cursor-pointer`}
        data-dragging={isBeingDragged}
        style={{
          opacity: isBeingDragged ? 0.5 : 1,
          transform: isBeingDragged ? 'scale(0.95)' : 'none',
          transition: 'opacity 0.2s, transform 0.2s'
        }}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onEventClick(event);
        }}
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center min-w-0 flex-1">
            {Icon && <Icon className="inline mr-0.5 align-text-bottom flex-shrink-0" size={14} />} 
            <span className="truncate">{event.title}</span>
          </div>
          {/* Drag handle */}
          <div
            data-testid={`calendar-event-drag-handle-${event.id}`}
            className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 data-[dragging=true]:opacity-100 transition-opacity ml-1 flex-shrink-0 p-0.5 rounded hover:bg-black/20 cursor-grab active:cursor-grabbing w-4 h-4 flex items-center justify-center"
            onPointerDown={(e: React.PointerEvent) => {
              handleStartDrag(e, { 
                id: event.id, 
                originalStart: event.start_time, 
                originalEnd: event.end_time || event.start_time
              });
            }}
            aria-label="Drag event"
            role="button"
            tabIndex={0}
            data-dragging={isBeingDragged}
            onKeyDown={handleKeyDown}
          >
            <MdDragIndicator size={12} className="text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group relative bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all duration-200 cursor-pointer ${
        isBeingDragged ? 'opacity-50 scale-95' : ''
      }`}
      onClick={() => onEventClick(event)}
    >
      {/* Event content */}
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
          {Icon && <Icon className="w-4 h-4 text-white" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-medium text-foreground truncate">{event.title}</h4>
            {event.start_time && (
              <span className="text-sm text-gray-400 flex-shrink-0 ml-2">
                {dayjs(event.start_time).format('h:mm A')}
              </span>
            )}
          </div>
          {event.description && (
            <p className="text-sm text-gray-400 line-clamp-2">{event.description}</p>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          data-testid={`calendar-event-drag-handle-${event.id}`}
          className="p-1.5 rounded-md hover:bg-gray-100/10 transition-colors"
          onPointerDown={(e: React.PointerEvent) => {
            handleStartDrag(e, { 
              id: event.id, 
              originalStart: event.start_time, 
              originalEnd: event.end_time || event.start_time
            });
          }}
          aria-label="Drag event"
        >
          <MdDragIndicator size={14} className="text-gray-400" />
        </button>
        <button
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            onDelete(event.id);
          }}
          className="p-1.5 rounded-md hover:bg-red-500/10 transition-colors"
          aria-label="Delete event"
        >
          <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
});

EventItem.displayName = 'EventItem';

export default EventItem;
