// Reusable navigation helper for calendar event sources
// Usage: navigateToSource(source, sourceId, router)

export function navigateToSource(source, sourceId, router) {
  if (!source || !sourceId) {
    return;
  }

  let path = null;
  switch (source) {
    case 'meal':
      path = `/food/meals/${sourceId}/cook`;
      break;
    case 'cardio':
      path = `/fitness/cardio/${sourceId}`;
      break;
    case 'workout':
      path = `/fitness/workouts/${sourceId}`;
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