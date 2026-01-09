import { test, expect } from '@playwright/test';

test.describe('Header Removal', () => {
  test('should remove header by swiping left', async ({ page }) => {
    // Skip mobile browsers - they need touch events instead of mouse events
    test.skip(
      test.info().project.name === 'Mobile Chrome' || test.info().project.name === 'Mobile Safari',
      'Mobile browsers require touch events - this test uses mouse events for desktop'
    );

    await page.goto('/sample', { waitUntil: 'domcontentloaded' });
    // Wait for the sample content to load by checking for specific text
    await expect(page.getByText('This is an actual org file')).toBeVisible();

    // Find a header that we can safely remove for testing
    // Using the "Tap on any header to open it" header as it's a simple top-level header
    const targetHeader = page
      .locator('.header')
      .filter({ hasText: 'Tap on any header to open it' })
      .first();

    // Verify the header exists before swiping
    await expect(targetHeader).toBeVisible();

    // Get the bounding box of the header to calculate swipe coordinates
    const box = await targetHeader.boundingBox();
    expect(box).toBeTruthy();

    // Perform swipe left gesture using mouse events
    // The remove condition is: dragStartX >= 2 * currentDragX
    // If we start at x=300 and end at x=100, then 300 >= 200, which triggers removal
    const startX = box.x + box.width * 0.8; // Start at 80% of width
    const endX = box.x - 50; // Swipe past the left edge to ensure removal
    const y = box.y + box.height / 2; // Middle of the header vertically

    // Use Playwright's mouse API to simulate the swipe
    await page.mouse.move(startX, y);
    await page.mouse.down();
    await page.mouse.move(endX, y, { steps: 10 });
    await page.mouse.up();

    // Wait for the remove animation to complete
    // The animation uses spring physics and the handleRest callback removes the header
    await page.waitForTimeout(800);

    // Verify the header is no longer visible after the animation
    await expect(targetHeader).not.toBeVisible({ timeout: 5000 });
  });
});
