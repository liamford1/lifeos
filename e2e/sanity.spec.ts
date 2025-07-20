import { test, expect } from '@playwright/test';

test('homepage shows Planner or Fitness', async ({ page }) => {
  await page.goto('/');
  const found = await page.locator('text=Planner, text=Fitness').first();
  await expect(found).toBeVisible();
}); 