'use client';

import React from 'react';
import dayjs from 'dayjs';
import EventItem from './EventItem';
import { getEventStyle } from '@/lib/utils/eventStyleMap';

/**
 * EventList Component
 * 
 * Displays a list of events for a selected day or period
 * Used in day events modal and other event list contexts
 */
export default function EventList({ 
  events, 
  draggingId,
  onEventClick, 
  onDelete, 
  onStartDrag,
  emptyMessage = "No events planned for this date"
}) {
  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100/10 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-gray-400 text-sm">{emptyMessage}</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {events.map((event) => {
        const isBeingDragged = draggingId === event.id;
        
        return (
          <EventItem
            key={event.id}
            event={event}
            isBeingDragged={isBeingDragged}
            onEventClick={onEventClick}
            onDelete={onDelete}
            onStartDrag={onStartDrag}
          />
        );
      })}
    </div>
  );
}
