

/**
 * Base fitness activity interface
 */
export interface FitnessActivity {
  id: string;
  user_id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Workout interface
 */
export interface WorkoutActivity extends FitnessActivity {
  workout_type: string;
  duration?: number;
  intensity?: string;
  status: 'planned' | 'in_progress' | 'completed';
  exercises?: WorkoutExercise[];
}

/**
 * Workout exercise interface
 */
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets: ExerciseSet[];
  notes?: string;
}

/**
 * Exercise set interface
 */
export interface ExerciseSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest_time?: number;
}

/**
 * Cardio activity interface
 */
export interface CardioActivity extends FitnessActivity {
  activity_type: string;
  duration: number;
  distance?: number;
  calories_burned?: number;
  heart_rate?: number;
  performance_notes?: string;
  status: 'planned' | 'in_progress' | 'completed';
}

/**
 * Sport activity interface
 */
export interface SportActivity extends FitnessActivity {
  sport_type: string;
  duration: number;
  opponent?: string;
  score?: string;
  performance_notes?: string;
  status: 'planned' | 'in_progress' | 'completed';
}

/**
 * Stretching activity interface
 */
export interface StretchingActivity extends FitnessActivity {
  stretching_type: string;
  duration: number;
  flexibility_notes?: string;
  status: 'planned' | 'in_progress' | 'completed';
}

/**
 * Fitness goal interface
 */
export interface FitnessGoal {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'abandoned';
  created_at?: string;
  updated_at?: string;
}

/**
 * Fitness stats interface
 */
export interface FitnessStats {
  totalWorkouts: number;
  totalCardio: number;
  totalSports: number;
  totalStretching: number;
  weeklyWorkouts: number;
  weeklyCardio: number;
  weeklySports: number;
  weeklyStretching: number;
  monthlyWorkouts: number;
  monthlyCardio: number;
  monthlySports: number;
  monthlyStretching: number;
  averageWorkoutDuration: number;
  averageCardioDuration: number;
  totalCaloriesBurned: number;
  weeklyCaloriesBurned: number;
  monthlyCaloriesBurned: number;
}

/**
 * Weekly metrics interface for FitnessStats component
 */
export interface WeeklyMetrics {
  totalWorkoutsThisWeek: number;
  totalCardioThisWeek: number;
  totalSportsThisWeek: number;
  totalCaloriesBurned: number;
  thisWeekCalories: number;
  mostCommonActivity: string;
}

/**
 * Chart data interface for fitness statistics
 */
export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

/**
 * Props for FitnessHome component
 */
export interface FitnessHomeProps {
  user?: {
    id: string;
    email?: string;
  } | null;
}

/**
 * Props for FitnessStats component
 */
export interface FitnessStatsProps {
  cardioData: CardioActivity[];
  workoutData: WorkoutActivity[];
  sportsData: SportActivity[];
  dataLoading?: boolean;
}

/**
 * Props for FitnessGoals component
 */
export interface FitnessGoalsProps {
  goals: FitnessGoal[];
  isLoading?: boolean;
  onGoalUpdate?: (goalId: string, updates: Partial<FitnessGoal>) => Promise<void>;
  onGoalDelete?: (goalId: string) => Promise<void>;
}

/**
 * Props for ExerciseLibrary component
 */
export interface ExerciseLibraryProps {
  exercises: Exercise[];
  onExerciseSelect?: (exercise: Exercise) => void;
  isLoading?: boolean;
}

/**
 * Exercise interface
 */
export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscle_groups: string[];
  equipment?: string[];
  instructions?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  image_url?: string;
}

/**
 * Props for WorkoutPlanner component
 */
export interface WorkoutPlannerProps {
  workouts: WorkoutActivity[];
  onWorkoutCreate?: (workout: Partial<WorkoutActivity>) => Promise<void>;
  onWorkoutUpdate?: (workoutId: string, updates: Partial<WorkoutActivity>) => Promise<void>;
  onWorkoutDelete?: (workoutId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Workout form data interface
 */
export interface WorkoutFormData {
  title: string;
  workout_type: string;
  date: string;
  start_time?: string;
  end_time?: string;
  notes?: string;
  intensity?: string;
}

/**
 * Cardio form data interface
 */
export interface CardioFormData {
  title: string;
  activity_type: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration: number;
  distance?: number;
  calories_burned?: number;
  heart_rate?: number;
  performance_notes?: string;
}

/**
 * Sport form data interface
 */
export interface SportFormData {
  title: string;
  sport_type: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration: number;
  opponent?: string;
  score?: string;
  performance_notes?: string;
}

/**
 * Stretching form data interface
 */
export interface StretchingFormData {
  title: string;
  stretching_type: string;
  date: string;
  start_time?: string;
  end_time?: string;
  duration: number;
  flexibility_notes?: string;
}

/**
 * Workout planning data interface
 */
export interface WorkoutPlan {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  planned_date: string;
  workout_type: string;
  exercises: PlannedExercise[];
  status: 'draft' | 'planned' | 'completed';
  created_at?: string;
  updated_at?: string;
}

/**
 * Planned exercise interface
 */
export interface PlannedExercise {
  id: string;
  workout_plan_id: string;
  exercise_name: string;
  planned_sets: number;
  planned_reps?: number;
  planned_weight?: number;
  planned_duration?: number;
  notes?: string;
  order: number;
}

/**
 * Workout session interface
 */
export interface WorkoutSessionActivity {
  id: string;
  workout_plan_id?: string;
  user_id: string;
  title: string;
  start_time: string;
  end_time?: string;
  exercises: WorkoutSessionExercise[];
  notes?: string;
  status: 'in_progress' | 'completed' | 'paused';
}

/**
 * Workout session exercise interface
 */
export interface WorkoutSessionExercise {
  id: string;
  workout_session_id: string;
  exercise_name: string;
  sets: WorkoutSessionSet[];
  notes?: string;
  order: number;
}

/**
 * Workout session set interface
 */
export interface WorkoutSessionSet {
  id: string;
  exercise_id: string;
  set_number: number;
  reps?: number;
  weight?: number;
  duration?: number;
  distance?: number;
  rest_time?: number;
  completed: boolean;
  completed_at?: string;
}

/**
 * Activity selector interface
 */
export interface ActivityOption {
  id: string;
  name: string;
  type: FitnessActivityType;
  icon: string;
  description?: string;
  color: string;
}

/**
 * Event manager interface
 */
export interface FitnessCalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time?: string;
  end_time?: string;
  type: FitnessActivityType;
  status: FitnessActivityStatus;
  source_id: string;
}

/**
 * Workout calendar interface
 */
export interface WorkoutCalendarProps {
  workouts: WorkoutActivity[];
  cardioSessions: CardioActivity[];
  sportsSessions: SportActivity[];
  onEventClick?: (event: FitnessCalendarEvent) => void;
  onEventCreate?: (event: Partial<FitnessCalendarEvent>) => Promise<void>;
  onEventUpdate?: (eventId: string, updates: Partial<FitnessCalendarEvent>) => Promise<void>;
  onEventDelete?: (eventId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Workout form modal interface
 */
export interface WorkoutFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout?: WorkoutActivity;
  onSave: (workout: WorkoutFormData) => Promise<void>;
  mode: 'create' | 'edit';
}

/**
 * Fitness activity type
 */
export type FitnessActivityType = 'workout' | 'cardio' | 'sport' | 'stretching';

/**
 * Fitness activity status
 */
export type FitnessActivityStatus = 'planned' | 'in_progress' | 'completed';

/**
 * Workout intensity levels
 */
export type WorkoutIntensity = 'low' | 'medium' | 'high';

/**
 * Exercise difficulty levels
 */
export type ExerciseDifficulty = 'beginner' | 'intermediate' | 'advanced';

/**
 * Goal status types
 */
export type GoalStatus = 'active' | 'completed' | 'abandoned';

/**
 * Workout plan status types
 */
export type WorkoutPlanStatus = 'draft' | 'planned' | 'completed';

/**
 * Workout session status types
 */
export type WorkoutSessionStatus = 'in_progress' | 'completed' | 'paused';

/**
 * Calendar event for workout planning
 */
export interface WorkoutCalendarEvent {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time?: string;
  source: string;
  source_id: string;
  description?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Drag and drop event data
 */
export interface DragDropEvent {
  id: string;
  newStartISO: string;
  originalStart: string;
  originalEnd?: string;
}

/**
 * Calendar day data for workout planning
 */
export interface CalendarDay {
  date: string;
  dayOfWeek: string;
  isToday: boolean;
  isSelected: boolean;
  events: WorkoutCalendarEvent[];
}

/**
 * Props for PlanWorkoutModal component
 */
export interface PlanWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Props for EventManager component
 */
export interface EventManagerProps {
  user?: {
    id: string;
    email?: string;
  } | null;
  isAddModalOpen: boolean;
  isDayEventsModalOpen: boolean;
  selectedDayForEvents: Date | null;
  fitnessEvents: WorkoutCalendarEvent[];
  onAddEventClose: () => void;
  onDayEventsClose: () => void;
  onEventClick: (event: WorkoutCalendarEvent) => Promise<void>;
}

/**
 * Props for WorkoutCalendar component
 */
export interface WorkoutCalendarComponentProps {
  user?: {
    id: string;
    email?: string;
  } | null;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: WorkoutCalendarEvent) => Promise<void>;
  onAddEvent: (dateStr: string) => void;
  onViewDayEvents: (date: Date) => void;
}

/**
 * Props for WorkoutFormModal component
 */
export interface WorkoutFormModalComponentProps {
  isOpen: boolean;
  selectedDate: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * New event form data
 */
export interface NewEventFormData {
  title: string;
  start_time: string;
  end_time: string;
  description: string;
}

/**
 * Calendar event update payload
 */
export interface CalendarEventUpdatePayload {
  id: string;
  userId: string;
  newStart: string;
  newEnd?: string;
  updateLinkedEntity: boolean;
}

/**
 * Calendar event insert payload
 */
export interface CalendarEventInsertPayload {
  event: {
    user_id: string;
    title: string;
    description?: string | null;
    start_time: string;
    end_time: string;
  };
}
