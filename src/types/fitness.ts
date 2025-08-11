import { IconType } from 'react-icons';

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
export interface Workout extends FitnessActivity {
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
  workoutData: Workout[];
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
  workouts: Workout[];
  onWorkoutCreate?: (workout: Partial<Workout>) => Promise<void>;
  onWorkoutUpdate?: (workoutId: string, updates: Partial<Workout>) => Promise<void>;
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
export interface WorkoutSession {
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
export interface CalendarEvent {
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
  workouts: Workout[];
  cardioSessions: CardioActivity[];
  sportsSessions: SportActivity[];
  onEventClick?: (event: CalendarEvent) => void;
  onEventCreate?: (event: Partial<CalendarEvent>) => Promise<void>;
  onEventUpdate?: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  onEventDelete?: (eventId: string) => Promise<void>;
  isLoading?: boolean;
}

/**
 * Workout form modal interface
 */
export interface WorkoutFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout?: Workout;
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
