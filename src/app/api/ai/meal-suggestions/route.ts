import handleMealSuggestions from '@/lib/api/ai/mealSuggestions';

export async function POST(req: Request) {
  return handleMealSuggestions(req);
} 