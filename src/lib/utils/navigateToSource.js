// Reusable navigation helper for calendar event sources
// Usage: navigateToSource(source, sourceId, router)

export function navigateToSource(source, sourceId, router) {
  if (!source || !sourceId) {
    return;
  }

  let path = null;
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
    case 'scratchpad':
      path = `/scratchpad/${sourceId}`;
      break;
    // Add more cases as needed
    default:
      return;
  }

  router.push(path);
} 