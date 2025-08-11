import { IconType } from 'react-icons';
import { CALENDAR_SOURCES } from '@/lib/utils/calendarUtils';

/**
 * Calendar event interface representing events displayed in the calendar
 */
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string; // ISO string
  end_time?: string; // ISO string
  source: keyof typeof CALENDAR_SOURCES;
  source_id: string | number;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Event style configuration for different calendar sources
 */
export interface EventStyle {
  colorClass: string;
  Icon: IconType;
}

/**
 * Drag state for calendar events
 */
export interface DragState {
  id: string;
  originalStart: string;
  originalEnd: string;
}

/**
 * Props for CalendarHeader component
 */
export interface CalendarHeaderProps {
  onAddEvent?: () => void;
  onShowSelectionModal?: () => void;
  selectedDate: Date;
  onDateChange?: (date: Date) => void;
}



/**
 * Props for EventItem component
 */
export interface EventItemProps {
  event: CalendarEvent;
  isBeingDragged?: boolean;
  onEventClick: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onStartDrag: (e: React.PointerEvent, dragState: DragState) => void;
  isCompact?: boolean;
}

/**
 * Props for EventList component
 */
export interface EventListProps {
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onDelete: (eventId: string) => void;
  onStartDrag: (e: React.PointerEvent, dragState: DragState) => void;
  draggingId?: string;
}

/**
 * Props for CalendarFilters component
 */
export interface CalendarFiltersProps {
  selectedSources: string[];
  onSourceChange: (sources: string[]) => void;
  availableSources: string[];
}

/**
 * Calendar tile content props from react-calendar
 */
export interface CalendarTileProps {
  date: Date;
  view: string;
}

/**
 * Calendar tile content return type
 */
export interface CalendarTileContent {
  date: Date;
  view: string;
}

/**
 * Day events modal data
 */
export interface DayEventsData {
  date: Date;
  events: CalendarEvent[];
}

/**
 * Planning selection type for calendar events
 */
export type PlanningType = 'meal' | 'workout' | 'cardio' | 'sport' | 'stretching';

/**
 * Planning selection data
 */
export interface PlanningSelection {
  type: PlanningType;
  selectedDate?: Date;
}

/**
 * Fitness event click data
 */
export interface FitnessEventData {
  event: CalendarEvent;
  type: PlanningType;
}

/**
 * Modal state for calendar view
 */
export interface CalendarModalState {
  isMealDetailsOpen: boolean;
  isCookingSessionOpen: boolean;
  isSelectionModalOpen: boolean;
  selectedEvent: CalendarEvent | null;
  selectedDate: Date | null;
  dayEventsData: DayEventsData | null;
}

/**
 * Calendar view state
 */
export interface CalendarViewState {
  selectedDate: Date;
  draggingId?: string;
  modalState: CalendarModalState;
}

/**
 * Calendar event click handler type
 */
export type CalendarEventClickHandler = (event: CalendarEvent) => void;

/**
 * Calendar event delete handler type
 */
export type CalendarEventDeleteHandler = (event: CalendarEvent) => Promise<void>;

/**
 * Calendar drag start handler type
 */
export type CalendarDragStartHandler = (e: React.PointerEvent, dragState: DragState) => void;

/**
 * Calendar day events handler type
 */
export type CalendarDayEventsHandler = (date: Date) => void;

/**
 * Calendar selection modal handler type
 */
export type CalendarSelectionModalHandler = (date: string) => void;
