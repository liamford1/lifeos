import dynamic from 'next/dynamic';

// Loading component for modals
const ModalLoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex items-center justify-center p-8">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Fitness Modals
export const RecentActivityModal = dynamic(
  () => import('./fitness/RecentActivityModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading activity data..." />,
    ssr: false
  }
);

export const StretchingMobilityModal = dynamic(
  () => import('./fitness/StretchingMobilityModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading stretching exercises..." />,
    ssr: false
  }
);

export const DailyActivityModal = dynamic(
  () => import('./fitness/DailyActivityModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading daily activity..." />,
    ssr: false
  }
);

export const PlanWorkoutModal = dynamic(
  () => import('./fitness/PlanWorkoutModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading workout planner..." />,
    ssr: false
  }
);

export const WorkoutSessionModal = dynamic(
  () => import('./fitness/WorkoutSessionModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading workout session..." />,
    ssr: false
  }
);

export const WorkoutDetailsModal = dynamic(
  () => import('./fitness/WorkoutDetailsModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading workout details..." />,
    ssr: false
  }
);

export const CardioDetailsModal = dynamic(
  () => import('./fitness/CardioDetailsModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading cardio details..." />,
    ssr: false
  }
);

// Food Modals
export const MealDetailsModal = dynamic(
  () => import('./MealDetailsModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading meal details..." />,
    ssr: false
  }
);

export const CookingSessionModal = dynamic(
  () => import('./CookingSessionModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading cooking session..." />,
    ssr: false
  }
);

export const PlanMealModal = dynamic(
  () => import('./PlanMealModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading meal planner..." />,
    ssr: false
  }
);

export const AddMealModal = dynamic(
  () => import('./AddMealModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading meal form..." />,
    ssr: false
  }
);

export const MealsModal = dynamic(
  () => import('./MealsModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading meals..." />,
    ssr: false
  }
);

export const PantryModal = dynamic(
  () => import('./PantryModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading pantry..." />,
    ssr: false
  }
);

export const AddReceiptModal = dynamic(
  () => import('./AddReceiptModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading receipt form..." />,
    ssr: false
  }
);

// Form Modals
export const AIMealSuggestionsModal = dynamic(
  () => import('../forms/AIMealSuggestionsModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading AI suggestions..." />,
    ssr: false
  }
);

export const ManualPantryItemModal = dynamic(
  () => import('../forms/ManualPantryItemModal'),
  {
    loading: () => <ModalLoadingSpinner message="Loading pantry item form..." />,
    ssr: false
  }
);
