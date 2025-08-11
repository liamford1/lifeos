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
  user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  } | null;
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

// Meal planning types
export interface MealPlan {
  id: string;
  date: string;
  meal_time: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  meal_id: string;
  user_id: string;
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
