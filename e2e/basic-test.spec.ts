/// <reference types="@playwright/test" />
import { test, expect } from '@playwright/test';

test('Basic page load test', async ({ page }) => {
  // Go to the auth page
  await page.goto('http://localhost:3000/auth');
  
  // Verify the page loads
  await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
  
  // Fill in login credentials
  await page.getByPlaceholder('Email').fill('test@example.com');
  await page.getByPlaceholder('Password').fill('password123');
  
  // Click the login button
  await page.getByRole('button', { name: /log in/i }).click();
  
  // Wait for dashboard to load
  await expect(page.locator('text=Planner')).toBeVisible({ timeout: 10000 });
  
  // Verify we're on the dashboard
  await expect(page).toHaveURL(/\/$/);
  
  // Check that navigation links are present
  await expect(page.getByRole('link', { name: /food/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /fitness/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /finances/i })).toBeVisible();
}); 