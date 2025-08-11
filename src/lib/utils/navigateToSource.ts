import type { NextRouter } from 'next/router';
import type { CalendarSource } from './calendarUtils';

// Reusable navigation helper for calendar event sources
// Usage: navigateToSource(source, sourceId, router)

export function navigateToSource(
  source: CalendarSource, 
  sourceId: string | number, 
  router: NextRouter
): void {
  if (!source || !sourceId) {
    return;
  }

  let path: string | null = null;
  switch (source) {
    case 'meal':
      // Meals now use modals instead of pages, so redirect to food page
      path = `/food`;
      break;
    case 'cardio':
      path = `/fitness`; // Redirect to fitness page since cardio details are now in modal
      break;
    case 'workout':
      path = `/fitness`; // Redirect to fitness page since workout details are now in modal
      break;
    case 'note':
      path = `/scratchpad/${sourceId}`;
      break;
    // Add more cases as needed
    default:
      return;
  }

  if (path) {
    void router.push(path);
  }
}
