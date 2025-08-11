import dynamic from 'next/dynamic';

// Loading component for pages
const PageLoadingSpinner = ({ message = "Loading page..." }) => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
  </div>
);

// Heavy page components that can be lazy-loaded
export const CalendarView = dynamic(
  () => import('./CalendarView'),
  {
    loading: () => <PageLoadingSpinner message="Loading calendar..." />,
    ssr: false
  }
);

export const FitnessHomeContent = dynamic(
  () => import('./FitnessHomeContent'),
  {
    loading: () => <PageLoadingSpinner message="Loading fitness dashboard..." />,
    ssr: false
  }
);

export const FinancesHomeContent = dynamic(
  () => import('./FinancesHomeContent'),
  {
    loading: () => <PageLoadingSpinner message="Loading finances dashboard..." />,
    ssr: false
  }
);

// Feature components that are not immediately needed
export const SetEditor = dynamic(
  () => import('./SetEditor'),
  {
    loading: () => <div className="animate-pulse bg-surface rounded p-4">Loading set editor...</div>,
    ssr: false
  }
);

export const CalendarIconClient = dynamic(
  () => import('./client/CalendarIconClient'),
  {
    loading: () => <div className="animate-pulse bg-surface rounded p-2 w-6 h-6"></div>,
    ssr: false
  }
);

export const StretchingClient = dynamic(
  () => import('./fitness/StretchingClient'),
  {
    loading: () => <div className="animate-pulse bg-surface rounded p-4">Loading stretching...</div>,
    ssr: false
  }
);
