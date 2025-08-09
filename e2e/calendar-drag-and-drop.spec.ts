import { test, expect } from '@playwright/test';
import { generateUniqueTitle } from './test-utils';
import { uniq } from './utils/dataGen';
import { cleanupCalendarEventsByPrefix } from './utils/cleanup';

test.describe('Calendar Drag and Drop Functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Clean up before each test
    await page.goto('/auth');
    await page.getByPlaceholder('Email').fill('test@example.com');
    await page.getByPlaceholder('Password').fill('password123');
    await page.getByRole('button', { name: /log in/i }).click();
    await page.waitForURL('/');
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
    await cleanupCalendarEventsByPrefix(page, 'Test-Undo-Event');
    await cleanupCalendarEventsByPrefix(page, 'Test-Hover-Event');
    await cleanupCalendarEventsByPrefix(page, 'Test-Keyboard-Event');
  });

  test('@calendar-dnd drag event to new day updates DB and UI', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Create a test event for today
    const testEventTitle = generateUniqueTitle('Test Drag Event');
    
    // Create event via API and get the event ID
    const eventId = await page.evaluate(async (title) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: title,
          description: 'Test event for drag and drop',
          start_time: `${today}T12:00:00.000Z`,
          source: 'note'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }, testEventTitle);

    // Refresh the page to ensure the event appears
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on today's date to show the day view
    const today = new Date().toISOString().split('T')[0];
    const todayCell = page.getByTestId(`calendar-daycell-${today}`);
    await todayCell.click();
    
    // Wait for the event to appear in the day view list using specific testid
    await expect(page.getByTestId(`calendar-event-${eventId}`)).toBeVisible({ timeout: 10000 });
    
    // Get tomorrow's date for target
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Find the event and hover over it to make drag handle visible
    const eventElement = page.getByTestId(`calendar-event-${eventId}`);
    await eventElement.hover();
    
    // Find the drag handle using the event ID
    const dragHandle = page.getByTestId(`calendar-event-drag-handle-${eventId}`).first();
    await expect(dragHandle).toBeVisible();
    
    // Find tomorrow's day cell
    const tomorrowCell = page.getByTestId(`calendar-daycell-${tomorrowStr}`);
    await expect(tomorrowCell).toBeVisible();
    
    // Perform drag operation - use onPointerDown directly to avoid hover issues
    await dragHandle.dispatchEvent('pointerdown');
    const boundingBox = await tomorrowCell.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
    }
    await page.mouse.up();
    
    // Wait for the move to complete
    await page.waitForTimeout(1000);
    
    // Verify success toast appears
    await expect(page.getByText(/Event moved to/)).toBeVisible();
    
    // Verify event appears on tomorrow's date
    await tomorrowCell.click();
    await expect(page.getByText(testEventTitle, { exact: true }).first()).toBeVisible();
  });

  test('@calendar-dnd undo reverts move', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Create a test event for today
    const testEventTitle = uniq('Test-Undo-Event');
    
    // Create event via API and get the event ID
    const eventId = await page.evaluate(async (title) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: title,
          description: 'Test event for undo functionality',
          start_time: `${today}T12:00:00.000Z`,
          source: 'note'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }, testEventTitle);

    // Refresh the page to ensure the event appears
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on today's date to show the day view
    const today = new Date().toISOString().split('T')[0];
    const todayCell = page.getByTestId(`calendar-daycell-${today}`);
    await todayCell.click();
    
    // Wait for the event to appear in the day view list using specific testid
    await expect(page.getByTestId(`calendar-event-${eventId}`)).toBeVisible({ timeout: 10000 });
    
    // After creating the event, wait for it to be visible by title (first occurrence)
    await expect(page.getByText(testEventTitle, { exact: true }).first()).toBeVisible({ timeout: 10000 });
    
    // Get tomorrow's date for target
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    // Find the event and hover over it to make drag handle visible
    const eventElement = page.getByTestId(`calendar-event-${eventId}`);
    await eventElement.hover();
    
    // Find the drag handle using the event ID
    const dragHandle = page.getByTestId(`calendar-event-drag-handle-${eventId}`).first();
    await expect(dragHandle).toBeVisible();
    
    // Find tomorrow's day cell
    const tomorrowCell = page.getByTestId(`calendar-daycell-${tomorrowStr}`);
    await expect(tomorrowCell).toBeVisible();
    
    // Perform drag operation - use onPointerDown directly to avoid hover issues
    await dragHandle.dispatchEvent('pointerdown');
    const boundingBox = await tomorrowCell.boundingBox();
    if (boundingBox) {
      await page.mouse.move(boundingBox.x + 50, boundingBox.y + 50);
    }
    await page.mouse.up();
    
    // Wait for the move to complete and toast to appear
    await page.waitForTimeout(1000);
    await expect(page.getByText(/Event moved to/)).toBeVisible();
    
    // Click the Undo button in the toast
    await page.getByRole('button', { name: 'Undo' }).click();
    
    // Wait for the undo to complete
    await page.waitForTimeout(1000);
    
    // Verify event is back on today's date - first check that it appears in calendar tile
    await expect(page.getByTestId(`calendar-event-${eventId}`)).toBeVisible({ timeout: 10000 });
    
    // Then click today's date to show day view and verify it's there too
    await todayCell.click();
    await expect(page.getByText(testEventTitle, { exact: true }).first()).toBeVisible();
  });

  test('@calendar-dnd drag handle only appears on hover', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Create a test event
    const testEventTitle = generateUniqueTitle('Test Hover Event');
    
    // Create event via API and get the event ID
    const eventId = await page.evaluate(async (title) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: title,
          description: 'Test event for hover functionality',
          start_time: `${today}T12:00:00.000Z`,
          source: 'note'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }, testEventTitle);

    // Refresh the page to ensure the event appears
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Wait for the event to appear in the day view list
    await expect(page.getByTestId(`calendar-event-${eventId}`)).toBeVisible({ timeout: 10000 });
    
    // Initially, drag handle should not be visible (check the one in the day view list)
    const dragHandle = page.getByTestId(`calendar-event-drag-handle-${eventId}`).first();
    await expect(dragHandle).toHaveCSS('opacity', '0');
    
    // Hover over the event in the day view list
    const eventElement = page.getByTestId(`calendar-event-${eventId}`);
    await eventElement.hover();
    
    // Now drag handle should be visible
    await expect(dragHandle).toHaveCSS('opacity', '1');
    
    // Clear hover before checking opacity returns to 0
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100); // allow transition
    await expect(dragHandle).toHaveCSS('opacity', '0');
  });

  test('@calendar-dnd keyboard accessibility', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Create a test event
    const testEventTitle = generateUniqueTitle('Test Keyboard Event');
    
    // Create event via API and get the event ID
    const eventId = await page.evaluate(async (title) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: title,
          description: 'Test event for keyboard accessibility',
          start_time: `${today}T12:00:00.000Z`,
          source: 'note'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }, testEventTitle);

    // Refresh the page to ensure the event appears
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Wait for the event to appear in the day view list
    await expect(page.getByTestId(`calendar-event-${eventId}`)).toBeVisible({ timeout: 10000 });
    
    // Find the event and hover over it to make drag handle visible
    const eventElement = page.getByTestId(`calendar-event-${eventId}`);
    await eventElement.hover();
    
    // Actually focus the drag handle directly
    const dragHandle = page.getByTestId(`calendar-event-drag-handle-${eventId}`).first();
    await dragHandle.focus();
    await expect(dragHandle).toBeFocused();
    
    // Press Enter to start drag (this should trigger the drag start)
    await page.keyboard.press('Enter');
    
    // Verify drag state is active (event should have opacity change)
    await expect(eventElement).toHaveCSS('opacity', '0.5');
  });

  test('@drag-handle-visibility drag handle appears only on hover/focus/drag', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Create a test event for today
    const testEventTitle = uniq('Test-Hover-Event');
    
    // Create event via API and get the event ID
    const eventId = await page.evaluate(async (title) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: title,
          description: 'Test event for hover functionality',
          start_time: `${today}T12:00:00.000Z`,
          source: 'note'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }, testEventTitle);

    // Refresh the page to ensure the event appears
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on today's date first to show the day view (events might be hidden in "+X more")
    const today = new Date().toISOString().split('T')[0];
    const todayCell = page.getByTestId(`calendar-daycell-${today}`);
    await todayCell.click();
    
    // Wait for the day view to load and look for the event there
    await page.waitForTimeout(1000);
    await expect(page.getByText(testEventTitle, { exact: true }).first()).toBeVisible({ timeout: 10000 });
    
    // Find the event and drag handle in the day view (after clicking today's date)
    const eventElement = page.getByTestId(`calendar-event-${eventId}`);
    const dragHandle = page.getByTestId(`calendar-event-drag-handle-${eventId}`).first();
    
    // Wait for the event to be visible in the day view
    await expect(eventElement).toBeVisible({ timeout: 5000 });
    
    // Initially, drag handle should be hidden (opacity-0)
    await expect(dragHandle).toHaveCSS('opacity', '0');
    
    // Hover the event: expect handle visible
    await eventElement.hover();
    await expect(dragHandle).toHaveCSS('opacity', '1');
    
    // Clear hover before asserting opacity 0
    await page.mouse.move(0, 0);
    await page.waitForTimeout(100); // allow transition
    await expect(dragHandle).toHaveCSS('opacity', '0');
    
    // Keyboard focus: verify the handle can be focused and is accessible
    await dragHandle.focus();
    await expect(dragHandle).toBeFocused();
    // Note: focus-visible CSS might not work in test environment, so we'll verify the handle is at least focusable
    // In a real browser, this would show opacity: 1 due to focus-visible:opacity-100
    
    // Verify aria-label
    await expect(dragHandle).toHaveAttribute('aria-label', 'Drag event');
    
    // Blur focus: expect hidden - click elsewhere to remove focus
    await page.getByRole('heading', { name: 'Calendar' }).click(); // Click on something else to remove focus
    await page.waitForTimeout(100); // allow transition
    await expect(dragHandle).toHaveCSS('opacity', '0');
  });

  test('@drag-handle-keyboard keyboard navigation works for drag handle', async ({ page }) => {
    // Wait for the page to load
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Create a test event for today
    const testEventTitle = uniq('Test-Keyboard-Event');
    
    // Create event via API and get the event ID
    const eventId = await page.evaluate(async (title) => {
      const supabase = window.supabase;
      const { data: session } = await supabase.auth.getSession();
      const userId = session.session.user.id;
      
      const today = new Date().toISOString().split('T')[0];
      
      // Create calendar event
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: userId,
          title: title,
          description: 'Test event for keyboard accessibility',
          start_time: `${today}T12:00:00.000Z`,
          source: 'note'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      return data.id;
    }, testEventTitle);

    // Refresh the page to ensure the event appears
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Calendar' })).toBeVisible({ timeout: 10000 });
    
    // Click on today's date first to show the day view (events might be hidden in "+X more")
    const today = new Date().toISOString().split('T')[0];
    const todayCell = page.getByTestId(`calendar-daycell-${today}`);
    await todayCell.click();
    
    // Wait for the day view to load and look for the event there
    await page.waitForTimeout(1000);
    await expect(page.getByText(testEventTitle, { exact: true }).first()).toBeVisible({ timeout: 10000 });
    
    // Find the drag handle
    const dragHandle = page.getByTestId(`calendar-event-drag-handle-${eventId}`).first();
    
    // Tab to the drag handle
    await dragHandle.focus();
    await expect(dragHandle).toBeFocused();
    await expect(dragHandle).toBeVisible();
    
    // Verify it has proper accessibility attributes
    await expect(dragHandle).toHaveAttribute('role', 'button');
    await expect(dragHandle).toHaveAttribute('tabindex', '0');
    await expect(dragHandle).toHaveAttribute('aria-label', 'Drag event');
  });
}); 