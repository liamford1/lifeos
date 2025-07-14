import handleCreateMeal from '@/lib/api/meal/createMeal';

export async function POST(req) {
  return handleCreateMeal(req);
} 