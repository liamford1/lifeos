import dynamic from 'next/dynamic';

// Loading component for forms
const FormLoadingSpinner = ({ message = "Loading form..." }) => (
  <div className="flex items-center justify-center p-6">
    <div className="text-center">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Heavy form components that can be lazy-loaded
export const WorkoutForm = dynamic(
  () => import('./WorkoutForm'),
  {
    loading: () => <FormLoadingSpinner message="Loading workout form..." />,
    ssr: false
  }
);

export const MealForm = dynamic(
  () => import('./MealForm'),
  {
    loading: () => <FormLoadingSpinner message="Loading meal form..." />,
    ssr: false
  }
);

export const PlannedWorkoutForm = dynamic(
  () => import('./PlannedWorkoutForm'),
  {
    loading: () => <FormLoadingSpinner message="Loading planned workout form..." />,
    ssr: false
  }
);

export const StretchingForm = dynamic(
  () => import('./StretchingForm'),
  {
    loading: () => <FormLoadingSpinner message="Loading stretching form..." />,
    ssr: false
  }
);

export const CardioForm = dynamic(
  () => import('./CardioForm'),
  {
    loading: () => <FormLoadingSpinner message="Loading cardio form..." />,
    ssr: false
  }
);

export const SportForm = dynamic(
  () => import('./SportForm'),
  {
    loading: () => <FormLoadingSpinner message="Loading sport form..." />,
    ssr: false
  }
);

export const AIMealSuggestionsModal = dynamic(
  () => import('./AIMealSuggestionsModal'),
  {
    loading: () => <FormLoadingSpinner message="Loading AI suggestions..." />,
    ssr: false
  }
);

export const ManualPantryItemModal = dynamic(
  () => import('./ManualPantryItemModal'),
  {
    loading: () => <FormLoadingSpinner message="Loading pantry item form..." />,
    ssr: false
  }
);
