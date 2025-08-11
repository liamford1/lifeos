// Re-export all types for easy importing
export * from './supabase';
export * from './calendar';
export * from './fitness';

// Common utility types
export interface ApiResponse<T = unknown> {
  data: T | null;
  error: Error | null;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface SortParams {
  field: string;
  direction: 'asc' | 'desc';
}

export interface FilterParams {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' | 'not.in';
  value: string | number | boolean | string[] | number[];
}

// User types - extending Supabase User
export interface AppUser {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}

// Form types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'time' | 'datetime-local';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

export interface FormData {
  [key: string]: string | number | boolean | string[] | number[] | null | undefined;
}

export interface FormErrors {
  [key: string]: string;
}

// Modal types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}

// User session types
export interface UserSession {
  user: AppUser | null;
  session: unknown | null;
  loading: boolean;
}

// Calendar event types
export interface CalendarEventForm {
  title: string;
  description?: string;
  start_time: string;
  end_time?: string;
  source: string;
  source_id: string | number;
}

// Fitness session types
export interface FitnessSession {
  id: string;
  type: 'workout' | 'cardio' | 'sport' | 'stretching';
  started_at: string;
  completed_at?: string;
  duration?: number;
  notes?: string;
}

// Workout specific types
export interface WorkoutData {
  id: string;
  title: string;
  notes?: string;
  start_time: string;
  end_time?: string;
  exercises?: Exercise[];
  sets?: Set[];
}

export interface Exercise {
  id?: string;
  name: string;
  notes?: string;
  sets?: Set[];
}

export interface Set {
  id?: string;
  reps: number;
  weight: number | null;
  created_at?: string;
}

export interface ExerciseWithSets extends Exercise {
  sets: Set[];
}

export interface SetsByExercise {
  [exerciseId: string]: Set[];
}

// Fitness activity types
export interface FitnessActivity {
  id: string;
  type: 'workout' | 'cardio' | 'sport' | 'stretching';
  title: string;
  date: string;
  duration?: number;
  notes?: string;
  status?: 'planned' | 'completed';
  start_time?: string;
  end_time?: string;
}

export interface CardioActivity {
  id: string;
  activity_type: string;
  date: string;
  duration_minutes?: number;
  distance_miles?: number;
  calories_burned?: number;
  location?: string;
  notes?: string;
  status: 'planned' | 'completed';
  start_time?: string;
  end_time?: string;
  in_progress?: boolean;
}

export interface SportsActivity {
  id: string;
  activity_type: string;
  date: string;
  duration_minutes?: number;
  intensity_level?: string;
  location?: string;
  weather?: string;
  participants?: string;
  score?: string;
  performance_notes?: string;
  injuries_or_flags?: string;
  status: 'planned' | 'completed';
  start_time?: string;
  end_time?: string;
  in_progress?: boolean;
}

export interface StretchingActivity {
  id: string;
  date: string;
  duration_minutes?: number;
  focus_areas?: string[];
  notes?: string;
  status: 'planned' | 'completed';
  start_time?: string;
  end_time?: string;
  in_progress?: boolean;
}

// Meal planning types
export interface MealPlan {
  id: string;
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_id: string;
  user_id: string;
}

export interface PlannedMeal {
  id: string;
  meal_id: string;
  planned_date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  user_id: string;
  meal?: Meal;
}

// Financial types
export interface FinancialTransaction {
  id: string;
  type: 'expense' | 'income';
  amount: number;
  description: string;
  category: string;
  date: string;
  user_id: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Search and filter types
export interface SearchParams {
  query: string;
  filters?: FilterParams[];
  sort?: SortParams;
  pagination?: PaginationParams;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// API Response types
export interface CalendarEventsResponse {
  events: CalendarEvent[];
  error?: string;
}

export interface WorkoutResponse {
  workout: WorkoutData;
  exercises: Exercise[];
  sets: Set[];
  error?: string;
}

export interface FitnessActivitiesResponse {
  activities: FitnessActivity[];
  error?: string;
}

// Event style types
export interface EventStyle {
  colorClass: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

// Calendar drag and drop types
export interface DragState {
  id: string;
  originalStart: string;
  originalEnd?: string;
}

export interface CalendarEventClickHandler {
  (event: CalendarEvent): Promise<void>;
}

export interface CalendarEventDeleteHandler {
  (event: CalendarEvent): Promise<void>;
}

export interface CalendarDragStartHandler {
  (e: React.PointerEvent, dragState: DragState): void;
}

// Form component types
export interface FormComponentProps {
  onSubmit: (data: FormData) => void | Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<FormData>;
  loading?: boolean;
  error?: string;
}

// Toast types
export interface ToastOptions {
  duration?: number;
  onUndo?: () => void;
}

// Context types
export interface UserContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  refresh: () => void;
  isAuthenticated: boolean;
  userId: string | undefined;
}

// Import Supabase types
import type { Session, User } from '@supabase/supabase-js';
import type { CalendarEvent } from './calendar';
import type { Meal } from './supabase';
