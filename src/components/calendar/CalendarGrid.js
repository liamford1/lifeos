'use client';

import React from 'react';
import Calendar from "@/components/client/CalendarClient";
import 'react-calendar/dist/Calendar.css';
import dayjs from 'dayjs';
import { toYMD } from '@/lib/date';
import EventItem from './EventItem';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';

/**
 * CalendarGrid Component
 * 
 * Contains the actual calendar grid/timeline display
 * Handles calendar tile content, event rendering, and day selection
 */
export default function CalendarGrid({
  selectedDate,
  onDateChange,
  events,
  draggingId,
  onEventClick,
  onDelete,
  onStartDrag,
  onShowDayEvents,
  onShowSelectionModalForDate
}) {
  return (
    <div className="w-full my-6">
      <div className="w-full">
        <div className="p-2 rounded">
          <Calendar
            onChange={onDateChange}
            value={selectedDate}
            locale="en-US"
            className="!w-full !text-white !max-w-none"
            tileClassName={({ date, view }) => {
              if (view !== 'month') return '';
              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              return isSelectedDay ? 'selected-day' : '';
            }}
            tileProps={({ date, view }) => {
              if (view !== 'month') return {};
              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              return {
                'data-selected': isSelectedDay,
                className: isSelectedDay ? 'selected-day' : ''
              };
            }}
            tileContent={({ date, view }) => {
              if (view !== 'month') return null;

              const eventsOnThisDay = events.filter(event =>
                dayjs(event.start_time).isSame(date, 'day')
              );

              const isSelectedDay = dayjs(date).isSame(selectedDate, 'day');
              const dateStr = dayjs(date).format('YYYY-MM-DD');
              
              return (
                <div 
                  className="space-y-1 overflow-hidden w-full h-full max-w-full relative"
                  data-testid={`calendar-daycell-${dateStr}`}
                  data-date={dateStr}
                  data-selected={isSelectedDay}
                >
                  {/* Date Number and Menu Button */}
                  <div className="flex items-center justify-between mb-1">
                    <div className={`text-sm font-medium ${
                      isSelectedDay ? 'text-primary' : 'text-foreground'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowDayEvents(date);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onShowDayEvents(date);
                        }
                      }}
                      className="w-4 h-4 text-gray-400 hover:text-white transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                      aria-label="View events for this day"
                      role="button"
                      tabIndex={0}
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* Events preview (only show first 2) */}
                  <div className="space-y-0.5">
                    {eventsOnThisDay.slice(0, 2).map((event) => {
                      const isBeingDragged = draggingId === event.id;
                      
                      return (
                        <EventItem
                          key={event.id}
                          event={event}
                          isBeingDragged={isBeingDragged}
                          isCompact={true}
                          onEventClick={onEventClick}
                          onDelete={onDelete}
                          onStartDrag={onStartDrag}
                        />
                      );
                    })}
                    {eventsOnThisDay.length > 2 && (
                      <div className="text-[10px] text-gray-400">
                        +{eventsOnThisDay.length - 2} more
                      </div>
                    )}
                  </div>
                  
                  {/* Add button for selected day */}
                  {isSelectedDay && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowSelectionModalForDate(toYMD(date));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          e.stopPropagation();
                          onShowSelectionModalForDate(toYMD(date));
                        }
                      }}
                      className="absolute -bottom-0.5 -right-1.5 w-6 h-6 bg-primary text-white rounded-full text-sm flex items-center justify-center hover:bg-primary/80 transition-colors shadow-sm z-10 cursor-pointer"
                      aria-label="Add event for this day"
                      role="button"
                      tabIndex={0}
                    >
                      +
                    </div>
                  )}
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
